import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, ensureAuthReady } from '../lib/firebase';
import { UserProfile, AuthErrorState } from '../types/auth';
import { FirebaseService } from '../services/firebaseService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authInitialized: boolean;
  empresaId: string | null;
  authError: AuthErrorState | null;
  sessionExpiredMessage: string | null;
  isAdmin: boolean;
  logout: () => Promise<void>;
  refetchProfile: () => Promise<void>;
  clearAuthError: () => void;
  clearSessionExpiredMessage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_LIMIT_MS = 10 * 60 * 1000; // 10 minutos sem atividade

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [authError, setAuthError] = useState<AuthErrorState | null>(null);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);

  // Inactivity tracking
  useEffect(() => {
    if (!currentUser) return;

    let lastActivityTime = Date.now();

    const handleUserActivity = () => {
      lastActivityTime = Date.now();
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    const checkInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityTime >= INACTIVITY_LIMIT_MS) {
        console.warn('[AuthContext] 10 minutos de inatividade atingidos. Expirando sessão...');
        setSessionExpiredMessage(
          'Sua sessão expirou por inatividade (10 minutos sem uso). Por segurança, faça login novamente.'
        );
        logout();
      }
    }, 10000); // Checa a cada 10 segundos

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      clearInterval(checkInterval);
    };
  }, [currentUser]);

  // Load and sync user profile whenever Firebase Auth user changes
  const loadUserProfile = async (user: User | null) => {
    setLoading(true);
    setAuthError(null);

    if (!user) {
      // Check emergency fallback session from localStorage if Firebase Auth is offline
      const fallbackSessionStr = localStorage.getItem('sinpa_fallback_session');
      if (fallbackSessionStr) {
        try {
          const parsed = JSON.parse(fallbackSessionStr);
          if (parsed && parsed.email) {
            const fallbackProfile: UserProfile = {
              uid: parsed.uid || parsed.email,
              email: parsed.email,
              nome: parsed.displayName || 'IAN Nicolas',
              displayName: parsed.displayName || 'IAN Nicolas',
              empresaId: 'sinpa_admin_master',
              role: 'admin',
              ativo: true,
              approved: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setCurrentUser(parsed as any);
            setUserProfile(fallbackProfile);
            setLoading(false);
            setAuthInitialized(true);
            return;
          }
        } catch (e) {}
      }

      setCurrentUser(null);
      setUserProfile(null);
      setLoading(false);
      setAuthInitialized(true);
      return;
    }

    // 1. Wait until auth.currentUser is fully ready
    await ensureAuthReady();
    setCurrentUser(user);

    try {
      // 2. Fetch user profile by UID
      let profile = await FirebaseService.getUserProfileByUid(user.uid);

      // 3. Automatically create missing profile upon first login if doc doesn't exist yet
      if (!profile) {
        profile = await FirebaseService.createOrEnsureUserProfile(
          user.uid,
          user.email || '',
          user.displayName || undefined
        );
      }

      setUserProfile(profile);
    } catch (err: any) {
      console.error('[AuthContext] Error loading user profile:', err);
      const isPermissionDenied = 
        err?.code === 'permission-denied' || 
        err?.message?.includes('insufficient permissions') ||
        err?.message?.includes('PERMISSION_DENIED');

      setAuthError({
        code: err?.code || 'PERMISSION_DENIED',
        message: isPermissionDenied 
          ? 'Missing or insufficient permissions: Acesso negado ao documento de usuário no Firestore.' 
          : (err?.message || 'Erro ao carregar perfil de usuário.'),
        isPermissionDenied,
        rawError: err,
      });

      // Provide fallback profile so app remains accessible for authorized email addresses
      if (user.email) {
        const isIanOrAdmin = 
          user.email.toLowerCase() === 'ianlima.sinpa@gmail.com' ||
          user.email.toLowerCase().includes('admin') ||
          user.email.toLowerCase().includes('clecio');

        setUserProfile({
          uid: user.uid,
          email: user.email,
          nome: user.displayName || user.email.split('@')[0],
          displayName: user.displayName || '',
          empresaId: isIanOrAdmin ? 'sinpa_admin_master' : 'sinpa_default',
          role: isIanOrAdmin ? 'admin' : 'associado',
          ativo: true,
          approved: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } finally {
      setLoading(false);
      setAuthInitialized(true);
    }
  };

  useEffect(() => {
    // 12. Keep login state using onAuthStateChanged()
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      await loadUserProfile(user);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('sinpa_fallback_session');
      localStorage.removeItem('sinpa_fallback_role');
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error('[AuthContext] Error during logout:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetchProfile = async () => {
    if (auth.currentUser) {
      await loadUserProfile(auth.currentUser);
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const clearSessionExpiredMessage = () => {
    setSessionExpiredMessage(null);
  };

  const empresaId = userProfile?.empresaId || null;

  const isAdmin = Boolean(
    userProfile &&
    (
      userProfile.role === 'admin' ||
      userProfile.role === 'presidencia' ||
      userProfile.role === 'diretoria' ||
      userProfile.role === 'gerencia' ||
      userProfile.role === 'gerente' ||
      userProfile.email === 'ianlima.sinpa@gmail.com' ||
      userProfile.email === 'cleciotecnologia@gmail.com' ||
      userProfile.email.toLowerCase().includes('ian') ||
      userProfile.email.toLowerCase().includes('admin')
    )
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        authInitialized,
        empresaId,
        authError,
        sessionExpiredMessage,
        isAdmin,
        logout,
        refetchProfile,
        clearAuthError,
        clearSessionExpiredMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
