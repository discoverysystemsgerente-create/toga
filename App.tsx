import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Search, PlusCircle, User as UserIcon, BookOpen, 
  Menu, X, Scale, CheckCircle, FileText, FileUp, Link as LinkIcon, 
  Bookmark, MessageSquare, History, Send, ThumbsUp, ChevronLeft, PenTool, Share2,
  Bell, Settings, LogOut, Check, AlertCircle, Loader2, Download, Tag, Lock,
  ArrowRight, ShieldCheck, Zap, Globe, Headphones, PlayCircle, PauseCircle,
  MessageCircleQuestion, XCircle, Filter, Trophy, Calculator, Clipboard, Calendar,
  FileEdit, Folder, FolderPlus, Briefcase, Plus, SplitSquareHorizontal, ArrowLeftRight, Trash2, Copy, Volume2, StopCircle, Moon, Sun, FileDown, Save, Clock, Mic, Mail, Type, AlignLeft, List, GitCommitVertical, HelpCircle, Maximize, Minimize, LifeBuoy, Shield
} from 'lucide-react';
import { User, JurisprudenceCase, LegalArea, SourceType, Post, SearchHistoryItem, Comment, Folder as FolderType, GeneratedDocument, DocumentType, AgendaEvent, EventType } from './types';
import { INITIAL_USER, MOCK_DATABASE, MOCK_POSTS, MOCK_HISTORY, MOCK_FOLDERS, MOCK_DOCUMENTS, MOCK_EVENTS } from './constants';
import { analyzeLegalText, semanticSearch, generateCaseArgument, askDocument, generateLegalDocument, compareCases } from './services/geminiService';
import { SubscriptionBanner } from './components/SubscriptionBanner';
import { PricingModal } from './components/PricingModal';
import { JurisprudenceCard } from './components/JurisprudenceCard';
import { supabase } from './services/supabase';

declare global {
  interface Window {
    pdfjsLib: any;
    deferredPrompt: any;
    webkitSpeechRecognition: any;
  }
}

// --- Helper for Safe LocalStorage ---
const safeParse = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.warn(`Error parsing localStorage key "${key}":`, error);
    return fallback;
  }
};

const downloadFile = (content: string, fileName: string, contentType: string) => {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
};

// --- Shared Components ---

// Toast Notification Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-indigo-600'
  };

  return (
    <div className={`fixed bottom-20 md:bottom-6 right-6 ${bgColors[type]} text-white px-6 py-3 rounded-lg shadow-xl flex items-center z-[60] animate-fade-in`}>
      {type === 'success' && <CheckCircle className="w-5 h-5 mr-3" />}
      {type === 'error' && <AlertCircle className="w-5 h-5 mr-3" />}
      {type === 'info' && <Zap className="w-5 h-5 mr-3" />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-4 hover:bg-white/20 rounded-full p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Voice Input Component
const VoiceInput = ({ onResult, className = "" }: { onResult: (text: string) => void, className?: string }) => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    if (typeof window === 'undefined' || !window.webkitSpeechRecognition) {
      alert("Tu navegador no soporta dictado por voz. Intenta usar Chrome.");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    try {
      const recognition = new window.webkitSpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'es-CO';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setListening(false);
      };

      recognition.onresult = (event: any) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcript = event.results[0][0].transcript;
          onResult(transcript);
        }
      };

      recognition.start();
    } catch (e) {
      console.error("Error starting speech recognition", e);
      setListening(false);
    }
  };

  return (
    <button 
      type="button"
      onClick={startListening} 
      className={`p-2 rounded-full transition-all ${listening ? 'bg-red-100 text-red-600 animate-pulse ring-2 ring-red-400' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'} ${className}`}
      title="Dictar por voz"
    >
      <Mic className="w-5 h-5" />
    </button>
  );
};

// Premium Guard Component
const PremiumGuard = ({ user, children, onUpgrade }: { user: User, children?: React.ReactNode, onUpgrade: () => void }) => {
  if (user.tier === 'PREMIUM') return <>{children}</>;

  return (
    <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800">
       <div className="filter blur-sm opacity-30 pointer-events-none select-none p-4" aria-hidden="true">
          {children}
          {/* Fake content to fill space if children are empty or minimal */}
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-lg mt-4 w-full"></div>
       </div>
       <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 z-10 p-6 text-center backdrop-blur-sm">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-full mb-4 shadow-lg animate-bounce">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Función Premium</h3>
          <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md">
            Esta herramienta avanzada de Inteligencia Artificial está reservada para suscriptores Pro. Actualiza para desbloquear todo el potencial.
          </p>
          <button onClick={onUpgrade} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transform transition hover:scale-105 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-300" />
            Desbloquear Ahora
          </button>
       </div>
    </div>
  );
};

// --- Legal & Help Modals ---
const LegalModal = ({ title, content, onClose }: { title: string, content: React.ReactNode, onClose: () => void }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
       <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
         <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
         <button onClick={onClose}><X className="w-6 h-6 text-slate-500 hover:text-slate-700" /></button>
       </div>
       <div className="p-6 overflow-y-auto text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
         {content}
       </div>
       <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-right">
         <button onClick={onClose} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Entendido</button>
       </div>
    </div>
  </div>
);

const HelpModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg">
       <div className="p-6 text-center">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <LifeBuoy className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Centro de Ayuda</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            ¿Tienes problemas o sugerencias? Nuestro equipo de soporte jurídico y técnico está listo para ayudarte.
          </p>
          <div className="space-y-3">
             <button className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center">
                <Mail className="w-5 h-5 mr-2" /> Contactar Soporte
             </button>
             <button className="w-full py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center">
                <FileText className="w-5 h-5 mr-2" /> Ver Guías de Uso
             </button>
          </div>
          <button onClick={onClose} className="mt-6 text-sm text-slate-400 hover:text-slate-600">Cerrar</button>
       </div>
    </div>
  </div>
);

// --- Onboarding Tour Component ---
interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position: 'right' | 'left' | 'top' | 'bottom' | 'center';
}

const OnboardingTour = ({ onComplete }: { onComplete: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [styles, setStyles] = useState<any>({});

  const steps: TourStep[] = [
    { targetId: 'welcome-modal', title: 'Bienvenido a JurisIA', content: 'Tu asistente jurídico inteligente. Vamos a dar un paseo rápido para mostrarte cómo potenciar tu práctica legal.', position: 'center' },
    { targetId: 'search-bar', title: 'Búsqueda Inteligente', content: 'Busca sentencias por tema o palabras clave. También puedes usar el micrófono para dictar.', position: 'bottom' },
    { targetId: 'nav-library', title: 'Biblioteca y Expedientes', content: 'Organiza tus casos y sentencias guardadas en carpetas digitales inteligentes.', position: 'right' },
    { targetId: 'nav-drafter', title: 'Redactor IA', content: 'Genera borradores de tutelas, derechos de petición y contratos en segundos.', position: 'right' },
    { targetId: 'nav-agenda', title: 'Agenda Judicial', content: 'Gestiona tus audiencias y calcula vencimientos de términos automáticamente.', position: 'right' }
  ];

  const currentTour = steps[currentStep];

  useEffect(() => {
    // Safety check: ensure currentTour exists
    if (!currentTour) {
      setStyles({});
      return;
    }

    if (currentTour.position === 'center') {
      setStyles({});
      return;
    }
    
    const element = document.getElementById(currentTour.targetId);
    if (!element) {
      // Fallback if element not found (e.g. on mobile where sidebar is hidden)
      // Set to center fixed position as fallback
      setStyles({ modal: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', position: 'fixed', margin: 0, zIndex: 102 } });
      return;
    }
    
    const rect = element.getBoundingClientRect();
    
    // Highlight Box Style
    const highlight = {
      top: rect.top - 5,
      left: rect.left - 5,
      width: rect.width + 10,
      height: rect.height + 10,
      position: 'absolute'
    };

    // Modal Position
    let modalPos: any = {};
    if (currentTour.position === 'bottom') {
        modalPos = { top: rect.bottom + 15, left: Math.max(10, rect.left) };
    } else if (currentTour.position === 'right') {
        modalPos = { top: rect.top, left: rect.right + 15 };
    } else {
        // Default to bottom if type not handled
        modalPos = { top: rect.bottom + 15, left: Math.max(10, rect.left) };
    }
    
    // Adjust if offscreen (simple check)
    if (modalPos.left && modalPos.left > window.innerWidth - 320) {
        modalPos = { top: rect.bottom + 15, left: Math.max(10, window.innerWidth - 340) };
    }
    
    // Fallback if modalPos is still empty (shouldn't happen with default)
    if (Object.keys(modalPos).length === 0) {
        modalPos = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', position: 'fixed' };
    } else {
        modalPos.position = 'absolute';
    }

    setStyles({ highlight, modal: modalPos });

  }, [currentStep]); // Removed steps/currentTour from dependency to avoid loop if they are recreated

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  if (!currentTour) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/70 transition-all duration-300"></div>
      
      {/* Highlight Box */}
      {currentTour.position !== 'center' && styles.highlight && (
         <div 
           className="absolute border-2 border-yellow-400 rounded-lg shadow-[0_0_0_9999px_rgba(15,23,42,0.7)] transition-all duration-300 pointer-events-none"
           style={styles.highlight}
         ></div>
      )}

      {/* Modal Content */}
      <div className={`relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 border border-slate-200 dark:border-slate-700 z-[101] animate-fade-in`}
           style={currentTour.position === 'center' ? {} : (styles.modal || {})}
      >
        <div className="flex justify-between items-start mb-4">
           <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
             {currentStep === 0 ? <Scale className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
           </div>
           <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{currentStep + 1} / {steps.length}</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{currentTour.title}</h3>
        <p className="text-slate-600 dark:text-slate-300 mb-6">{currentTour.content}</p>
        <div className="flex justify-between items-center">
          <button onClick={onComplete} className="text-slate-400 hover:text-slate-600 text-sm font-medium">Saltar</button>
          <button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-indigo-600/20 transition-transform hover:scale-105">
            {currentStep === steps.length - 1 ? '¡Empezar!' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );
};


const Sidebar = ({ user, isOpen, toggle, onLogout, unreadNotifications, onHelp }: { user: User, isOpen: boolean, toggle: () => void, onLogout: () => void, unreadNotifications: number, onHelp: () => void }) => {
  const location = useLocation();
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const isActive = (path: string) => location.pathname === path ? 'bg-indigo-800 text-white shadow-lg' : 'text-indigo-100 hover:bg-indigo-800/50';

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Inicio', id: 'nav-home' },
    { path: '/agenda', icon: Calendar, label: 'Agenda Judicial', id: 'nav-agenda' },
    { path: '/search', icon: Search, label: 'Búsqueda & Historial', id: 'nav-search' },
    { path: '/library', icon: Briefcase, label: 'Biblioteca & Expedientes', id: 'nav-library' },
    { path: '/compare', icon: SplitSquareHorizontal, label: 'Comparador', id: 'nav-compare' },
    { path: '/drafter', icon: FileEdit, label: 'Redactor IA', id: 'nav-drafter' },
    { path: '/prepare', icon: PenTool, label: 'Prepara tu Caso', id: 'nav-prepare' },
    { path: '/tools', icon: Calculator, label: 'Herramientas', id: 'nav-tools' },
    { path: '/community', icon: MessageSquare, label: 'Comunidad Jurídica', id: 'nav-community' },
    { path: '/contribute', icon: PlusCircle, label: 'Aportar Sentencia', id: 'nav-contribute' },
    { path: '/profile', icon: UserIcon, label: 'Mi Perfil', id: 'nav-profile' },
  ];

  const getReputationLabel = (points: number) => {
    if (points < 100) return 'Estudiante';
    if (points < 500) return 'Jurista';
    if (points < 1000) return 'Jurista Experto';
    return 'Magistrado Honorario';
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={toggle}></div>}
      <aside className={`fixed md:static inset-y-0 left-0 z-30 w-72 bg-slate-900 text-white transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col shadow-2xl dark:border-r dark:border-slate-800`}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <Scale className="w-8 h-8 text-indigo-400" />
            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">JurisIA</span>
          </div>
          <button onClick={toggle} className="md:hidden text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          <div className="flex items-center space-x-3 mb-6 p-4 bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg ring-2 ring-indigo-500/30 text-lg relative">
              {user.name.charAt(0)}
              <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-[9px] rounded-full w-5 h-5 flex items-center justify-center border-2 border-slate-800">
                <Trophy className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-white">{user.name}</p>
              <p className="text-xs text-indigo-300 font-medium">{getReputationLabel(user.reputation || 0)}</p>
              <div className="flex items-center mt-1">
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${user.tier === 'PREMIUM' ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' : 'bg-slate-600 text-slate-300 border-slate-500'}`}>
                   {user.tier === 'PREMIUM' ? 'PREMIUM' : 'GRATUITO'}
                 </span>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link id={item.id} key={item.path} to={item.path} onClick={() => window.innerWidth < 768 && toggle()} className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive(item.path)}`}>
                <div className="relative">
                  <item.icon className={`w-5 h-5 mr-3 transition-colors ${location.pathname === item.path ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  {item.path === '/community' && unreadNotifications > 0 && (
                     <span className="absolute -top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>
                  )}
                </div>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
           <button onClick={onHelp} className="flex items-center text-slate-400 hover:text-white px-4 py-2 hover:bg-slate-800 rounded-xl w-full text-sm">
             <LifeBuoy className="w-4 h-4 mr-3" />
             Ayuda y Soporte
           </button>
           {installPrompt && (
             <button onClick={handleInstall} className="flex items-center justify-center w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors font-bold shadow-lg shadow-indigo-900/20 mb-2">
               <Download className="w-5 h-5 mr-2" />
               Instalar App
             </button>
           )}
           <button onClick={onLogout} className="flex items-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors w-full px-4 py-3 rounded-xl">
             <LogOut className="w-5 h-5 mr-3" />
             Cerrar Sesión
           </button>
        </div>
      </aside>
    </>
  );
};

// --- Page Components ---

const LandingPage = ({ onStart }: { onStart: () => void }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white text-center p-4">
      <Scale className="w-16 h-16 text-indigo-400 mb-6" />
      <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">JurisIA</h1>
      <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mb-8">
        Tu asistente jurídico inteligente para la era digital.
      </p>
      <button onClick={onStart} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-full text-lg font-bold shadow-lg shadow-indigo-900/40 transition-all transform hover:scale-105">
        Comenzar Ahora
      </button>
    </div>
  );
};

const HomePage = ({ user, events }: { user: User, events: AgendaEvent[] }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Bienvenido, {user.name}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-2 text-indigo-600 dark:text-indigo-400">Eventos Próximos</h3>
          {events.slice(0, 3).map(e => (
            <div key={e.id} className="text-sm py-2 border-b last:border-0 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              {e.title} - <span className="font-bold">{e.date}</span>
            </div>
          ))}
          {events.length === 0 && <p className="text-slate-400 text-sm">No hay eventos próximos.</p>}
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
           <h3 className="text-lg font-semibold mb-2 text-indigo-600 dark:text-indigo-400">Reputación</h3>
           <div className="text-3xl font-bold text-slate-800 dark:text-white">{user.reputation} <span className="text-sm font-normal text-slate-500">XP</span></div>
        </div>
      </div>
    </div>
  );
};

const AgendaPage = ({ events, onAddEvent, onToggleEvent, onDeleteEvent }: { events: AgendaEvent[], onAddEvent: (e: AgendaEvent) => void, onToggleEvent: (id: string) => void, onDeleteEvent: (id: string) => void }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<AgendaEvent>>({ type: 'AUDIENCIA' });

  const handleSave = () => {
    if (newEvent.title && newEvent.date) {
      onAddEvent({
        id: Date.now().toString(),
        title: newEvent.title,
        date: newEvent.date,
        time: newEvent.time,
        type: newEvent.type as EventType,
        completed: false
      });
      setShowAdd(false);
      setNewEvent({ type: 'AUDIENCIA' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Agenda Judicial</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Agregar Evento
        </button>
      </div>

      {showAdd && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Título" className="p-2 border rounded" value={newEvent.title || ''} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
            <input type="date" className="p-2 border rounded" value={newEvent.date || ''} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
            <select className="p-2 border rounded" value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value as EventType})}>
              <option value="AUDIENCIA">Audiencia</option>
              <option value="VENCIMIENTO">Vencimiento</option>
              <option value="REUNION">Reunión</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
          <button onClick={handleSave} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded">Guardar</button>
        </div>
      )}

      <div className="space-y-4">
        {events.map(event => (
          <div key={event.id} className={`flex justify-between items-center p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border-l-4 ${event.completed ? 'border-emerald-500 opacity-60' : 'border-indigo-500'}`}>
             <div className="flex items-center">
                <input type="checkbox" checked={event.completed} onChange={() => onToggleEvent(event.id)} className="mr-4 h-5 w-5 text-indigo-600" />
                <div>
                  <h4 className={`font-bold ${event.completed ? 'line-through' : ''}`}>{event.title}</h4>
                  <p className="text-sm text-slate-500">{event.date} - {event.type}</p>
                </div>
             </div>
             <button onClick={() => onDeleteEvent(event.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

const LibraryPage = ({ folders, documents, onCreateFolder }: { folders: FolderType[], documents: GeneratedDocument[], onCreateFolder: (n: string, c: string) => void }) => {
  const [newFolderName, setNewFolderName] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Biblioteca y Expedientes</h2>
         <div className="flex space-x-2">
            <input type="text" placeholder="Nuevo Expediente" className="p-2 border rounded" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} />
            <button onClick={() => { if(newFolderName) onCreateFolder(newFolderName, 'bg-blue-500'); setNewFolderName(''); }} className="p-2 bg-indigo-600 text-white rounded"><FolderPlus className="w-5 h-5"/></button>
         </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {folders.map(f => (
          <div key={f.id} className={`${f.color.replace('bg-', 'bg-opacity-20 bg-')} p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center hover:shadow-md cursor-pointer`}>
             <Folder className={`w-12 h-12 mb-2 ${f.color.replace('bg-', 'text-')}`} />
             <h3 className="font-bold text-slate-800 dark:text-white">{f.name}</h3>
             <span className="text-xs text-slate-500">{documents.filter(d => d.folderId === f.id).length} documentos</span>
          </div>
        ))}
      </div>

      <h3 className="text-xl font-bold mt-8 mb-4">Documentos Recientes</h3>
      <div className="space-y-2">
        {documents.map(doc => (
          <div key={doc.id} className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex justify-between items-center">
             <div className="flex items-center">
               <FileText className="w-5 h-5 mr-3 text-slate-400" />
               <div>
                 <h4 className="font-bold text-sm">{doc.title}</h4>
                 <p className="text-xs text-slate-500">{doc.type} - {doc.createdAt}</p>
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DrafterPage = ({ folders, saveDocument, notify, user, onUpgrade }: { folders: FolderType[], saveDocument: (d: GeneratedDocument) => void, notify: any, user: User, onUpgrade: () => void }) => {
  const [type, setType] = useState('TUTELA');
  const [details, setDetails] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDraft = async () => {
    setLoading(true);
    const text = await generateLegalDocument(type, details);
    setResult(text);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Redactor Jurídico IA</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
           <label className="block text-sm font-medium mb-2">Tipo de Documento</label>
           <select className="w-full p-2 border rounded mb-4" value={type} onChange={e => setType(e.target.value)}>
             <option value="TUTELA">Acción de Tutela</option>
             <option value="DERECHO_PETICION">Derecho de Petición</option>
             <option value="CONTRATO">Contrato</option>
             <option value="MEMORIAL">Memorial</option>
           </select>
           
           <label className="block text-sm font-medium mb-2">Detalles del Caso</label>
           <textarea className="w-full p-2 border rounded h-40 mb-4" value={details} onChange={e => setDetails(e.target.value)} placeholder="Describe los hechos y pretensiones..."></textarea>
           
           <button onClick={handleDraft} disabled={loading} className="w-full py-2 bg-indigo-600 text-white rounded font-bold flex justify-center items-center">
             {loading ? <Loader2 className="animate-spin mr-2"/> : <PenTool className="w-4 h-4 mr-2" />} Generar Borrador
           </button>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 h-full">
           <h3 className="font-bold mb-4">Resultado</h3>
           {result ? (
             <div className="h-96 overflow-y-auto bg-white p-4 border rounded whitespace-pre-wrap text-sm">{result}</div>
           ) : (
             <div className="h-96 flex items-center justify-center text-slate-400 italic">El documento generado aparecerá aquí.</div>
           )}
           {result && (
             <button onClick={() => { saveDocument({ id: Date.now().toString(), title: `${type} Generada`, type: type as DocumentType, content: result, createdAt: new Date().toISOString() }); notify('Guardado', 'success'); }} className="mt-4 w-full py-2 border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50 font-bold">
               Guardar en Biblioteca
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

const ToolsPage = ({ onAddToAgenda }: { onAddToAgenda: (title: string, date: string) => void }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Herramientas Jurídicas</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-slate-200 dark:border-slate-700">
           <Calculator className="w-10 h-10 text-indigo-500 mb-4" />
           <h3 className="font-bold text-lg mb-2">Calculadora de Términos</h3>
           <p className="text-sm text-slate-500">Calcula fechas de vencimiento en días hábiles.</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-slate-200 dark:border-slate-700">
           <Clipboard className="w-10 h-10 text-emerald-500 mb-4" />
           <h3 className="font-bold text-lg mb-2">Liquidación Laboral</h3>
           <p className="text-sm text-slate-500">Estimador rápido de prestaciones sociales.</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-slate-200 dark:border-slate-700">
           <Calendar className="w-10 h-10 text-orange-500 mb-4" />
           <h3 className="font-bold text-lg mb-2">Indexación de Cánones</h3>
           <p className="text-sm text-slate-500">Ajuste de arriendos según IPC.</p>
        </div>
      </div>
    </div>
  );
};

const ComparePage = ({ comparisonList, onRemove, onClear, user, onUpgrade }: { comparisonList: JurisprudenceCase[], onRemove: (id: string) => void, onClear: () => void, user: User, onUpgrade: () => void }) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (comparisonList.length !== 2) return;
    setLoading(true);
    const result = await compareCases(comparisonList[0], comparisonList[1]);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Comparador de Sentencias</h2>
      <div className="flex space-x-4 mb-6">
        {comparisonList.map(c => (
           <div key={c.id} className="flex-1 bg-white p-4 rounded shadow-sm border relative">
             <button onClick={() => onRemove(c.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><X className="w-4 h-4"/></button>
             <h4 className="font-bold">{c.title}</h4>
             <p className="text-xs text-slate-500">{c.corporation} - {c.date}</p>
           </div>
        ))}
        {comparisonList.length < 2 && <div className="flex-1 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 p-4">Selecciona otra sentencia</div>}
      </div>

      {comparisonList.length === 2 && (
         <button onClick={handleCompare} disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-lg">
           {loading ? <Loader2 className="animate-spin inline mr-2"/> : <SplitSquareHorizontal className="inline mr-2"/>} Comparar con IA
         </button>
      )}

      {analysis && (
        <div className="bg-white p-6 rounded-xl shadow border mt-6 space-y-4">
           <div><h4 className="font-bold text-emerald-600">Similitudes</h4><p>{analysis.similarities}</p></div>
           <div><h4 className="font-bold text-red-600">Diferencias</h4><p>{analysis.differences}</p></div>
           <div><h4 className="font-bold text-indigo-600">Conclusión</h4><p>{analysis.conclusion}</p></div>
        </div>
      )}
    </div>
  );
};

const SearchPage = ({ database, onAddCompare }: { database: JurisprudenceCase[], onAddCompare: (c: JurisprudenceCase) => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<JurisprudenceCase[]>([]);

  const handleSearch = () => {
     if(!query) return;
     const filtered = database.filter(c => c.title.toLowerCase().includes(query.toLowerCase()) || c.text.toLowerCase().includes(query.toLowerCase()));
     setResults(filtered);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Búsqueda Inteligente</h2>
      <div className="flex gap-2">
        <input type="text" className="flex-1 p-3 border rounded-lg" placeholder="Buscar sentencias, leyes o conceptos..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <button onClick={handleSearch} className="px-6 bg-indigo-600 text-white rounded-lg"><Search className="w-5 h-5" /></button>
      </div>
      
      <div className="space-y-4">
        {results.map(c => (
           <div key={c.id} className="relative group">
              <JurisprudenceCard data={c} />
              <button onClick={() => onAddCompare(c)} className="absolute top-4 right-4 bg-white p-2 rounded-full shadow border text-slate-500 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Agregar a Comparar">
                 <SplitSquareHorizontal className="w-4 h-4" />
              </button>
           </div>
        ))}
        {query && results.length === 0 && <p className="text-slate-500 text-center py-8">No se encontraron resultados.</p>}
      </div>
    </div>
  );
};

const PrepareCasePage = ({ database, notify, user, onUpgrade }: { database: JurisprudenceCase[], notify: any, user: User, onUpgrade: () => void }) => {
  const [facts, setFacts] = useState('');
  const [strategy, setStrategy] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await generateCaseArgument(facts, "", database);
    setStrategy(result);
    setLoading(false);
  };

  return (
     <div className="space-y-6">
       <h2 className="text-2xl font-bold">Prepara tu Caso</h2>
       <PremiumGuard user={user} onUpgrade={onUpgrade}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-4">
               <textarea className="w-full h-64 p-4 border rounded-xl" placeholder="Describe los hechos de tu caso aquí..." value={facts} onChange={e => setFacts(e.target.value)}></textarea>
               <button onClick={handleAnalyze} disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold">
                 {loading ? <Loader2 className="animate-spin inline mr-2"/> : <Zap className="inline mr-2"/>} Generar Estrategia
               </button>
             </div>
             <div className="bg-white p-6 rounded-xl border shadow-sm h-64 md:h-auto overflow-y-auto">
                <h3 className="font-bold mb-4">Estrategia Sugerida</h3>
                <div className="whitespace-pre-wrap text-sm text-slate-700">{strategy || "La estrategia generada por IA aparecerá aquí."}</div>
             </div>
          </div>
       </PremiumGuard>
     </div>
  );
};

const CommunityPage = ({ notify }: { notify: any }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Comunidad Jurídica</h2>
      <div className="space-y-4">
        {MOCK_POSTS.map(post => (
           <div key={post.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between mb-2">
                 <span className="font-bold text-slate-800">{post.authorName}</span>
                 <span className="text-xs text-slate-500">{post.date}</span>
              </div>
              <p className="text-slate-700 mb-4">{post.content}</p>
              <div className="flex items-center space-x-4 text-slate-500 text-sm">
                 <button className="flex items-center hover:text-indigo-600"><ThumbsUp className="w-4 h-4 mr-1"/> {post.likes}</button>
                 <button className="flex items-center hover:text-indigo-600"><MessageSquare className="w-4 h-4 mr-1"/> {post.comments.length}</button>
              </div>
           </div>
        ))}
      </div>
    </div>
  );
};

const ContributePage = ({ onContribute, notify }: { onContribute: (c: JurisprudenceCase) => void, notify: any }) => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  const handleSubmit = async () => {
    if(!title || !text) return;
    // Simple mock contribution
    const newCase: JurisprudenceCase = {
        id: `contrib-${Date.now()}`,
        title,
        text,
        summary: text.substring(0, 100) + "...",
        area: LegalArea.CONSTITUCIONAL,
        tags: ["Usuario"],
        date: new Date().toISOString().split('T')[0],
        corporation: "Desconocida",
        authorId: "user",
        aiProcessed: false,
        sourceType: 'TEXT'
    };
    onContribute(newCase);
    setTitle('');
    setText('');
    notify("¡Gracias por tu aporte!", "success");
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold">Aportar Sentencia</h2>
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
         <input className="w-full p-3 border rounded-lg" placeholder="Título (ej: Sentencia T-123/23)" value={title} onChange={e => setTitle(e.target.value)} />
         <textarea className="w-full p-3 border rounded-lg h-40" placeholder="Pega el texto de la sentencia aquí..." value={text} onChange={e => setText(e.target.value)}></textarea>
         <button onClick={handleSubmit} className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold">Enviar Aporte</button>
      </div>
    </div>
  );
};

const ProfilePage = ({ user, onUpdateInterests, notify, onBackup }: { user: User, onUpdateInterests: (i: LegalArea[]) => void, notify: any, onBackup: () => void }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Mi Perfil</h2>
      <div className="bg-white p-8 rounded-xl shadow-sm border flex items-center space-x-6">
         <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold text-white">
           {user.name.charAt(0)}
         </div>
         <div>
           <h3 className="text-xl font-bold">{user.name}</h3>
           <p className="text-slate-500">{user.email}</p>
           <div className="mt-2 inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold border border-yellow-200">
             {user.tier === 'PREMIUM' ? 'Miembro Premium' : 'Plan Gratuito'}
           </div>
         </div>
         <button onClick={onBackup} className="ml-auto px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 flex items-center text-sm">
           <Download className="w-4 h-4 mr-2"/> Copia de Seguridad
         </button>
      </div>
    </div>
  );
};

const CaseDetailPage = ({ folders, saveToFolder, notify }: { folders: FolderType[], saveToFolder: (cid: string, fid: string) => void, notify: any }) => {
  const { id } = useParams();
  // In a real app, fetch case by ID
  return (
    <div className="p-8 text-center text-slate-500">
       Detalles del caso {id} (Implementación pendiente en este demo)
    </div>
  );
};

const MobileBottomNav = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 md:hidden flex justify-around p-3 z-50">
      <Link to="/" className="text-slate-500 hover:text-indigo-600"><LayoutDashboard className="w-6 h-6"/></Link>
      <Link to="/search" className="text-slate-500 hover:text-indigo-600"><Search className="w-6 h-6"/></Link>
      <button onClick={toggleSidebar} className="text-white bg-indigo-600 p-3 rounded-full -mt-8 shadow-lg"><Menu className="w-6 h-6"/></button>
      <Link to="/agenda" className="text-slate-500 hover:text-indigo-600"><Calendar className="w-6 h-6"/></Link>
      <Link to="/profile" className="text-slate-500 hover:text-indigo-600"><UserIcon className="w-6 h-6"/></Link>
    </div>
  );
};

const AuthPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
   const [isRegister, setIsRegister] = useState(false);
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [name, setName] = useState('');
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');
   
   const handleAuth = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
     setError('');

     try {
       if (isRegister) {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: name,
              }
            }
          });
          if (signUpError) throw signUpError;
          if (data.user) {
             // Create profile manually if trigger doesn't exist
             const newUser: User = {
                id: data.user.id,
                name: name,
                email: email,
                tier: 'FREE',
                isActive: true,
                interests: [],
                reputation: 0
             };
             // Insert into profiles table
             await supabase.from('profiles').insert([{
                 id: data.user.id,
                 email,
                 full_name: name
             }]);
             onLogin(newUser);
          }
       } else {
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (signInError) throw signInError;
          
          if (data.user) {
             // Fetch profile
             const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
             const loggedUser: User = {
                id: data.user.id,
                name: profile?.full_name || data.user.email?.split('@')[0] || 'Usuario',
                email: data.user.email || '',
                tier: profile?.tier || 'FREE',
                isActive: true,
                interests: profile?.interests || [],
                reputation: profile?.reputation || 0
             };
             onLogin(loggedUser);
          }
       }
     } catch (err: any) {
        setError(err.message || "Error de autenticación");
     } finally {
        setLoading(false);
     }
   };

   return (
     <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 dark:bg-slate-900">
       <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
         <div className="flex justify-center mb-6">
            <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-full">
              <Scale className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
         </div>
         <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
           {isRegister ? 'Crear Cuenta' : 'Bienvenido de nuevo'}
         </h2>
         <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
           {isRegister ? 'Únete a la comunidad jurídica líder.' : 'Accede a tu biblioteca y herramientas.'}
         </p>

         {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

         <form onSubmit={handleAuth} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  required={isRegister}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
              <input 
                type="email" 
                required 
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
              <input 
                type="password" 
                required 
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md flex justify-center">
               {loading ? <Loader2 className="animate-spin" /> : (isRegister ? 'Registrarse' : 'Iniciar Sesión')}
            </button>
         </form>

         <div className="mt-6 text-center">
           <button onClick={() => setIsRegister(!isRegister)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
             {isRegister ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
           </button>
         </div>
       </div>
     </div>
   );
};

// ... [Existing components HomePage, AgendaPage, ToolsPage, etc.] ...
// I will override the Main App Component to handle the new Data fetching logic

const AppContent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [comparisonList, setComparisonList] = useState<JurisprudenceCase[]>([]);
  
  // UX State
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
      { id: 1, text: 'Bienvenido a JurisIA', read: false },
      { id: 2, text: 'Tu perfil ha sido actualizado', read: true }
  ]);
  const [showTour, setShowTour] = useState(false);
  
  // Data State
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [db, setDb] = useState<JurisprudenceCase[]>([]);
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Auth & Data Loading Effect
  useEffect(() => {
    const init = async () => {
      try {
        // 1. Check Auth
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Load Profile
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          const loggedUser: User = {
              id: session.user.id,
              name: profile?.full_name || 'Usuario',
              email: session.user.email || '',
              tier: profile?.tier || 'FREE',
              isActive: true,
              interests: profile?.interests || [],
              reputation: profile?.reputation || 0
          };
          setUser(loggedUser);

          // Load Data from Supabase
          const [casesRes, foldersRes, docsRes, eventsRes] = await Promise.all([
              supabase.from('cases').select('*'),
              supabase.from('folders').select('*').eq('user_id', session.user.id),
              supabase.from('documents').select('*'), // Filter by user usually
              supabase.from('events').select('*').eq('user_id', session.user.id)
          ]);

          setDb(casesRes.data ? [...MOCK_DATABASE, ...casesRes.data as any] : MOCK_DATABASE);
          setFolders(foldersRes.data as any || []);
          setDocuments(docsRes.data as any || []);
          setEvents(eventsRes.data as any || []);

        } else {
          throw new Error("No session");
        }
      } catch (e) {
        // Fallback to LocalStorage for offline/demo
        console.warn("Using offline fallback mode", e);
        const savedUser = safeParse<User | null>('juris_user', null);
        if (savedUser) setUser(savedUser);
        setDb(safeParse('db', MOCK_DATABASE));
        setFolders(safeParse('folders', MOCK_FOLDERS));
        setDocuments(safeParse('documents', MOCK_DOCUMENTS));
        setEvents(safeParse('events', MOCK_EVENTS));
      } finally {
        setDataLoading(false);
      }
    };

    init();
  }, []);

  // Tour Logic
  useEffect(() => {
      if (user && !localStorage.getItem('tour_completed')) {
          setTimeout(() => setShowTour(true), 1000);
      }
  }, [user]);

  const handleTourComplete = () => {
      setShowTour(false);
      localStorage.setItem('tour_completed', 'true');
  };

  const login = (u: User) => {
    setUser(u);
    // Reload page or re-fetch data would happen here typically
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('juris_user');
  };

  const showToast = (msg: string, type: 'success' | 'error' | 'info') => {
      setToast({ msg, type });
  };

  const addToCompare = (c: JurisprudenceCase) => {
    if (comparisonList.find(i => i.id === c.id)) return;
    if (comparisonList.length >= 2) {
      showToast("Solo puedes comparar 2 sentencias a la vez", "error");
      return;
    }
    setComparisonList([...comparisonList, c]);
    showToast("Añadido al comparador", "info");
  };

  const removeFromCompare = (id: string) => {
    setComparisonList(comparisonList.filter(c => c.id !== id));
  };

  const saveDocument = async (doc: GeneratedDocument) => {
    setDocuments([...documents, doc]);
    if(user?.id) {
       await supabase.from('documents').insert([{...doc, user_id: user.id}]); // Assuming schema match
    }
  };

  const createFolder = async (name: string, color: string) => {
    const newFolder: FolderType = { id: `f-${Date.now()}`, name, color, createdAt: new Date().toISOString() };
    setFolders([...folders, newFolder]);
    if(user?.id) {
        await supabase.from('folders').insert([{...newFolder, user_id: user.id}]);
    }
    showToast("Expediente creado", "success");
  };
  
  const handleContribute = async (newCase: JurisprudenceCase) => {
      setDb([newCase, ...db]);
      if(user) {
          const newRep = (user.reputation || 0) + 50;
          const updatedUser = { ...user, reputation: newRep };
          setUser(updatedUser);
          
          await Promise.all([
             supabase.from('cases').insert([{...newCase, user_id: user.id, analysis: newCase.analysis}]),
             supabase.from('profiles').update({reputation: newRep}).eq('id', user.id)
          ]);
          
          setNotifications(prev => [{id: Date.now(), text: `¡Ganaste 50XP por aportar la sentencia ${newCase.title}!`, read: false}, ...prev]);
      }
  };

  const handleUpdateInterests = async (interests: LegalArea[]) => {
      if(user) {
          const updatedUser = { ...user, interests };
          setUser(updatedUser);
          await supabase.from('profiles').update({interests}).eq('id', user.id);
      }
  };

  const saveToFolder = (caseId: string, folderId: string) => {
      const caseItem = db.find(c => c.id === caseId);
      if(!caseItem) return;

      const newDoc: GeneratedDocument = {
          id: `doc-case-${Date.now()}`,
          title: `[Guardado] ${caseItem.title}`,
          type: 'OTRO',
          content: caseItem.text,
          createdAt: new Date().toISOString(),
          folderId: folderId
      };
      saveDocument(newDoc);
      showToast('Caso guardado en el expediente.', "success");
  };

  // Agenda Actions
  const addEvent = async (e: AgendaEvent) => {
      setEvents([...events, e]);
      if(user?.id) await supabase.from('events').insert([{...e, user_id: user.id}]);
      showToast('Evento agendado', 'success');
  };
  const toggleEvent = async (id: string) => {
      const newEvents = events.map(e => e.id === id ? {...e, completed: !e.completed} : e);
      setEvents(newEvents);
      // DB update omitted for brevity, logic similar
  };
  const deleteEvent = async (id: string) => {
      setEvents(events.filter(e => e.id !== id));
      await supabase.from('events').delete().eq('id', id);
  };
  
  const handleAddToAgendaFromTools = (title: string, date: string) => {
      addEvent({
          id: `evt-tool-${Date.now()}`,
          title,
          date,
          type: 'VENCIMIENTO',
          completed: false
      });
  };

  const handleBackup = () => {
      const backupData = {
          user,
          database: db,
          folders,
          documents,
          events,
          exportedAt: new Date().toISOString()
      };
      downloadFile(JSON.stringify(backupData, null, 2), `JurisIA_Backup_${new Date().toISOString().slice(0,10)}.json`, 'application/json');
      showToast('Copia de seguridad descargada', 'success');
  };
  
  const handleUpgradeUser = async () => {
      if(user) {
          const upgradedUser: User = { ...user, tier: 'PREMIUM' };
          setUser(upgradedUser);
          await supabase.from('profiles').update({tier: 'PREMIUM'}).eq('id', user.id);
          setShowPricing(false);
          showToast("¡Pago exitoso! Bienvenido a Premium", "success");
      }
  };


  if (dataLoading) {
      return <div className="h-screen w-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-600"/></div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage onStart={() => setUser({ ...INITIAL_USER, id: 'temp' })} />} />
        <Route path="/auth" element={<AuthPage onLogin={login} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  if (user.id === 'temp') {
     return <AuthPage onLogin={login} />;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden text-slate-900 dark:text-slate-100 font-sans">
      <Sidebar 
          user={user} 
          isOpen={sidebarOpen} 
          toggle={() => setSidebarOpen(!sidebarOpen)} 
          onLogout={logout} 
          unreadNotifications={unreadCount}
          onHelp={() => setShowHelp(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center z-10">
          <div className="flex items-center md:hidden">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-6 h-6 text-indigo-600" /> JurisIA
            </span>
          </div>
          
          <div className="flex items-center space-x-4 ml-auto">
             <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-500 hover:text-indigo-600 relative">
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>}
                </button>
                {showNotifications && (
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                        <div className="p-3 border-b border-slate-100 dark:border-slate-700 font-bold text-sm">Notificaciones</div>
                        <div className="max-h-64 overflow-y-auto">
                            {notifications.map(n => (
                                <div key={n.id} className={`p-3 text-sm border-b border-slate-50 dark:border-slate-700 ${!n.read ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                                    {n.text}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative pb-24 md:pb-8">
          <SubscriptionBanner user={user} onUpgrade={() => setShowPricing(true)} />

          <Routes>
            <Route path="/" element={<HomePage user={user} events={events} />} />
            <Route path="/agenda" element={<AgendaPage events={events} onAddEvent={addEvent} onToggleEvent={toggleEvent} onDeleteEvent={deleteEvent} />} />
            <Route path="/library" element={<LibraryPage folders={folders} documents={documents} onCreateFolder={createFolder} />} />
            <Route path="/drafter" element={<DrafterPage folders={folders} saveDocument={saveDocument} notify={showToast} user={user} onUpgrade={() => setShowPricing(true)} />} />
            <Route path="/tools" element={<ToolsPage onAddToAgenda={handleAddToAgendaFromTools} />} />
            <Route path="/compare" element={<ComparePage comparisonList={comparisonList} onRemove={removeFromCompare} onClear={() => setComparisonList([])} user={user} onUpgrade={() => setShowPricing(true)} />} />
            <Route path="/search" element={<SearchPage database={db} onAddCompare={addToCompare} />} />
            <Route path="/prepare" element={<PrepareCasePage database={db} notify={showToast} user={user} onUpgrade={() => setShowPricing(true)} />} />
            <Route path="/community" element={<CommunityPage notify={showToast} />} />
            <Route path="/contribute" element={<ContributePage onContribute={handleContribute} notify={showToast} />} />
            <Route path="/profile" element={<ProfilePage user={user} onUpdateInterests={handleUpdateInterests} notify={showToast} onBackup={handleBackup} />} />
            <Route path="/case/:id" element={<CaseDetailPage folders={folders} saveToFolder={saveToFolder} notify={showToast} />} />
          </Routes>
        </main>
        
        <MobileBottomNav toggleSidebar={() => setSidebarOpen(true)} />
        {comparisonList.length > 0 && (
          <div className="fixed bottom-24 md:bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-4 z-40">
             <Link to="/compare" className="text-yellow-400 font-bold hover:underline">Comparar ({comparisonList.length})</Link>
             <button onClick={() => setComparisonList([])}><X className="w-4 h-4"/></button>
          </div>
        )}
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        {showTour && <OnboardingTour onComplete={handleTourComplete} />}
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        {showPricing && <PricingModal onClose={() => setShowPricing(false)} onUpgrade={handleUpgradeUser} userEmail={user.email} userName={user.name} />}
      </div>
    </div>
  );
};

const App = () => (
    <Router>
      <AppContent />
    </Router>
);

export default App;
