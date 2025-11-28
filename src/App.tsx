import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Search, Calendar, Briefcase, FileEdit, PenTool, MessageSquare, 
  PlusCircle, User as UserIcon, Menu, X, Scale, LogOut, Download, LifeBuoy, 
  Loader2, Zap, Lock, SplitSquareHorizontal, FolderPlus, Folder, Trash2, CheckCircle, 
  AlertCircle
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './services/supabase';
import { SubscriptionBanner } from './components/SubscriptionBanner';
import { PricingModal } from './components/PricingModal';
import { JurisprudenceCard } from './components/JurisprudenceCard';
import { generateLegalDocument, generateCaseArgument, compareCases } from './services/geminiService';
import { INITIAL_USER, MOCK_DATABASE, MOCK_POSTS, MOCK_EVENTS, MOCK_FOLDERS, MOCK_DOCUMENTS } from './constants';

const Toast = ({ message, type, onClose }: any) => (
  <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-xl text-white flex items-center z-50 ${type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
    {type === 'error' ? <AlertCircle className="mr-2"/> : <CheckCircle className="mr-2"/>}
    {message}
    <button onClick={onClose} className="ml-4"><X className="w-4 h-4"/></button>
  </div>
);

const AuthPage = ({ onLogin }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isReg, setIsReg] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    if (!isSupabaseConfigured()) {
       setTimeout(() => onLogin({ ...INITIAL_USER, email: email || 'demo@toga.co', name: 'Usuario Demo' }), 1000);
       return;
    }
    try {
      const { data, error } = isReg 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) onLogin({ ...INITIAL_USER, id: data.user.id, email: data.user.email, name: 'Usuario' });
    } catch (err: any) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="flex justify-center mb-4"><Scale className="w-12 h-12 text-indigo-600"/></div>
        <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">Toga Colombia</h2>
        {!isSupabaseConfigured() && <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4 text-sm text-center">Modo Demo (Sin Conexión)</div>}
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder="Correo" className="w-full p-3 border rounded-lg" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Contraseña" className="w-full p-3 border rounded-lg" value={password} onChange={e=>setPassword(e.target.value)} required />
          <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition-colors">
            {loading ? <Loader2 className="animate-spin mx-auto"/> : (isReg ? 'Registrarse' : 'Iniciar Sesión')}
          </button>
        </form>
        <button onClick={()=>setIsReg(!isReg)} className="mt-4 w-full text-sm text-indigo-600 hover:underline">{isReg ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}</button>
      </div>
    </div>
  );
};

const AppContent = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [toast, setToast] = useState<any>(null);
  const [db, setDb] = useState(MOCK_DATABASE);
  const [folders, setFolders] = useState<any[]>(MOCK_FOLDERS);
  const [events, setEvents] = useState<any[]>(MOCK_EVENTS);
  const [docs, setDocs] = useState<any[]>(MOCK_DOCUMENTS);
  const [posts, setPosts] = useState<any[]>(MOCK_POSTS);
  const [compareList, setCompareList] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      if(isSupabaseConfigured()) {
          const { data: { session } } = await supabase.auth.getSession();
          if(session?.user) {
            setUser({ ...INITIAL_USER, id: session.user.id, email: session.user.email });
            const c = await supabase.from('cases').select('*');
            if(c.data && c.data.length > 0) setDb(c.data);
            const f = await supabase.from('folders').select('*').eq('user_id', session.user.id);
            if(f.data) setFolders(f.data);
            const e = await supabase.from('events').select('*').eq('user_id', session.user.id);
            if(e.data) setEvents(e.data);
            const p = await supabase.from('posts').select('*');