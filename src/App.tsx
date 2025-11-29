import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Search, PlusCircle, User as UserIcon, BookOpen, 
  Menu, X, Scale, CheckCircle, FileText, FileUp, Link as LinkIcon, 
  Bookmark, MessageSquare, History, Send, ThumbsUp, ChevronLeft, PenTool, Share2,
  Bell, Settings, LogOut, Check, AlertCircle, Loader2, Download, Tag, Lock,
  ArrowRight, ShieldCheck, Zap, Globe, Headphones, PlayCircle, PauseCircle,
  MessageCircleQuestion, XCircle, Filter, Trophy, Calculator, Clipboard, Calendar,
  FileEdit, Folder, FolderPlus, Briefcase, Plus, SplitSquareHorizontal, ArrowLeftRight, Trash2, Copy, Volume2, StopCircle, Moon, Sun, FileDown, Save, Clock, Mic, Mail, AlignLeft, List, GitCommitVertical, HelpCircle, Maximize, Minimize, LifeBuoy, Shield
} from 'lucide-react';
import { User, JurisprudenceCase, LegalArea, SourceType, Post, SearchHistoryItem, Comment, Folder as FolderType, GeneratedDocument, DocumentType, AgendaEvent, EventType } from '../types';
import { INITIAL_USER, MOCK_DATABASE, MOCK_POSTS, MOCK_HISTORY, MOCK_FOLDERS, MOCK_DOCUMENTS, MOCK_EVENTS } from '../constants';
import { analyzeLegalText, semanticSearch, generateCaseArgument, askDocument, generateLegalDocument, compareCases } from '../services/geminiService';
import { SubscriptionBanner } from '../components/SubscriptionBanner';
import { PricingModal } from '../components/PricingModal';
import { JurisprudenceCard } from '../components/JurisprudenceCard';
import { supabase, isSupabaseConfigured } from '../services/supabase';

// --- Components ---

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-indigo-600' };
  return (
    <div className={`fixed bottom-20 md:bottom-6 right-6 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-xl flex items-center z-[60]`}>
      <span className="font-medium mr-2">{message}</span>
      <button onClick={onClose}><X className="w-4 h-4" /></button>
    </div>
  );
};

const VoiceInput = ({ onResult }: { onResult: (text: string) => void }) => {
  const [listening, setListening] = useState(false);
  const start = () => {
    // @ts-ignore
    if (!window.webkitSpeechRecognition) return alert("Usa Chrome para dictado.");
    try {
      // @ts-ignore
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = 'es-CO';
      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onresult = (e: any) => onResult(e.results[0][0].transcript);
      recognition.start();
    } catch (e) { setListening(false); }
  };
  return (
    <button type="button" onClick={start} className={`p-2 rounded-full ${listening ? 'bg-red-100 text-red-600' : 'text-slate-400 hover:text-indigo-600'}`}>
      <Mic className="w-5 h-5" />
    </button>
  );
};

const PremiumGuard = ({ user, children, onUpgrade }: { user: User, children?: React.ReactNode, onUpgrade: () => void }) => {
  if (user.tier === 'PREMIUM') return <>{children}</>;
  return (
    <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 p-8 text-center">
       <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
          <Lock className="w-8 h-8 text-indigo-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Función Premium</h3>
          <button onClick={onUpgrade} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">Desbloquear</button>
       </div>
       <div className="opacity-20 pointer-events-none">{children || <div className="h-32"></div>}</div>
    </div>
  );
};

