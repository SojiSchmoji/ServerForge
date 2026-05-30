import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Server, Users, Activity, Box } from 'lucide-react';

export default function PublicLanding() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveServers();
  }, []);

  const fetchActiveServers = async () => {
    try {
      // Fetch only active servers for the public
      const { data, error } = await supabase
        .from('server_instance')
        .select('*')
        .eq('active_status', true);
        
      if (error) throw error;
      setServers(data || []);
    } catch (error) {
      console.error("Error fetching servers:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">
          The Hub for <span className="text-purple-400">Custom Infrastructure</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Discover, play, and monitor our high-performance multiplayer networks. Built on enterprise-grade hardware with zero compromises.
        </p>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { label: 'Active Lobbies', value: servers.length, icon: <Activity className="text-purple-400" /> },
          { label: 'Total Players', value: '142', icon: <Users className="text-blue-400" /> },
          { label: 'Uptime', value: '99.9%', icon: <Server className="text-emerald-400" /> },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Modrinth Card Grid */}
      <h2 className="text-2xl font-bold text-white mb-6">Active Instances</h2>
      {loading ? (
        <div className="text-slate-400 flex justify-center py-12">Booting network...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => (
            <div key={server.instance_id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-purple-500/50 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center text-slate-300 group-hover:text-purple-400 transition-colors">
                     <Box size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white leading-tight">{server.instance_name}</h3>
                    <p className="text-sm text-slate-400">{server.game_type}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-xs font-semibold">
                  Port: {server.assigned_port}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-4 text-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                </span>
                <span className="text-slate-300 font-medium">Online & Accepting Connections</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}