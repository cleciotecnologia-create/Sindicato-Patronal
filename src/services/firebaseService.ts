import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth, ensureAuthReady, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types/auth';

/**
 * Service to manage UID-based Firestore profiles and authorization
 */
export class FirebaseService {
  /**
   * Fetches user profile directly by UID from `usuarios/{uid}` or `users/{uid}`
   */
  static async getUserProfileByUid(uid: string): Promise<UserProfile | null> {
    if (!uid) return null;
    await ensureAuthReady();

    try {
      // 1. Check primary `usuarios/{uid}` document
      const usuarioRef = doc(db, 'usuarios', uid);
      let snap = await getDoc(usuarioRef);

      if (!snap.exists()) {
        // 2. Check secondary/legacy `users/{uid}` document
        const userRef = doc(db, 'users', uid);
        snap = await getDoc(userRef);
      }

      if (snap.exists()) {
        const data = snap.data();
        return {
          uid,
          email: data.email || auth.currentUser?.email || '',
          nome: data.nome || data.displayName || data.name || (data.email ? data.email.split('@')[0] : 'Usuário'),
          displayName: data.displayName || data.nome || data.name || '',
          empresaId: data.empresaId || data.cnpj || 'sinpa_default',
          cnpj: data.cnpj || '',
          phone: data.phone || '',
          companyName: data.companyName || '',
          role: data.role || 'associado',
          ativo: data.ativo !== undefined ? Boolean(data.ativo) : (data.approved !== undefined ? Boolean(data.approved) : true),
          approved: data.approved !== undefined ? Boolean(data.approved) : (data.ativo !== undefined ? Boolean(data.ativo) : true),
          photoURL: data.photoURL || auth.currentUser?.photoURL || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
      }

      return null;
    } catch (error: any) {
      console.warn(`[FirebaseService] Error fetching user profile for UID ${uid}:`, error);
      // Re-throw if permission error so AuthContext can render the exact authorization message
      if (error?.code === 'permission-denied' || error?.message?.includes('insufficient permissions')) {
        throw error;
      }
      return null;
    }
  }

  /**
   * Automatically creates or updates profile by UID upon login
   */
  static async createOrEnsureUserProfile(
    uid: string, 
    email: string, 
    displayName?: string, 
    customRole?: string
  ): Promise<UserProfile> {
    await ensureAuthReady();
    const emailLower = (email || '').toLowerCase();
    
    // Determine admin role based on domain/email privileges
    const isIanOrAdmin = 
      emailLower === 'ianlima.sinpa@gmail.com' ||
      emailLower === 'cleciotecnologia@gmail.com' ||
      emailLower === 'admin@sinpa.org.br' ||
      emailLower.includes('ian') ||
      emailLower.includes('nicolas') ||
      emailLower.includes('admin') ||
      emailLower.includes('presidencia') ||
      emailLower.includes('diretoria') ||
      emailLower.includes('gerencia') ||
      emailLower.includes('gerente') ||
      emailLower.includes('gestor');

    const assignedRole = customRole || (isIanOrAdmin ? 'admin' : 'associado');
    const assignedName = displayName || (emailLower === 'ianlima.sinpa@gmail.com' ? 'IAN Nicolas' : emailLower.split('@')[0]);
    const defaultEmpresaId = isIanOrAdmin ? 'sinpa_admin_master' : 'sinpa_default';
    const nowIso = new Date().toISOString();

    const newProfile: UserProfile = {
      uid,
      email: emailLower,
      nome: assignedName,
      displayName: assignedName,
      empresaId: defaultEmpresaId,
      cnpj: '',
      phone: '',
      companyName: '',
      role: assignedRole,
      ativo: true,
      approved: true,
      photoURL: auth.currentUser?.photoURL || '',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    try {
      // Save directly to `usuarios/{uid}`
      const usuarioRef = doc(db, 'usuarios', uid);
      await setDoc(usuarioRef, {
        ...newProfile,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Sync to `users/{uid}` for complete schema backwards compatibility
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        ...newProfile,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      return newProfile;
    } catch (error: any) {
      console.warn(`[FirebaseService] Could not write profile to Firestore for UID ${uid}:`, error);
      // Return constructed in-memory profile if Firestore write is blocked
      return newProfile;
    }
  }

  /**
   * Updates an existing profile by UID
   */
  static async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    if (!uid) return;
    await ensureAuthReady();

    const payload = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    try {
      const usuarioRef = doc(db, 'usuarios', uid);
      await updateDoc(usuarioRef, payload);

      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, payload);
    } catch (error: any) {
      console.error(`[FirebaseService] Error updating profile for UID ${uid}:`, error);
      handleFirestoreError(error, OperationType.UPDATE, `usuarios/${uid}`);
    }
  }
}
