import React, { useState } from 'react';
import { Check, X, Star, Shield, Zap, Headphones, MessageSquare, Loader2 } from 'lucide-react';
import { startWompiPayment } from '../services/wompi';

interface Props {
  onClose: () => void;
  onUpgrade: () => void;
  userEmail?: string;
  userName?: string;
}

export const PricingModal: React.FC<Props> = ({ onClose, onUpgrade, userEmail = '', userName = '' }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = () => {
    setIsProcessing(true);
    // Llamar a Wompi
    startWompiPayment(userEmail, userName, () => {
        // Callback si el widget retorna éxito inmediato (depende de config)
        onUpgrade();
        setIsProcessing(false);
    });
    
    // Nota: Wompi redirige, por lo que la lógica real de éxito suele manejarse al recargar la página
    // o mediante Webhooks en un backend real. Para este MVP híbrido, confiamos en el widget.
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Free Tier */}
        <div className="md:w-1/2 p-8 bg-slate-50 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Plan Gratuito</h3>
            <p className="text-slate-500 text-sm mb-6">Para estudiantes y consultas ocasionales.</p>
            <div className="text-4xl font-bold text-slate-900 mb-6">$0 <span className="text-lg font-normal text-slate-500">/ mes</span></div>

            <ul className="space-y-4">
              <li className="flex items-center text-slate-700 text-sm">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                Búsqueda básica de jurisprudencia
              </li>
              <li className="flex items-center text-slate-700 text-sm">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                Lectura de sentencias (Texto)
              </li>
              <li className="flex items-center text-slate-700 text-sm">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                Comunidad Jurídica (Lectura)
              </li>
              <li className="flex items-center text-slate-400 text-sm">
                <X className="w-5 h-5 mr-3 flex-shrink-0" />
                Sin asistente "Prepara tu Caso"
              </li>
              <li className="flex items-center text-slate-400 text-sm">
                <X className="w-5 h-5 mr-3 flex-shrink-0" />
                Sin Modo Podcast (Audio)
              </li>
            </ul>
          </div>
          <button onClick={onClose} className="mt-8 w-full py-3 px-4 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-white hover:shadow-sm transition-all">
            Continuar Gratis
          </button>
        </div>

        {/* Premium Tier */}
        <div className="md:w-1/2 p-8 bg-indigo-900 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="inline-block bg-yellow-400 text-indigo-900 text-xs font-bold px-3 py-1 rounded-full mb-4">RECOMENDADO</div>
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              JurisIA <span className="text-yellow-400">PRO</span> <Star className="w-5 h-5 text-yellow-400 fill-current"/>
            </h3>
            <p className="text-indigo-200 text-sm mb-6">Para abogados litigantes y firmas.</p>
            <div className="text-4xl font-bold mb-6">$39.900 <span className="text-lg font-normal text-indigo-300">/ mes</span></div>

            <ul className="space-y-4">
              <li className="flex items-center text-indigo-100 text-sm">
                <Shield className="w-5 h-5 text-yellow-400 mr-3 flex-shrink-0" />
                Asistente IA "Prepara tu Caso" Ilimitado
              </li>
              <li className="flex items-center text-indigo-100 text-sm">
                <Headphones className="w-5 h-5 text-yellow-400 mr-3 flex-shrink-0" />
                Modo Podcast (Escucha tus sentencias)
              </li>
              <li className="flex items-center text-indigo-100 text-sm">
                <MessageSquare className="w-5 h-5 text-yellow-400 mr-3 flex-shrink-0" />
                Chat con Documentos (Preguntas específicas)
              </li>
              <li className="flex items-center text-indigo-100 text-sm">
                <Zap className="w-5 h-5 text-yellow-400 mr-3 flex-shrink-0" />
                Análisis prioritario y sin límites
              </li>
            </ul>
          </div>
          
          <button 
            onClick={handlePayment}
            disabled={isProcessing}
            className="mt-8 w-full py-3 px-4 bg-yellow-400 text-indigo-900 rounded-xl font-bold hover:bg-yellow-300 shadow-lg shadow-indigo-900/50 transition-all transform hover:scale-105 relative z-10 flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
            {isProcessing ? 'Abriendo Pasarela...' : 'Pagar con Wompi'}
          </button>
          
          <div className="flex justify-center mt-4 space-x-2 relative z-10">
              <img src="https://logovectorseek.com/wp-content/uploads/2021/05/bancolombia-logo-vector.png" alt="Bancolombia" className="h-4 opacity-70 bg-white rounded px-1" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mastercard_2019_logo.svg/1200px-Mastercard_2019_logo.svg.png" alt="Mastercard" className="h-4 opacity-70 bg-white rounded px-1" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="Visa" className="h-4 opacity-70 bg-white rounded px-1" />
              <img src="https://seeklogo.com/images/N/nequi-logo-5E0109C495-seeklogo.com.png" alt="Nequi" className="h-4 opacity-70 bg-white rounded px-1" />
          </div>
        </div>
      </div>
    </div>
  );
};
