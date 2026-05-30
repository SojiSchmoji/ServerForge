import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LayoutDashboard, HardDrive, Gamepad2, Shield, Puzzle, Power } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('lobbies');
  const [servers, setServers] = useState([]);
  const [players, setPlayers] = useState([]);
  
  useEffect(() => {
    if (activeTab === 'lobbies') fetchServers();
    if (activeTab === 'security') fetchPlayers();
  }, [activeTab]);

  const fetchServers = async () => {
    const { data } = await supabase.from('server_instance').select('*');
    if (data) setServers(data);
  };

  const fetchPlayers = async () => {
    const { data } = await supabase.from('player_profile').select('*');
    if (data) setPlayers(data);
  };

  // Example CRUD Update: Toggling Server Status
  const toggleServerStatus = async (id, currentStatus) => {
    const { error } = await supabase
      .from('server_instance')
      .update({ active_status: !currentStatus })
      .eq('instance_id', id);
    if (!error) fetchServers(); // Refresh UI
  };

  // Example CRUD Update: Unified Global Ban Shield
  const toggleBanStatus = async (id, currentStatus, username) => {
    const reason = !currentStatus ? `Manual network-wide ban issued by Admin_Soji` : null;
    const { error } = await supabase
      .from('player_profile')
      .update({ global_ban_status: !currentStatus, ban_reason: reason })
      .eq('player_id', id);
    if (!error) fetchPlayers();
  };

  const SidebarButton = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
        activeTab === id 
        ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <Icon size={18} /> {label}
    </button>
  );

  return (
    <div className="flex h-full">
      {/* Left Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-2">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Core Systems</div>
        <SidebarButton id="overview" icon={LayoutDashboard} label="Overview matrix" />
        <SidebarButton id="infrastructure" icon={HardDrive} label="Infrastructure" />
        <SidebarButton id="lobbies" icon={Gamepad2} label="Lobbies (Instances)" />
        
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-6 mb-2 px-2">Access & Content</div>
        <SidebarButton id="security" icon={Shield} label="Player Security" />
        <SidebarButton id="extensions" icon={Puzzle} label="Extension Hub" />
      </div>

      {/* Main Admin Viewport */}
      <div className="flex-1 p-8 overflow-y-auto">
        
        {/* LOBBIES VIEW */}
        {activeTab === 'lobbies' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Server Instances</h2>
              <button className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-medium shadow-lg transition-colors">
                + Deploy New Instance
              </button>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-800/50 border-b border-slate-800 text-slate-400 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium">Instance Name</th>
                    <th className="px-6 py-4 font-medium">Game Type</th>
                    <th className="px-6 py-4 font-medium">Port</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {servers.map((server) => (
                    <tr key={server.instance_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{server.instance_name}</td>
                      <td className="px-6 py-4 text-slate-300">{server.game_type}</td>
                      <td className="px-6 py-4"><span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-sm">{server.assigned_port}</span></td>
                      <td className="px-6 py-4">
                        {server.active_status ? (
                          <span className="text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full text-xs font-bold border border-purple-500/20">ONLINE</span>
                        ) : (
                          <span className="text-slate-500 bg-slate-800 px-3 py-1 rounded-full text-xs font-bold border border-slate-700">OFFLINE</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => toggleServerStatus(server.instance_id, server.active_status)}
                          className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Toggle Power"
                        >
                          <Power size={18} className={server.active_status ? 'text-purple-400' : ''} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECURITY VIEW */}
        {activeTab === 'security' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-white mb-2">Unified Global Ban Shield</h2>
            <p className="text-slate-400 mb-6">Manage network-wide access. Banning a player immediately revokes access across all child instances.</p>
            
            <div className="grid grid-cols-1 gap-4">
              {players.map((player) => (
                <div key={player.player_id} className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex items-center justify-between">
                  <div>
                    <h3 className={`font-bold text-lg ${player.global_ban_status ? 'text-red-400 line-through' : 'text-white'}`}>
                      {player.username}
                    </h3>
                    <p className="text-sm text-slate-400">{player.email}</p>
                    {player.global_ban_status && (
                      <p className="text-xs text-red-400/80 mt-1 flex items-center gap-1">
                        <Shield size={12} /> Reason: {player.ban_reason}
                      </p>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => toggleBanStatus(player.player_id, player.global_ban_status, player.username)}
                    className={`px-4 py-2 rounded font-bold text-sm transition-colors border ${
                      player.global_ban_status 
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700' 
                      : 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border-red-500/20'
                    }`}
                  >
                    {player.global_ban_status ? 'LIFT BAN' : 'BAN NETWORK-WIDE'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INFRASTRUCTURE STUB (To demonstrate layout) */}
        {activeTab === 'infrastructure' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-white mb-6">Hardware Nodes</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex justify-between items-end mb-2">
                <h3 className="font-bold text-white text-lg">Node-Alpha-SFF</h3>
                <span className="text-purple-400 font-medium">28GB / 32GB RAM</span>
              </div>
              {/* Live Resource Allocator Gauge Concept */}
              <div className="w-full bg-slate-800 rounded-full h-3 mb-4 overflow-hidden">
                <div className="bg-purple-500 h-3 rounded-full" style={{ width: '87%' }}></div>
              </div>
              <p className="text-sm text-slate-400 text-right">Warning: Insufficient capacity for new deployments.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}