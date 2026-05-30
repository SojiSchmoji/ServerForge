import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Server, Users, Activity, Box, Search, Play, Crosshair } from 'lucide-react';

export default function PublicLanding() {
  const [servers, setServers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchActiveServers();
  }, []);

  const fetchActiveServers = async () => {
    const { data } = await supabase.from('server_instance').select('*').eq('active_status', true);
    if (data) setServers(data);
  };

  const filteredServers = servers.filter(s => {
    const matchesSearch = s.instance_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'All' || s.game_type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-slate-950 min-h-full">
      {/* Hero Banner */}
      <div className="relative border-b border-slate-800 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-800 via-slate-900 to-slate-950"></div>
        <div className="max-w-7xl mx-auto px-6 py-24 relative z-10 text-center">
          <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider mb-6 inline-block">
            v2.0 INFRASTRUCTURE ONLINE
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
            Enter the <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">Forge.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Discover our high-performance multiplayer networks. Zero lag. Instant routing. Built by players, for players.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden focus-within:border-purple-500 transition-colors">
              <Search className="text-slate-500 ml-4" />
              <input 
                type="text" 
                placeholder="Search for a lobby (e.g., Survival, Retakes)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-white p-4 outline-none placeholder:text-slate-500 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Filters & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div className="flex gap-2">
            {['All', 'Minecraft', 'Counter-Strike 2'].map(type => (
              <button 
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${filter === type ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
              >
                {type}
              </button>
            ))}
          </div>
          
          <div className="flex gap-6 text-sm font-bold text-slate-400">
            <div className="flex items-center gap-2"><Activity className="text-emerald-400" size={16}/> {servers.length} Active Nodes</div>
            <div className="flex items-center gap-2"><Users className="text-blue-400" size={16}/> 1,429 Players Online</div>
          </div>
        </div>

        {/* Server Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServers.map((server) => (
            <div key={server.instance_id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all hover:shadow-[0_0_30px_rgba(147,51,234,0.15)] group relative flex flex-col">
              
              {/* Game Banner Image (Simulated with gradients) */}
              <div className={`h-24 w-full relative flex items-center justify-center overflow-hidden ${server.game_type === 'Minecraft' ? 'bg-gradient-to-br from-emerald-900 to-slate-900' : 'bg-gradient-to-br from-amber-900 to-slate-900'}`}>
                 <div className="absolute inset-0 bg-black/40"></div>
                 {server.game_type === 'Minecraft' ? <Box size={40} className="text-white/20 relative z-10" /> : <Crosshair size={40} className="text-white/20 relative z-10" />}
                 <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                   {server.game_type}
                 </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-xl text-white leading-tight group-hover:text-purple-400 transition-colors">{server.instance_name}</h3>
                </div>
                
                <p className="text-sm text-slate-400 mb-6 flex-1">
                  Official high-tickrate server hosted on ultra-low latency infrastructure in {server.node_id === 1 ? 'Caloocan' : 'Quezon City'}.
                </p>

                <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-auto">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-slate-300 font-mono text-xs font-bold">PORT: {server.assigned_port}</span>
                  </div>
                  <button className="bg-slate-800 hover:bg-white hover:text-slate-900 text-white p-2 rounded-full transition-colors">
                    <Play size={16} className="ml-0.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredServers.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-500">
              <Box size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-xl font-bold">No instances found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}