import React from 'react';
import { User, SubscriptionTier } from '../types';
import { Crown, CheckCircle, XCircle } from 'lucide-react';

interface Props {
  user: User;
  onUpgrade: () => void;
}

export const SubscriptionBanner: React.FC<Props> = ({ user, onUpgrade }) => {
  if (user.tier === 'PREMIUM') return null;

  return (
    <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-xl shadow-lg mb-6 flex flex-col md:flex-row items-center justify-between border border-indigo-700">
      <div className="flex items-center mb-4 md:mb-0">
        <div className="bg-white/10 p-3 rounded-full mr-4">
          <Crown className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h4 className="font-bold text-lg">Actualiza a JurisIA Pro</h4>
          <p className="text-indigo-200 text-sm max-w-md">
            Accede a análisis profundos ilimitados, descarga de sentencias completas y prioridad en el asistente legal IA.
          </p>
        </div>
      </div>
      
      <button 
        onClick={onUpgrade}
        className="bg-yellow-400 hover:bg-yellow-500 text-indigo-900 font-bold py-2 px-6 rounded-lg transition-colors shadow-md w-full md:w-auto"
      >
        Obtener Premium
      </button>
    </div>
  );
};