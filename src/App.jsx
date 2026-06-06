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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentMode('public');
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-500/30 flex flex-col overflow-hidden">

      {/* ── Top Navigation ── */}
      <nav className="sticky top-0 z-50 shrink-0 h-14 flex items-center justify-between px-6 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 relative">
        {/* Subtle vertical grid lines behind nav */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 80px)' }}
        />
        {/* Accent gradient line along the bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

        {/* ── Logo — click to go home ── */}
        <button
          onClick={() => setCurrentMode('public')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity group relative z-10"
        >
          <div className="w-8 h-8 rounded bg-purple-600 flex items-center justify-center font-black text-white text-sm shadow-[0_0_15px_rgba(147,51,234,0.5)] group-hover:shadow-[0_0_22px_rgba(147,51,234,0.75)] transition-shadow">
            SF
          </div>
          <span className="text-lg font-black tracking-tight text-white">
            Server<span className="text-purple-400">Forge</span>
          </span>
        </button>

        {/* ── Nav buttons ── */}
        <div className="flex gap-2 relative z-10">
          <button
            onClick={() => setCurrentMode('public')}
            className={`px-3 py-1.5 rounded text-sm font-bold transition-all flex items-center gap-1.5 ${
              currentMode === 'public'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Globe size={13} /> Public
          </button>

          {session ? (
            <button
              onClick={() => setCurrentMode('admin')}
              className={`px-3 py-1.5 rounded text-sm font-bold transition-all flex items-center gap-1.5 ${
                currentMode === 'admin'
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ShieldAlert size={13} /> Controller
            </button>
          ) : (
            <button
              onClick={() => setCurrentMode('admin')}
              className={`px-3 py-1.5 rounded text-sm font-bold transition-all flex items-center gap-1.5 ${
                currentMode === 'admin'
                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)]'
                  : 'bg-slate-800/80 text-purple-400 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Lock size={13} /> Admin Login
            </button>
          )}

          {session && (
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded transition-colors border border-transparent hover:border-red-500/20"
            >
              Sign Out
            </button>
          )}
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="flex-1 min-h-0 overflow-hidden relative">

        {/* Public view */}
        {currentMode === 'public' && (
          <div className="h-full overflow-y-auto">
            <PublicLanding />
          </div>
        )}

        {/* Admin login gate */}
        {currentMode === 'admin' && !session && (
          <div className="h-full flex items-center justify-center relative overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(to right,#80808012 1px,transparent 1px),linear-gradient(to bottom,#80808012 1px,transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(147,51,234,0.06),transparent)]" />
            {/* Scanlines */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.025]"
              style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,white 3px,white 4px)' }}
            />

            <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md relative overflow-hidden z-10">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-600 to-blue-600" />
              <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-purple-900/10 to-transparent pointer-events-none" />

              <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                <Lock className="text-purple-400" size={22} /> Restricted Access
              </h2>
              <p className="text-slate-400 text-sm mb-6 pb-6 border-b border-slate-800">
                Please authenticate to access the ServerForge infrastructure controller.
              </p>

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                {authError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-sm">
                    {authError}
                  </div>
                )}
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Admin Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 text-slate-500" size={15} />
                    <input
                      type="email" required value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 pl-9 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="sysadmin@network.local"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Passphrase
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 text-slate-500" size={15} />
                    <input
                      type="password" required value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 pl-9 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>
                <button
                  type="submit" disabled={authLoading}
                  className="mt-2 w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white font-black py-3 rounded transition-colors flex justify-center items-center gap-2 text-sm tracking-wider"
                >
                  {authLoading
                    ? <Loader2 className="animate-spin" size={15} />
                    : 'Initialize Session'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Admin dashboard */}
        {currentMode === 'admin' && session && <AdminDashboard />}
      </main>
    </div>
  );
}

export default App;
