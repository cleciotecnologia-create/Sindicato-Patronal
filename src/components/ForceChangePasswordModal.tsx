import React, { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { FirebaseService } from '../services/firebaseService';
import { ShieldAlert, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface ForceChangePasswordModalProps {
  isOpen: boolean;
  onSuccess?: () => void;
}

export const ForceChangePasswordModal: React.FC<ForceChangePasswordModalProps> = ({
  isOpen,
  onSuccess,
}) => {
  const { currentUser, refetchProfile } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem. Por favor, verifique.');
      return;
    }

    setLoading(true);

    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        await FirebaseService.markPasswordChanged(currentUser.uid);
        await refetchProfile();
        setSuccess(true);
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        throw new Error('Usuário não autenticado no Firebase Auth.');
      }
    } catch (err: any) {
      console.error('[ForceChangePasswordModal] Erro ao alterar senha:', err);
      if (err.code === 'auth/requires-recent-login') {
        setError('Por razões de segurança, faça login novamente para atualizar sua senha.');
      } else {
        setError(err.message || 'Ocorreu um erro ao atualizar a senha. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden p-6 md:p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Primeiro Acesso - Alteração de Senha</h2>
            <p className="text-sm text-slate-500 mt-1">
              Por medida de segurança, você deve redefinir sua senha no primeiro acesso para proteger sua conta.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {success ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="font-semibold text-lg">Senha Alterada com Sucesso!</h3>
            <p className="text-xs text-emerald-600">Redirecionando para o sistema...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 text-sm pr-10"
                />
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 space-y-1 border border-slate-100">
              <div className="font-medium text-slate-700">Requisitos da senha:</div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                <li className={newPassword.length >= 6 ? 'text-emerald-600 font-medium' : ''}>
                  Ao menos 6 caracteres
                </li>
                <li className={newPassword && newPassword === confirmPassword ? 'text-emerald-600 font-medium' : ''}>
                  Confirmação idêntica
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading || !newPassword || newPassword !== confirmPassword}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {loading ? 'Atualizando Senha...' : 'Salvar Nova Senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
