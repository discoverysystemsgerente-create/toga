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
import { User, JurisprudenceCase, LegalArea, SourceType, Post, SearchHistoryItem, Comment, Folder as FolderType, GeneratedDocument, DocumentType, AgendaEvent, EventType } from '../types';
import { INITIAL_USER, MOCK_DATABASE, MOCK_POSTS, MOCK_HISTORY, MOCK_FOLDERS, MOCK_DOCUMENTS, MOCK_EVENTS } from '../constants';
import { analyzeLegalText, semanticSearch, generateCaseArgument, askDocument, generateLegalDocument, compareCases } from '../services/geminiService';
import { SubscriptionBanner } from '../components/SubscriptionBanner';
import { PricingModal } from '../components/PricingModal';
import { JurisprudenceCard } from '../components/JurisprudenceCard';
import { supabase, isSupabaseConfigured } from '../services/supabase';

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

const PremiumGuard = ({ user, children, onUpgrade }: { user: User, children?: React.ReactNode, onUpgrade: () => void }) => {
  if (user.tier === 'PREMIUM') return <>{children}</>;
  return (
    <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800">
       <div className="filter blur-sm opacity-30 pointer-events-none select-none p-4" aria-hidden="true">
          {children || <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-lg mt-4 w-full"></div>}
       </div>
       <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 z-10 p-6 text-center backdrop-blur-sm">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-full mb-4 shadow-lg animate-bounce">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Función Premium</h3>
          <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md">Esta herramienta avanzada está reservada para suscriptores Pro.</p>
          <button onClick={onUpgrade} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-300" /> Desbloquear Ahora
          </button>
       </div>
    </div>
  );
};

const HelpModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 text-center">
       <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4">
         <LifeBuoy className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
       </div>
       <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Centro de Ayuda</h3>
       <p className="text-slate-500 dark:text-slate-400 mb-6">Contacta a nuestro equipo de soporte jurídico.</p>
       <button onClick={onClose} className="mt-6 text-sm text-slate-400 hover:text-slate-600">Cerrar</button>
    </div>
  </div>
);