const Sidebar = ({ user, isOpen, toggle, onLogout, unreadNotifications }: { user: User, isOpen: boolean, toggle: () => void, onLogout: () => void, unreadNotifications: number }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? 'bg-indigo-800 text-white' : 'text-slate-400 hover:text-white';
  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Inicio' },
    { path: '/search', icon: Search, label: 'Búsqueda' },
    { path: '/library', icon: Briefcase, label: 'Biblioteca' },
    { path: '/agenda', icon: Calendar, label: 'Agenda' },
    { path: '/drafter', icon: FileEdit, label: 'Redactor IA' },
    { path: '/compare', icon: SplitSquareHorizontal, label: 'Comparador' },
    { path: '/profile', icon: UserIcon, label: 'Perfil' },
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={toggle}></div>}
      <aside className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 flex flex-col`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <span className="text-xl font-bold flex items-center gap-2"><Scale className="text-indigo-400"/> Toga</span>
          <button onClick={toggle} className="md:hidden"><X/></button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-6 flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold">{user.name.charAt(0)}</div>
            <div><p className="text-sm font-bold truncate w-32">{user.name}</p><span className="text-xs text-slate-400">{user.tier}</span></div>
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link key={item.path} to={item.path} onClick={() => window.innerWidth < 768 && toggle()} className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive(item.path)}`}>
                <item.icon className="w-5 h-5 mr-3"/> {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800">
           <button onClick={onLogout} className="flex items-center w-full px-4 py-2 hover:bg-slate-800 rounded-lg text-sm text-red-400"><LogOut className="w-4 h-4 mr-3"/> Salir</button>
        </div>
      </aside>
    </>
  );
};

// --- Pages ---

const HomePage = ({ user }: { user: User }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Hola, {user.name}</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-indigo-600 mb-2">Estado</h3>
        <p className="text-slate-600 dark:text-slate-300">Nivel: {user.reputation} XP</p>
      </div>
    </div>
  </div>
);

const SearchPage = ({ database }: { database: JurisprudenceCase[] }) => {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<JurisprudenceCase[]>([]);
  const handleS = () => { if(q) setRes(database.filter((c:any)=>c.title.toLowerCase().includes(q.toLowerCase()) || c.text.toLowerCase().includes(q.toLowerCase()))); };
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Búsqueda</h2>
      <div className="flex gap-2">
        <div className="relative flex-1"><input className="w-full border p-3 pl-4 pr-10 rounded-lg dark:bg-slate-800 dark:text-white" placeholder="Buscar..." value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleS()}/><div className="absolute right-2 top-2"><VoiceInput onResult={setQ}/></div></div>
        <button onClick={handleS} className="bg-indigo-600 text-white px-6 rounded-lg"><Search/></button>
      </div>
      <div className="space-y-4">{res.map((c:any)=><JurisprudenceCard key={c.id} data={c}/>)}</div>
    </div>
  );
};

const AuthPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
   const [reg, setReg] = useState(false); const [e, setE] = useState(''); const [p, setP] = useState(''); const [n, setN] = useState(''); const [l, setL] = useState(false); const [err, setErr] = useState('');
   const handle = async (ev: React.FormEvent) => { 
     ev.preventDefault(); setL(true); setErr(''); 
     if(!isSupabaseConfigured()) { setTimeout(()=>{onLogin({...INITIAL_USER,email:e||'demo@toga.co',name:n||'Usuario Demo'});setL(false)},1000); return; }
     try { 
       if(reg) { 
         const {data,error} = await supabase.auth.signUp({email:e,password:p,options:{data:{full_name:n}}}); 
         if(error) throw error; 
         if(data.user) { await supabase.from('profiles').insert([{id:data.user.id,email:e,full_name:n}]); onLogin({...INITIAL_USER,id:data.user.id,email:e,name:n}); } 
       } else { 
         const {data,error} = await supabase.auth.signInWithPassword({email:e,password:p}); 
         if(error) throw error; 
         if(data.user) { const {data:pf} = await supabase.from('profiles').select('*').eq('id',data.user.id).single(); onLogin({...INITIAL_USER,id:data.user.id,email:e,name:pf?.full_name||'Usuario',tier:pf?.tier||'FREE',reputation:pf?.reputation||0}); } 
       }
     } catch(x:any){setErr(x.message)} finally{setL(false)} 
   };
   return (
     <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
       <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
         <h2 className="text-2xl font-bold text-center mb-6 text-slate-900 dark:text-white">{reg?'Crear Cuenta':'Bienvenido'}</h2>
         {!isSupabaseConfigured() && <div className="bg-amber-100 text-amber-800 p-2 rounded mb-4 text-xs text-center">Modo Demo Offline</div>}
         {err && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{err}</div>}
         <form onSubmit={handle} className="space-y-4">
            {reg && <input className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:text-white" placeholder="Nombre" value={n} onChange={x=>setN(x.target.value)} required/>}
            <input className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:text-white" type="email" placeholder="Correo" value={e} onChange={x=>setE(x.target.value)} required/>
            <input className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:text-white" type="password" placeholder="Contraseña" value={p} onChange={x=>setP(x.target.value)} required/>
            <button disabled={l} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold shadow-md hover:bg-indigo-700 flex justify-center">{l?<Loader2 className="animate-spin"/>:(reg?'Registrarse':'Iniciar Sesión')}</button>
         </form>
         <button onClick={()=>setReg(!reg)} className="mt-6 w-full text-center text-sm text-indigo-600 font-medium hover:underline">{reg?'¿Ya tienes cuenta? Inicia Sesión':'¿No tienes cuenta? Regístrate'}</button>
       </div>
     </div>
   );
};

