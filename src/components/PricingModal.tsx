import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { startWompiPayment } from '../services/wompi';
export const PricingModal = ({ onClose, onUpgrade, userEmail='', userName='' }: any) => {
  const [loading, setLoading] = useState(false);
  const handlePay = () => {
    setLoading(true);
    startWompiPayment(userEmail, userName, () => { onUpgrade(); setLoading(false); });
  };
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4"><X/></button>
        <h2 className="text-2xl font-bold mb-4">Plan Toga PRO</h2>
        <div className="text-4xl font-bold mb-6">$39.900 <span className="text-sm text-slate-500">/mes</span></div>
        <button onClick={handlePay} disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold flex justify-center">
           {loading ? <Loader2 className="animate-spin mr-2"/> : 'Pagar con Wompi'}
        </button>
      </div>
    </div>
  );
};