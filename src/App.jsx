import React, { useState } from 'react';
import { ShieldAlert, Globe } from 'lucide-react';
import PublicLanding from './components/PublicLanding';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [currentMode, setCurrentMode] = useState('public'); // 'public' | 'admin'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-500/30">
      {/* Top Persistent Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]">
            SF
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Server<span className="text-purple-400">Forge</span></span>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => setCurrentMode('public')}
            className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${currentMode === 'public' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <Globe size={18} /> Public View
          </button>
          <button 
            onClick={() => setCurrentMode('admin')}
            className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${currentMode === 'admin' ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.3)]' : 'bg-slate-800 text-purple-400 hover:bg-slate-700'}`}
          >
            <ShieldAlert size={18} /> Admin Login
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="w-full h-[calc(100vh-4rem)] overflow-y-auto">
        {currentMode === 'public' ? <PublicLanding /> : <AdminDashboard />}
      </main>
    </div>
  );
}

export default App;