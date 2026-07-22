import React from 'react';
import { Shield, Loader2, KeyRound } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  subtext?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Verificando autenticação e permissões de acesso...",
  subtext = "Sindicato Patronal SINPA — Sistema Seguro"
}) => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 select-none">
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center backdrop-blur-md">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Shield className="w-8 h-8 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1 text-white shadow-lg">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-100 mb-2">
          {message}
        </h3>
        
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          {subtext}
        </p>

        <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-amber-300 h-full w-2/3 animate-[pulse_1.5s_infinite]" />
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center justify-center gap-2 text-xs text-slate-500">
          <KeyRound className="w-3.5 h-3.5 text-amber-400/70" />
          <span>Autenticação Firebase & Validando UID</span>
        </div>
      </div>
    </div>
  );
};