// --- App Container ---

const AppContent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [db, setDb] = useState<JurisprudenceCase[]>(MOCK_DATABASE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
        try {
            if (!isSupabaseConfigured()) throw new Error("No config");
            const {data:{session}} = await supabase.auth.getSession();
            if(session?.user) {
                const {data:pf} = await supabase.from('profiles').select('*').eq('id',session.user.id).single();
                setUser({id:session.user.id, email:session.user.email||'', name:pf?.full_name||'Usuario', tier:pf?.tier||'FREE', isActive:true, interests:pf?.interests||[], reputation:pf?.reputation||0});
                const cases = await supabase.from('cases').select('*');
                if(cases.data) setDb([...MOCK_DATABASE, ...cases.data as any]);
            }
        } catch(e) { } finally { setLoading(false); }
    };
    init();
  }, []);

  const handleUpgrade = async () => { if(user){ setUser({...user, tier:'PREMIUM'}); if(isSupabaseConfigured()) await supabase.from('profiles').update({tier:'PREMIUM'}).eq('id',user.id); setShowPricing(false); } };

  if(loading) return <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><Loader2 className="w-10 h-10 animate-spin text-indigo-600"/></div>;
  if(!user) return <AuthPage onLogin={setUser}/>;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      <Sidebar user={user} isOpen={sidebarOpen} toggle={()=>setSidebarOpen(!sidebarOpen)} onLogout={async()=>{if(isSupabaseConfigured())await supabase.auth.signOut(); setUser(null);}} unreadNotifications={0}/>
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center md:hidden z-10">
            <div className="font-bold flex gap-2"><Scale className="text-indigo-600"/> Toga</div>
            <button onClick={()=>setSidebarOpen(true)} className="p-2"><Menu className="w-6 h-6"/></button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <SubscriptionBanner user={user} onUpgrade={()=>setShowPricing(true)}/>
          <Routes>
            <Route path="/" element={<HomePage user={user}/>}/>
            <Route path="/search" element={<SearchPage database={db}/>}/>
            <Route path="/library" element={<div className="p-10 text-center text-slate-500">Biblioteca (Próximamente)</div>}/>
            <Route path="/agenda" element={<div className="p-10 text-center text-slate-500">Agenda (Próximamente)</div>}/>
            <Route path="/drafter" element={<PremiumGuard user={user} onUpgrade={()=>setShowPricing(true)}><div className="p-10 text-center">Redactor IA (Solo Premium)</div></PremiumGuard>}/>
            <Route path="/compare" element={<PremiumGuard user={user} onUpgrade={()=>setShowPricing(true)}><div className="p-10 text-center">Comparador (Solo Premium)</div></PremiumGuard>}/>
            <Route path="/profile" element={<div className="p-10 text-center">Perfil de {user.name}</div>}/>
            <Route path="*" element={<Navigate to="/"/>}/>
          </Routes>
        </main>
        {showPricing && <PricingModal onClose={()=>setShowPricing(false)} onUpgrade={handleUpgrade} userEmail={user.email} userName={user.name}/>}
      </div>
    </div>
  );
};

const App = () => <Router><AppContent/></Router>;
export default App;
