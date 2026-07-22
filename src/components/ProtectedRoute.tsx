import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from './LoadingScreen';
import { ForceChangePasswordModal } from './ForceChangePasswordModal';
import { ShieldAlert, AlertTriangle, LogOut, RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requiredRole?: string;
  onNavigateLogin?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requiredRole,
  onNavigateLogin
}) => {
  const { 
    currentUser, 
    userProfile, 
    loading, 
    authInitialized, 
    empresaId, 
    authError, 
    isAdmin, 
    logout, 
    refetchProfile 
  } = useAuth();

  // 13 & 16. Wait for authentication & profile before rendering protected routes
  if (loading || !authInitialized) {
    return <LoadingScreen message="Verificando autenticação e permissões de acesso..." />;
  }

  // 10. Show real permission error if Firestore returned permission denied
  if (authError && authError.isPermissionDenied) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 select-none">
        <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-8 max-w-lg w-full shadow-2xl">
          <div className="flex items-center gap-3 text-red-400 mb-4">
            <ShieldAlert className="w-8 h-8 shrink-0" />
            <h2 className="text-xl font-bold">Acesso Não Autorizado — Permissão Insuficiente</h2>
          </div>
          
          <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-4 text-sm text-red-200 mb-6 font-mono leading-relaxed overflow-x-auto">
            {authError.message}
          </div>

          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Seu usuário ({currentUser?.email}) foi autenticado via Firebase Auth, mas as regras de segurança do Firestore (rules) bloquearam a leitura/gravação do seu perfil de usuário (UID: <span className="font-mono text-amber-400">{currentUser?.uid}</span>).
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => refetchProfile()}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </button>
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 select-none">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Esta área exige autenticação com e-mail e senha. Por favor, faça login para continuar.
          </p>
          <button
            onClick={() => onNavigateLogin ? onNavigateLogin() : window.location.reload()}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors shadow-lg"
          >
            Ir para Tela de Login
          </button>
        </div>
      </div>
    );
  }

  // 5. User authenticated but no profile document
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 select-none">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Usuário Não Cadastrado</h2>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Não foi encontrado um cadastro associado ao seu UID no banco de dados. Entre em contato com a administração do SINPA para liberar o seu acesso.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => refetchProfile()}
              className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl text-sm transition-colors"
            >
              Recarregar
            </button>
            <button
              onClick={() => logout()}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-sm transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User profile inactive
  if (!userProfile.ativo && !userProfile.approved) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 select-none">
        <div className="bg-slate-800 border border-amber-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Conta Pendente de Aprovação</h2>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Seu cadastro está aguardando homologação do Sindicato Patronal SINPA. Assim que aprovado, seus serviços estarão disponíveis.
          </p>
          <button
            onClick={() => logout()}
            className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl text-sm transition-colors"
          >
            Sair da Conta
          </button>
        </div>
      </div>
    );
  }

  // Role checks
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 select-none">
        <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Acesso Não Autorizado</h2>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Seu perfil (<span className="capitalize font-semibold text-amber-400">{userProfile.role}</span>) não possui privilégios de Administrador para acessar esta área.
          </p>
          <button
            onClick={() => logout()}
            className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl text-sm transition-colors"
          >
            Trocar de Conta
          </button>
        </div>
      </div>
    );
  }

  if (requiredRole && userProfile.role !== requiredRole && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 select-none">
        <div className="bg-slate-800 border border-amber-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
          <h2 className="text-xl font-bold mb-2">Permissão Insuficiente</h2>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Esta funcionalidade requer o papel de <span className="font-semibold text-amber-400">{requiredRole}</span>.
          </p>
          <button
            onClick={() => logout()}
            className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl text-sm transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  // 17. Ensure empresaId is loaded
  if (!empresaId) {
    return <LoadingScreen message="Carregando dados da empresa vinculada (empresaId)..." />;
  }

  const needsPasswordChange = Boolean(userProfile?.mustChangePassword || userProfile?.firstAccess);

  return (
    <>
      {needsPasswordChange && (
        <ForceChangePasswordModal
          isOpen={true}
          onSuccess={() => refetchProfile()}
        />
      )}
      {children}
    </>
  );
};
