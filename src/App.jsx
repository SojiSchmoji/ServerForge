import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { ShieldAlert, Globe, Lock, User, Loader2 } from 'lucide-react';
import PublicLanding from './components/PublicLanding';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [currentMode, setCurrentMode] = useState('public'); 
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Check for existing login sessions on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setAuthError(error.message);
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentMode('public');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-500/30 flex flex-col">
      {/* Top Persistent Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 h-16 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-purple-600 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]">
            SF
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Server<span className="text-purple-400">Forge</span></span>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => setCurrentMode('public')}
            className={`px-4 py-2 rounded text-sm font-medium transition-all flex items-center gap-2 ${currentMode === 'public' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Globe size={16} /> Public View
          </button>
          
          {session ? (
            <button 
              onClick={() => setCurrentMode('admin')}
              className={`px-4 py-2 rounded text-sm font-medium transition-all flex items-center gap-2 ${currentMode === 'admin' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-white'}`}
            >
              <ShieldAlert size={16} /> Controller
            </button>
          ) : (
             <button 
              onClick={() => setCurrentMode('admin')}
              className={`px-4 py-2 rounded text-sm font-medium transition-all flex items-center gap-2 ${currentMode === 'admin' ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.3)]' : 'bg-slate-800 text-purple-400 hover:bg-slate-700'}`}
            >
              <Lock size={16} /> Admin Login
            </button>
          )}

          {session && (
            <button onClick={handleLogout} className="px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded transition-colors border border-transparent hover:border-red-500/20">
              Sign Out
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {currentMode === 'public' && <div className="h-full overflow-y-auto"><PublicLanding /></div>}
        
        {currentMode === 'admin' && !session && (
          <div className="h-full flex items-center justify-center bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-blue-600"></div>
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><Lock className="text-purple-400"/> Restricted Access</h2>
              <p className="text-slate-400 text-sm mb-6 pb-6 border-b border-slate-800">Please authenticate to access the ServerForge infrastructure controller.</p>
              
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                {authError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-sm">{authError}</div>}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Admin Email</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 text-slate-500" size={18} />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 pl-10 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="sysadmin@network.local" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Passphrase</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 text-slate-500" size={18} />
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 pl-10 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="••••••••••••" />
                  </div>
                </div>
                <button type="submit" disabled={authLoading} className="mt-4 w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white font-bold py-3 rounded transition-colors flex justify-center items-center gap-2">
                  {authLoading ? <Loader2 className="animate-spin" size={18}/> : 'Initialize Session'}
                </button>
              </form>
            </div>
          </div>
        )}

        {currentMode === 'admin' && session && <AdminDashboard />}
      </main>
    </div>
  );
}

export default App;