const OnboardingTour = ({ onComplete }: { onComplete: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [styles, setStyles] = useState<any>({});
  const steps = [
    { targetId: 'nav-home', title: 'Bienvenido', content: 'Tu asistente jurídico inteligente.', position: 'center' },
    { targetId: 'nav-search', title: 'Búsqueda', content: 'Encuentra jurisprudencia con IA.', position: 'right' },
    { targetId: 'nav-drafter', title: 'Redactor', content: 'Genera documentos automáticamente.', position: 'right' },
    { targetId: 'nav-agenda', title: 'Agenda', content: 'Gestiona tus audiencias.', position: 'right' }
  ];
  const currentTour = steps[currentStep];

  useEffect(() => {
    if (!currentTour || currentTour.position === 'center') { setStyles({}); return; }
    const element = document.getElementById(currentTour.targetId);
    if (!element) { setStyles({ modal: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', position: 'fixed' } }); return; }
    const rect = element.getBoundingClientRect();
    let top = rect.top;
    let left = rect.right + 15;
    if (left > window.innerWidth - 300) { left = rect.left - 315; }
    setStyles({ modal: { top, left, position: 'absolute' }, highlight: { top: rect.top - 5, left: rect.left - 5, width: rect.width + 10, height: rect.height + 10, position: 'absolute' } });
  }, [currentStep]);

  const handleNext = () => currentStep < steps.length - 1 ? setCurrentStep(currentStep + 1) : onComplete();
  if (!currentTour) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/70"></div>
      {styles.highlight && <div className="absolute border-2 border-yellow-400 rounded-lg pointer-events-none transition-all duration-300" style={styles.highlight}></div>}
      <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 z-[101] animate-fade-in" style={styles.modal || {}}>
        <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{currentTour.title}</h3>
        <p className="text-slate-600 dark:text-slate-300 mb-6">{currentTour.content}</p>
        <button onClick={handleNext} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold w-full hover:bg-indigo-700">
            {currentStep === steps.length - 1 ? 'Empezar' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
};

const Sidebar = ({ user, isOpen, toggle, onLogout, unreadNotifications, onHelp }: { user: User, isOpen: boolean, toggle: () => void, onLogout: () => void, unreadNotifications: number, onHelp: () => void }) => {
  const location = useLocation();
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  const isActive = (path: string) => location.pathname === path ? 'bg-indigo-800 text-white shadow-lg' : 'text-indigo-100 hover:bg-indigo-800/50';

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Inicio', id: 'nav-home' },
    { path: '/agenda', icon: Calendar, label: 'Agenda Judicial', id: 'nav-agenda' },
    { path: '/search', icon: Search, label: 'Búsqueda & Historial', id: 'nav-search' },
    { path: '/library', icon: Briefcase, label: 'Biblioteca', id: 'nav-library' },
    { path: '/compare', icon: SplitSquareHorizontal, label: 'Comparador', id: 'nav-compare' },
    { path: '/drafter', icon: FileEdit, label: 'Redactor IA', id: 'nav-drafter' },
    { path: '/prepare', icon: PenTool, label: 'Prepara tu Caso', id: 'nav-prepare' },
    { path: '/tools', icon: Calculator, label: 'Herramientas', id: 'nav-tools' },
    { path: '/community', icon: MessageSquare, label: 'Comunidad', id: 'nav-community' },
    { path: '/contribute', icon: PlusCircle, label: 'Aportar', id: 'nav-contribute' },
    { path: '/profile', icon: UserIcon, label: 'Mi Perfil', id: 'nav-profile' },
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={toggle}></div>}
      <aside className={`fixed md:static inset-y-0 left-0 z-30 w-72 bg-slate-900 text-white transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 flex flex-col shadow-2xl dark:border-r dark:border-slate-800`}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <span className="text-2xl font-bold flex items-center gap-2"><Scale className="text-indigo-400"/> Toga</span>
          <button onClick={toggle} className="md:hidden text-slate-400 hover:text-white"><X/></button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto scrollbar-thin">
          <div className="flex items-center space-x-3 mb-6 p-4 bg-slate-800 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white">{user.name.charAt(0)}</div>
            <div>
                <p className="text-sm font-bold truncate text-white">{user.name}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${user.tier === 'PREMIUM' ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' : 'bg-slate-600 text-slate-300 border-slate-500'}`}>{user.tier}</span>
            </div>
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link id={item.id} key={item.path} to={item.path} onClick={() => window.innerWidth < 768 && toggle()} className={`flex items-center px-4 py-3.5 rounded-xl transition-all ${isActive(item.path)}`}>
                <div className="relative">
                    <item.icon className={`w-5 h-5 mr-3 ${location.pathname === item.path ? 'text-white' : 'text-slate-400'}`}/>
                    {item.path === '/community' && unreadNotifications > 0 && <span className="absolute -top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>}
                </div>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800 space-y-2">
           <button onClick={onHelp} className="flex items-center w-full px-4 py-2 hover:bg-slate-800 rounded-xl text-sm text-slate-300"><LifeBuoy className="w-4 h-4 mr-3"/> Ayuda</button>
           {installPrompt && (
             <button onClick={handleInstall} className="flex items-center justify-center w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold mb-2">
               <Download className="w-4 h-4 mr-2" /> Instalar App
             </button>
           )}
           <button onClick={onLogout} className="flex items-center w-full px-4 py-2 hover:bg-slate-800 rounded-xl text-sm text-red-400"><LogOut className="w-4 h-4 mr-3"/> Salir</button>
        </div>
      </aside>
    </>
  );
};

const LandingPage = ({ onStart }: { onStart: () => void }) => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white text-center p-4">
    <Scale className="w-16 h-16 text-indigo-400 mb-6" />
    <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">Toga Colombia</h1>
    <p className="text-xl text-slate-300 mb-8">Tu asistente jurídico inteligente.</p>
    <button onClick={onStart} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-full text-lg font-bold shadow-lg shadow-indigo-900/40 transition-transform hover:scale-105">Comenzar Ahora</button>
  </div>
);

const HomePage = ({ user, events }: { user: User, events: AgendaEvent[] }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Bienvenido, {user.name}</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold mb-2 text-indigo-600 dark:text-indigo-400">Próximos Eventos</h3>
        {events.slice(0, 3).map((e:any) => <div key={e.id} className="text-sm py-2 border-b border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300">{e.title} - <b>{e.date}</b></div>)}
        {events.length === 0 && <p className="text-slate-400 text-sm">Sin eventos pendientes.</p>}
      </div>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
           <h3 className="font-semibold mb-2 text-indigo-600 dark:text-indigo-400">Reputación</h3>
           <div className="text-3xl font-bold text-slate-800 dark:text-white">{user.reputation} <span className="text-sm font-normal text-slate-500">XP</span></div>
      </div>
    </div>
  </div>
);

const AgendaPage = ({ events, onAddEvent, onToggleEvent, onDeleteEvent }: { events: AgendaEvent[], onAddEvent: (e: AgendaEvent) => void, onToggleEvent: (id: string) => void, onDeleteEvent: (id: string) => void }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<AgendaEvent>>({ type: 'AUDIENCIA' });
  const handleSave = () => { if (newEvent.title && newEvent.date) { onAddEvent({ id: Date.now().toString(), title: newEvent.title, date: newEvent.date, type: newEvent.type as EventType, completed: false }); setShowAdd(false); setNewEvent({type: 'AUDIENCIA'}); } };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800 dark:text-white">Agenda Judicial</h2><button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center"><Plus className="w-4 h-4 mr-2"/> Agregar</button></div>
      {showAdd && <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow border dark:border-slate-700 mb-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input className="border p-2 rounded dark:bg-slate-700 dark:text-white dark:border-slate-600" placeholder="Título" value={newEvent.title||''} onChange={e=>setNewEvent({...newEvent, title:e.target.value})} /><input type="date" className="border p-2 rounded dark:bg-slate-700 dark:text-white dark:border-slate-600" value={newEvent.date||''} onChange={e=>setNewEvent({...newEvent, date:e.target.value})} /></div><button onClick={handleSave} className="bg-emerald-600 text-white px-4 py-2 rounded mt-4">Guardar</button></div>}
      <div className="space-y-4">{events.map((e:any)=><div key={e.id} className={`flex justify-between p-4 bg-white dark:bg-slate-800 border-l-4 rounded-xl shadow-sm ${e.completed ? 'border-emerald-500 opacity-60' : 'border-indigo-500'}`}><div className="flex items-center"><input type="checkbox" checked={e.completed} onChange={()=>onToggleEvent(e.id)} className="mr-4 h-5 w-5"/><div className="text-slate-800 dark:text-white"><h4 className={`font-bold ${e.completed?'line-through':''}`}>{e.title}</h4><p className="text-sm text-slate-500">{e.date} - {e.type}</p></div></div><button onClick={()=>onDeleteEvent(e.id)} className="text-red-500 hover:text-red-700"><Trash2/></button></div>)}</div>
    </div>
  );
};

const LibraryPage = ({ folders, documents, onCreateFolder }: { folders: FolderType[], documents: GeneratedDocument[], onCreateFolder: (n: string, c: string) => void }) => {
  const [newF, setNewF] = useState('');
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800 dark:text-white">Biblioteca</h2><div className="flex"><input className="border p-2 rounded-l dark:bg-slate-700 dark:text-white dark:border-slate-600" placeholder="Nuevo Expediente" value={newF} onChange={e=>setNewF(e.target.value)}/><button onClick={()=>{if(newF) onCreateFolder(newF, 'bg-blue-500'); setNewF('')}} className="bg-indigo-600 text-white p-2 rounded-r"><FolderPlus/></button></div></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{folders.map((f:any)=><div key={f.id} className="p-4 border dark:border-slate-700 rounded-xl flex flex-col items-center hover:shadow-md cursor-pointer bg-white dark:bg-slate-800"><Folder className="w-12 h-12 text-blue-500 mb-2"/><span className="font-bold text-slate-800 dark:text-white">{f.name}</span><span className="text-xs text-slate-500">{documents.filter((d:any)=>d.folderId===f.id).length} docs</span></div>)}</div>
      <h3 className="font-bold mt-4 text-slate-800 dark:text-white">Documentos Recientes</h3><div className="space-y-2">{documents.map((d:any)=><div key={d.id} className="p-4 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded flex items-center"><FileText className="mr-2 text-slate-400"/><span className="font-bold text-slate-800 dark:text-white">{d.title}</span></div>)}</div>
    </div>
  );
};

const DrafterPage = ({ folders, saveDocument, notify, user, onUpgrade }: { folders: FolderType[], saveDocument: (d: GeneratedDocument) => void, notify: any, user: User, onUpgrade: () => void }) => {
  const [type, setType] = useState('TUTELA');
  const [details, setDetails] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const handleDraft = async () => { setLoading(true); const t = await generateLegalDocument(type, details); setResult(t); setLoading(false); };
  return (
    <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800 dark:text-white">Redactor IA</h2><PremiumGuard user={user} onUpgrade={onUpgrade}><div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm"><select className="w-full border p-2 rounded mb-4 dark:bg-slate-700 dark:text-white dark:border-slate-600" value={type} onChange={e=>setType(e.target.value)}><option value="TUTELA">Tutela</option><option value="DERECHO_PETICION">Derecho Petición</option><option value="CONTRATO">Contrato</option></select><textarea className="w-full border p-2 h-40 rounded dark:bg-slate-700 dark:text-white dark:border-slate-600" placeholder="Detalles del caso..." value={details} onChange={e=>setDetails(e.target.value)}></textarea><button onClick={handleDraft} disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded mt-4 font-bold flex justify-center items-center">{loading?<Loader2 className="animate-spin mr-2"/>:<PenTool className="mr-2 w-4 h-4"/>} Generar</button></div>
      <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border dark:border-slate-700 h-96 overflow-y-auto whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-300">{result||'El documento aparecerá aquí.'}{result&&<button onClick={()=>{saveDocument({id:Date.now().toString(),title:`${type} Gen`,type: type as DocumentType,content:result,createdAt:new Date().toISOString()});notify('Guardado','success')}} className="mt-4 w-full border border-indigo-600 text-indigo-600 py-2 rounded hover:bg-indigo-50 font-bold">Guardar</button>}</div>
    </div></PremiumGuard></div>
  );
};

const ToolsPage = ({ onAddToAgenda }: { onAddToAgenda: (title: string, date: string) => void }) => (
  <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800 dark:text-white">Herramientas</h2><div className="grid md:grid-cols-3 gap-6">
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md"><Calculator className="w-10 h-10 text-indigo-500 mb-2"/><h3 className="font-bold text-slate-800 dark:text-white">Calculadora Términos</h3><p className="text-sm text-slate-500">Días hábiles y plazos.</p></div>
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md"><Clipboard className="w-10 h-10 text-emerald-500 mb-2"/><h3 className="font-bold text-slate-800 dark:text-white">Liquidación Laboral</h3><p className="text-sm text-slate-500">Prestaciones sociales.</p></div>
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md"><Calendar className="w-10 h-10 text-orange-500 mb-2"/><h3 className="font-bold text-slate-800 dark:text-white">Indexación Cánones</h3><p className="text-sm text-slate-500">Ajuste IPC.</p></div>
  </div></div>
);

const ComparePage = ({ comparisonList, onRemove, onClear, user, onUpgrade }: { comparisonList: JurisprudenceCase[], onRemove: (id: string) => void, onClear: () => void, user: User, onUpgrade: () => void }) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const handleCompare = async () => { setLoading(true); const r = await compareCases(comparisonList[0], comparisonList[1]); setAnalysis(r); setLoading(false); };
  return (
    <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800 dark:text-white">Comparador</h2><PremiumGuard user={user} onUpgrade={onUpgrade}>
      <div className="flex gap-4">{comparisonList.map((c:any)=><div key={c.id} className="flex-1 bg-white dark:bg-slate-800 p-4 border dark:border-slate-700 rounded relative"><button onClick={()=>onRemove(c.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><X/></button><h4 className="font-bold text-slate-800 dark:text-white">{c.title}</h4><p className="text-xs text-slate-500">{c.date}</p></div>)}{comparisonList.length<2&&<div className="flex-1 border-2 border-dashed dark:border-slate-600 rounded p-4 flex items-center justify-center text-slate-400">Selecciona otra sentencia</div>}</div>
      {comparisonList.length===2&&<button onClick={handleCompare} disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-lg mt-4 font-bold shadow-lg">{loading?'Analizando con IA...':'Comparar Sentencias'}</button>}
      {analysis&&<div className="bg-white dark:bg-slate-800 p-6 mt-4 rounded-xl border dark:border-slate-700 space-y-4"><div><h4 className="font-bold text-emerald-600">Similitudes</h4><p className="text-slate-700 dark:text-slate-300">{analysis.similarities}</p></div><div><h4 className="font-bold text-red-600">Diferencias</h4><p className="text-slate-700 dark:text-slate-300">{analysis.differences}</p></div><div><h4 className="font-bold text-indigo-600">Conclusión</h4><p className="text-slate-700 dark:text-slate-300">{analysis.conclusion}</p></div></div>}
    </PremiumGuard></div>
  );
};

const SearchPage = ({ database, onAddCompare }: { database: JurisprudenceCase[], onAddCompare: (c: JurisprudenceCase) => void }) => {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<JurisprudenceCase[]>([]);
  const handleS = () => { if(q) setRes(database.filter((c:any)=>c.title.toLowerCase().includes(q.toLowerCase()) || c.text.toLowerCase().includes(q.toLowerCase()))); };
  return (
    <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800 dark:text-white">Búsqueda Inteligente</h2><div className="flex gap-2"><div className="relative flex-1"><input className="w-full border p-3 pl-4 pr-10 rounded-lg dark:bg-slate-800 dark:text-white dark:border-slate-700" placeholder="Buscar sentencias..." value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleS()}/><div className="absolute right-2 top-2"><VoiceInput onResult={(t)=>setQ(t)}/></div></div><button onClick={handleS} className="bg-indigo-600 text-white px-6 rounded-lg"><Search/></button></div><div className="space-y-4">{res.map((c:any)=><div key={c.id} className="relative group"><JurisprudenceCard data={c}/><button onClick={()=>onAddCompare(c)} className="absolute top-4 right-4 p-2 bg-white rounded-full shadow border text-slate-500 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Comparar"><SplitSquareHorizontal className="w-4 h-4"/></button></div>)}</div></div>
  );
};

const PrepareCasePage = ({ database, notify, user, onUpgrade }: { database: JurisprudenceCase[], notify: any, user: User, onUpgrade: () => void }) => {
  const [f, setF] = useState(''); const [s, setS] = useState(''); const [l, setL] = useState(false);
  const handleA = async () => { setL(true); const r = await generateCaseArgument(f, "", database); setS(r); setL(false); };
  return (
    <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800 dark:text-white">Prepara tu Caso</h2><PremiumGuard user={user} onUpgrade={onUpgrade}><div className="grid md:grid-cols-2 gap-6"><div className="relative"><textarea className="w-full border p-4 rounded-xl h-64 dark:bg-slate-800 dark:text-white dark:border-slate-700" placeholder="Describe los hechos..." value={f} onChange={e=>setF(e.target.value)}></textarea><div className="absolute bottom-4 right-4"><VoiceInput onResult={(t)=>setF(prev=>prev+' '+t)}/></div></div><div className="bg-white dark:bg-slate-800 p-6 border dark:border-slate-700 rounded-xl h-64 overflow-y-auto shadow-sm"><h3 className="font-bold mb-2 text-slate-800 dark:text-white">Estrategia</h3><div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{s||'La estrategia generada aparecerá aquí.'}</div></div></div><button onClick={handleA} disabled={l} className="w-full bg-indigo-600 text-white py-3 rounded-lg mt-4 font-bold flex justify-center items-center">{l?<Loader2 className="animate-spin mr-2"/>:<Zap className="mr-2"/>} Generar Estrategia</button></PremiumGuard></div>
  );
};

const CommunityPage = ({ notify }: { notify: any }) => (<div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800 dark:text-white">Comunidad Jurídica</h2><div className="space-y-4">{MOCK_POSTS.map((p:any)=><div key={p.id} className="bg-white dark:bg-slate-800 p-6 border dark:border-slate-700 rounded-xl shadow-sm"><div className="flex justify-between mb-2"><span className="font-bold text-slate-800 dark:text-white">{p.authorName}</span><span className="text-xs text-slate-500">{p.date}</span></div><p className="text-slate-700 dark:text-slate-300 mb-4">{p.content}</p><div className="flex gap-4 text-slate-500 text-sm"><button className="flex items-center hover:text-indigo-600"><ThumbsUp className="w-4 h-4 mr-1"/> {p.likes}</button><button className="flex items-center hover:text-indigo-600"><MessageSquare className="w-4 h-4 mr-1"/> {p.comments.length}</button></div></div>)}</div></div>);

const ContributePage = ({ onContribute, notify }: { onContribute: (c: JurisprudenceCase) => void, notify: any }) => {
  const [t, setT] = useState(''); const [txt, setTxt] = useState('');
  const sub = () => { if(t&&txt) { onContribute({id:`c-${Date.now()}`,title:t,text:txt,summary:txt.slice(0,50),area:LegalArea.CONSTITUCIONAL,tags:[],date:new Date().toISOString().split('T')[0],corporation:'Usuario',authorId:'u',aiProcessed:false,sourceType:'TEXT'}); setT(''); setTxt(''); notify('Enviado','success'); } };
  return (<div className="space-y-6 max-w-2xl mx-auto"><h2 className="text-2xl font-bold text-slate-800 dark:text-white">Aportar Sentencia</h2><div className="bg-white dark:bg-slate-800 p-6 border dark:border-slate-700 rounded-xl shadow-sm space-y-4"><input className="w-full border p-3 rounded-lg dark:bg-slate-700 dark:text-white dark:border-slate-600" placeholder="Título (ej: Sentencia C-123)" value={t} onChange={e=>setT(e.target.value)}/><textarea className="w-full border p-3 h-40 rounded-lg dark:bg-slate-700 dark:text-white dark:border-slate-600" placeholder="Texto..." value={txt} onChange={e=>setTxt(e.target.value)}></textarea><button onClick={sub} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold">Enviar Aporte</button></div></div>);
};

const ProfilePage = ({ user, notify, onBackup, onUpdateInterests }: { user: User, notify: any, onBackup: () => void, onUpdateInterests: (i: LegalArea[]) => void }) => (<div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800 dark:text-white">Mi Perfil</h2><div className="bg-white dark:bg-slate-800 p-8 border dark:border-slate-700 rounded-xl shadow-sm flex items-center gap-6"><div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">{user.name.charAt(0)}</div><div><h3 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h3><p className="text-slate-500">{user.email}</p><div className="mt-2 inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">{user.tier === 'PREMIUM' ? 'Miembro Premium' : 'Plan Gratuito'}</div></div><button onClick={onBackup} className="ml-auto border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center text-sm text-slate-700 dark:text-slate-300"><Download className="w-4 h-4 mr-2"/> Backup</button></div></div>);

const CaseDetailPage = ({ folders, saveToFolder, notify }: { folders: FolderType[], saveToFolder: (cid: string, fid: string) => void, notify: any }) => { const {id}=useParams(); return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Detalles del caso {id} (Implementación pendiente)</div>; };

const MobileBottomNav = ({ toggleSidebar }: { toggleSidebar: () => void }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-3 flex justify-around md:hidden z-50">
    <Link to="/" className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"><LayoutDashboard/></Link><Link to="/search" className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"><Search/></Link><button onClick={toggleSidebar} className="bg-indigo-600 text-white p-3 rounded-full -mt-8 shadow-lg"><Menu/></button><Link to="/agenda" className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"><Calendar/></Link><Link to="/profile" className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"><UserIcon/></Link>
  </div>
);

const AuthPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
   const [reg, setReg] = useState(false); const [e, setE] = useState(''); const [p, setP] = useState(''); const [n, setN] = useState(''); const [l, setL] = useState(false); const [err, setErr] = useState('');
   const handle = async (ev: React.FormEvent) => { ev.preventDefault(); setL(true); setErr(''); try { 
     // Modo Demo si no hay Supabase
     if(!isSupabaseConfigured()) { setTimeout(()=>{onLogin({...INITIAL_USER,email:e||'demo@toga.co',name:n||'Usuario Demo'});setL(false)},1000); return; }
     
     if(reg) { const {data,error} = await supabase.auth.signUp({email:e,password:p,options:{data:{full_name:n}}}); if(error) throw error; if(data.user) { await supabase.from('profiles').insert([{id:data.user.id,email:e,full_name:n}]); onLogin({...INITIAL_USER,id:data.user.id,email:e,name:n}); } }
     else { const {data,error} = await supabase.auth.signInWithPassword({email:e,password:p}); if(error) throw error; if(data.user) { const {data:pf} = await supabase.from('profiles').select('*').eq('id',data.user.id).single(); onLogin({...INITIAL_USER,id:data.user.id,email:e,name:pf?.full_name||'Usuario',tier:pf?.tier||'FREE',reputation:pf?.reputation||0}); } }
   } catch(x:any){setErr(x.message)} finally{setL(false)} };
   return (<div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4"><div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md"><div className="flex justify-center mb-6"><div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-full"><Scale className="w-8 h-8 text-indigo-600 dark:text-indigo-400"/></div></div><h2 className="text-2xl font-bold text-center mb-2 text-slate-900 dark:text-white">{reg?'Crear Cuenta':'Bienvenido'}</h2>{!isSupabaseConfigured()&&<div className="bg-amber-100 text-amber-800 p-2 rounded mb-4 text-xs text-center">Modo Demo Offline Activado</div>}{err&&<div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{err}</div>}<form onSubmit={handle} className="space-y-4">{reg&&<input className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:text-white dark:border-slate-600" placeholder="Nombre Completo" value={n} onChange={x=>setN(x.target.value)} required={reg}/>}<input className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:text-white dark:border-slate-600" type="email" placeholder="Correo" value={e} onChange={x=>setE(x.target.value)} required/><input className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:text-white dark:border-slate-600" type="password" placeholder="Contraseña" value={p} onChange={x=>setP(x.target.value)} required/><button disabled={l} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold shadow-md hover:bg-indigo-700 flex justify-center">{l?<Loader2 className="animate-spin"/>:(reg?'Registrarse':'Iniciar Sesión')}</button></form><button onClick={()=>setReg(!reg)} className="mt-6 w-full text-center text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">{reg?'¿Ya tienes cuenta? Inicia Sesión':'¿No tienes cuenta? Regístrate'}</button></div></div>);
};

const AppContent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [comparisonList, setComparisonList] = useState<JurisprudenceCase[]>([]);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|'info'} | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([{id:1,text:'Bienvenido a Toga',read:false}]);
  
  // Data
  const [folders, setFolders] = useState<FolderType[]>(MOCK_FOLDERS);
  const [documents, setDocuments] = useState<GeneratedDocument[]>(MOCK_DOCUMENTS);
  const [db, setDb] = useState<JurisprudenceCase[]>(MOCK_DATABASE);
  const [events, setEvents] = useState<AgendaEvent[]>(MOCK_EVENTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
        try {
            if (!isSupabaseConfigured()) throw new Error("No config");
            
            const {data:{session}} = await supabase.auth.getSession();
            if(session?.user) {
                const {data:pf} = await supabase.from('profiles').select('*').eq('id',session.user.id).single();
                setUser({id:session.user.id, email:session.user.email||'', name:pf?.full_name||'Usuario', tier:pf?.tier||'FREE', isActive:true, interests:pf?.interests||[], reputation:pf?.reputation||0});
                
                const [c, f, d, e] = await Promise.all([
                    supabase.from('cases').select('*'),
                    supabase.from('folders').select('*').eq('user_id',session.user.id),
                    supabase.from('documents').select('*'),
                    supabase.from('events').select('*').eq('user_id',session.user.id)
                ]);
                if(c.data) setDb([...MOCK_DATABASE, ...c.data as any]);
                if(f.data) setFolders(f.data as any);
                if(d.data) setDocuments(d.data as any);
                if(e.data) setEvents(e.data as any);
            }
        } catch(e) { 
            // Fallback for Demo
        } finally { setLoading(false); }
    };
    init();
  }, []);

  useEffect(() => { if(user && !localStorage.getItem('tour_done')) setTimeout(()=>setShowTour(true),1500); }, [user]);

  const showToast = (msg: string, type: 'success'|'error'|'info') => { setToast({msg, type}); setTimeout(()=>setToast(null),3000); };
  const addToCompare = (c: JurisprudenceCase) => { if(comparisonList.length>=2) return showToast('Máximo 2 sentencias','error'); if(comparisonList.find(x=>x.id===c.id)) return; setComparisonList([...comparisonList,c]); showToast('Añadido al comparador','info'); };
  const handleUpgrade = async () => { if(user){ const u = {...user, tier:'PREMIUM' as const}; setUser(u); if(isSupabaseConfigured()) await supabase.from('profiles').update({tier:'PREMIUM'}).eq('id',user.id); setShowPricing(false); showToast('¡Bienvenido a Premium!','success'); } };
  
  const handleContribute = async (c: JurisprudenceCase) => {
      setDb([c, ...db]);
      if(user && isSupabaseConfigured()) {
          const nr = (user.reputation||0)+50;
          setUser({...user, reputation: nr});
          await Promise.all([supabase.from('cases').insert([{...c, user_id:user.id, analysis:c.analysis}]), supabase.from('profiles').update({reputation:nr}).eq('id',user.id)]);
      }
      setNotifications([{id:Date.now(), text:`Ganaste 50XP por aportar`, read:false}, ...notifications]);
  };

  if(loading) return <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><Loader2 className="w-10 h-10 animate-spin text-indigo-600"/></div>;
  if(!user) return <Routes><Route path="/" element={<LandingPage onStart={()=>setUser({...INITIAL_USER, id:'temp'})}/>}/><Route path="/auth" element={<AuthPage onLogin={setUser}/>}/><Route path="*" element={<Navigate to="/"/>}/></Routes>;
  if(user.id==='temp') return <AuthPage onLogin={setUser}/>;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      <Sidebar user={user} isOpen={sidebarOpen} toggle={()=>setSidebarOpen(!sidebarOpen)} onLogout={async()=>{if(isSupabaseConfigured())await supabase.auth.signOut(); setUser(null);}} unreadNotifications={notifications.filter(n=>!n.read).length} onHelp={()=>setShowHelp(true)}/>
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center z-10">
            <div className="md:hidden font-bold flex gap-2"><Scale className="text-indigo-600"/> Toga</div>
            <div className="ml-auto relative">
                <button onClick={()=>setShowNotifications(!showNotifications)} className="p-2 relative hover:text-indigo-600"><Bell className="w-6 h-6"/>{notifications.some(n=>!n.read)&&<span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>}</button>
                {showNotifications && <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border dark:border-slate-700 z-50"><div className="p-3 font-bold border-b dark:border-slate-700">Notificaciones</div><div className="max-h-64 overflow-y-auto">{notifications.map(n=><div key={n.id} className="p-3 text-sm border-b dark:border-slate-700">{n.text}</div>)}</div></div>}
            </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 relative">
          <SubscriptionBanner user={user} onUpgrade={()=>setShowPricing(true)}/>
          <Routes>
            <Route path="/" element={<HomePage user={user} events={events}/>}/>
            <Route path="/agenda" element={<AgendaPage events={events} onAddEvent={async(e:any)=>{setEvents([...events,e]);if(user.id && isSupabaseConfigured())await supabase.from('events').insert([{...e,user_id:user.id}]);showToast('Agendado','success')}} onToggleEvent={()=>{}} onDeleteEvent={async(id:string)=>{setEvents(events.filter(x=>x.id!==id));if(isSupabaseConfigured())await supabase.from('events').delete().eq('id',id)}}/>}/>
            <Route path="/library" element={<LibraryPage folders={folders} documents={documents} onCreateFolder={async(n:string,c:string)=>{const f={id:`f-${Date.now()}`,name:n,color:c,createdAt:new Date().toISOString()};setFolders([...folders,f]);if(user.id && isSupabaseConfigured())await supabase.from('folders').insert([{...f,user_id:user.id}]);showToast('Creado','success')}}/>}/>
            <Route path="/drafter" element={<DrafterPage folders={folders} saveDocument={async(d:any)=>{setDocuments([...documents,d]);if(user.id && isSupabaseConfigured())await supabase.from('documents').insert([{...d,user_id:user.id}]);showToast('Guardado','success')}} notify={showToast} user={user} onUpgrade={()=>setShowPricing(true)}/>}/>
            <Route path="/tools" element={<ToolsPage onAddToAgenda={()=>{}}/>}/>
            <Route path="/compare" element={<ComparePage comparisonList={comparisonList} onRemove={(id:string)=>setComparisonList(comparisonList.filter(c=>c.id!==id))} onClear={()=>setComparisonList([])} user={user} onUpgrade={()=>setShowPricing(true)}/>}/>
            <Route path="/search" element={<SearchPage database={db} onAddCompare={addToCompare}/>}/>
            <Route path="/prepare" element={<PrepareCasePage database={db} notify={showToast} user={user} onUpgrade={()=>setShowPricing(true)}/>}/>
            <Route path="/community" element={<CommunityPage notify={showToast}/>}/>
            <Route path="/contribute" element={<ContributePage onContribute={handleContribute} notify={showToast}/>}/>
            <Route path="/profile" element={<ProfilePage user={user} onBackup={()=>downloadFile(JSON.stringify({user,db,folders,documents,events}),`backup-${Date.now()}.json`,'application/json')} notify={showToast} onUpdateInterests={async(i:any)=>{setUser({...user,interests:i});if(isSupabaseConfigured())await supabase.from('profiles').update({interests:i}).eq('id',user.id)}}/>}/>
            <Route path="/case/:id" element={<CaseDetailPage folders={folders} saveToFolder={()=>{}} notify={showToast}/>}/>
          </Routes>
        </main>
        <MobileBottomNav toggleSidebar={()=>setSidebarOpen(true)}/>
        {comparisonList.length>0 && <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex gap-4 z-40 items-center"><Link to="/compare" className="font-bold text-yellow-400 hover:underline">Comparar ({comparisonList.length})</Link><button onClick={()=>setComparisonList([])}><X className="w-4 h-4"/></button></div>}
        {toast && <Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
        {showTour && <OnboardingTour onComplete={()=>{setShowTour(false);localStorage.setItem('tour_done','1')}}/>}
        {showHelp && <HelpModal onClose={()=>setShowHelp(false)}/>}
        {showPricing && <PricingModal onClose={()=>setShowPricing(false)} onUpgrade={handleUpgrade} userEmail={user.email} userName={user.name}/>}
      </div>
    </div>
  );
};

const App = () => <Router><AppContent/></Router>;
export default App;
