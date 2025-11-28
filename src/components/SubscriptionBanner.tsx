import React from 'react';
export const SubscriptionBanner = ({ user, onUpgrade }: any) => {
  if (user.tier === 'PREMIUM') return null;
  return (
    <div className="bg-gradient-to-r from-indigo-900 to-slate-800 text-white p-4 rounded-xl mb-6 flex justify-between items-center">
      <div><h4 className="font-bold">Actualiza a Toga PRO</h4><p className="text-sm opacity-80">Desbloquea IA avanzada.</p></div>
      <button onClick={onUpgrade} className="bg-yellow-400 text-black px-4 py-2 rounded font-bold">Ver Planes</button>
    </div>
  );
};