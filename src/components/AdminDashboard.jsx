import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LayoutDashboard, HardDrive, Gamepad2, Shield, Puzzle, Power, Cpu, Activity, Terminal, X, Plus } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('lobbies');
  const [servers, setServers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [extensions, setExtensions] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // New Instance Form State
  const [newInstance, setNewInstance] = useState({ name: '', game: 'Minecraft', port: '', node: 1 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [serversRes, playersRes, nodesRes, extRes] = await Promise.all([
      supabase.from('server_instance').select('*').order('instance_id'),
      supabase.from('player_profile').select('*').order('player_id'),
      supabase.from('hardware_node').select('*'),
      supabase.from('instance_extension').select('*')
    ]);
    
    if (serversRes.data) setServers(serversRes.data);
    if (playersRes.data) setPlayers(playersRes.data);
    if (nodesRes.data) setNodes(nodesRes.data);
    if (extRes.data) setExtensions(extRes.data);
  };

  const toggleServerStatus = async (id, currentStatus) => {
    setLoadingId(`server-${id}`);
    await supabase.from('server_instance').update({ active_status: !currentStatus }).eq('instance_id', id);
    await fetchData(); 
    setLoadingId(null);
  };

  const toggleBanStatus = async (id, currentStatus) => {
    setLoadingId(`player-${id}`);
    const reason = !currentStatus ? `Manual network-wide ban issued.` : null;
    await supabase.from('player_profile').update({ global_ban_status: !currentStatus, ban_reason: reason }).eq('player_id', id);
    await fetchData();
    setLoadingId(null);
  };

  const handleCreateInstance = async (e) => {
    e.preventDefault();
    await supabase.from('server_instance').insert([{
      instance_name: newInstance.name,
      game_type: newInstance.game,
      assigned_port: parseInt(newInstance.port),
      active_status: false,
      node_id: newInstance.node
    }]);
    setShowModal(false);
    await fetchData();
  };

  const SidebarButton = ({ id, icon: Icon, label }) => (
    <button onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded font-medium transition-colors text-sm ${activeTab === id ? 'bg-purple-600/10 text-purple-400 border-l-2 border-purple-500' : 'text-slate-400 hover:bg-slate-800/50 border-l-2 border-transparent'}`}>
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <div className="flex h-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]">
      
      {/* Sidebar */}
      <div className="w-64 bg-slate-950/80 backdrop-blur border-r border-slate-800 p-4 flex flex-col gap-1 overflow-y-auto">
        <div className="mb-6 p-4 bg-slate-900 border border-slate-800 rounded shadow-inner flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
            <div>
                <p className="text-xs text-slate-400 font-mono">Uplink Status</p>
                <p className="text-sm font-bold text-emerald-400 font-mono">CONNECTED</p>
            </div>
        </div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 px-2 font-mono">Infrastructure</div>
        <SidebarButton id="overview" icon={LayoutDashboard} label="Network Matrix" />
        <SidebarButton id="infrastructure" icon={HardDrive} label="Hardware Nodes" />
        <SidebarButton id="lobbies" icon={Gamepad2} label="Active Instances" />
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 mb-1 px-2 font-mono">Access Control</div>
        <SidebarButton id="security" icon={Shield} label="Player Security" />
        <SidebarButton id="extensions" icon={Puzzle} label="Extension Modules" />
      </div>

      {/* Main Viewport */}
      <div className="flex-1 p-8 overflow-y-auto relative">
        
        {/* NEW INSTANCE MODAL */}
        {showModal && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-2xl w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white font-mono">Init New Instance</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
              </div>
              <form onSubmit={handleCreateInstance} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Instance Name</label>
                  <input required type="text" onChange={e => setNewInstance({...newInstance, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:border-purple-500 outline-none" placeholder="e.g. Survival SMP"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Game Engine</label>
                    <select onChange={e => setNewInstance({...newInstance, game: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none">
                      <option>Minecraft</option>
                      <option>Counter-Strike 2</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Port Mapping</label>
                    <input required type="number" onChange={e => setNewInstance({...newInstance, port: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none" placeholder="25565"/>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Target Hardware Node</label>
                  <select onChange={e => setNewInstance({...newInstance, node: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none">
                    {nodes.map(n => <option key={n.node_id} value={n.node_id}>{n.node_name} ({n.location_label})</option>)}
                  </select>
                </div>
                <button type="submit" className="mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded transition-colors">Deploy Instance</button>
              </form>
            </div>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="animate-in fade-in duration-300 max-w-6xl mx-auto">
             <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><LayoutDashboard className="text-purple-400"/> Network Matrix</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Total Deployments</p>
                  <p className="text-5xl font-black text-white">{servers.length}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Active Playerbase</p>
                  <p className="text-5xl font-black text-white">{players.length}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg border-b-4 border-b-purple-500">
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">System Health</p>
                  <p className="text-5xl font-black text-emerald-400">100%</p>
                </div>
             </div>
          </div>
        )}

        {/* HARDWARE NODES TAB */}
        {activeTab === 'infrastructure' && (
          <div className="animate-in fade-in duration-300 max-w-6xl mx-auto">
             <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><HardDrive className="text-purple-400"/> Hardware Nodes</h2>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {nodes.map(node => (
                 <div key={node.node_id} className="bg-slate-900 border border-slate-800 rounded-lg p-6 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10"><Cpu size={100}/></div>
                   <h3 className="text-xl font-bold text-white font-mono mb-1">{node.node_name}</h3>
                   <p className="text-sm text-purple-400 mb-6 flex items-center gap-2"><Activity size={14}/> {node.location_label}</p>
                   
                   <div className="space-y-4 relative z-10">
                     <div>
                       <div className="flex justify-between text-xs font-bold text-slate-400 mb-1 uppercase"><span>Memory (RAM)</span> <span>{Math.floor(node.total_ram_gb * 0.7)}GB / {node.total_ram_gb}GB</span></div>
                       <div className="w-full bg-slate-950 h-2 rounded-full"><div className="bg-purple-500 h-2 rounded-full" style={{width: '70%'}}></div></div>
                     </div>
                     <div>
                       <div className="flex justify-between text-xs font-bold text-slate-400 mb-1 uppercase"><span>Storage Allocation</span> <span>450GB / {node.storage_gb}GB</span></div>
                       <div className="w-full bg-slate-950 h-2 rounded-full"><div className="bg-blue-500 h-2 rounded-full" style={{width: '45%'}}></div></div>
                     </div>
                     <div>
                       <div className="flex justify-between text-xs font-bold text-slate-400 mb-1 uppercase"><span>CPU Threads</span> <span>{node.cpu_threads} Cores Active</span></div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* EXTENSIONS TAB */}
        {activeTab === 'extensions' && (
          <div className="animate-in fade-in duration-300 max-w-6xl mx-auto">
             <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><Puzzle className="text-purple-400"/> Extension Modules</h2>
             <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase text-slate-500 font-bold">
                    <tr>
                      <th className="px-6 py-4">Module Name</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Version</th>
                      <th className="px-6 py-4">Developer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {extensions.map(ext => (
                      <tr key={ext.extension_id} className="hover:bg-slate-800/30">
                        <td className="px-6 py-4 font-bold text-white">{ext.extension_name}</td>
                        <td className="px-6 py-4"><span className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded text-xs border border-purple-500/20">{ext.category}</span></td>
                        <td className="px-6 py-4 font-mono text-slate-400 text-sm">v{ext.version_number}</td>
                        <td className="px-6 py-4 text-slate-400 text-sm">{ext.developer}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
          </div>
        )}

        {/* LOBBIES TAB (Updated with + Button) */}
        {activeTab === 'lobbies' && (
          <div className="animate-in fade-in duration-300 max-w-6xl mx-auto">
            <div className="flex justify-between items-end mb-6 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Terminal className="text-purple-400"/> Instance Controller</h2>
                <p className="text-slate-400 text-sm mt-1">Live routing and power management for containerized game servers.</p>
              </div>
              <button onClick={() => setShowModal(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm font-bold shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all flex items-center gap-2">
                <Plus size={16}/> INIT NEW INSTANCE
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {servers.map((server) => (
                <div key={server.instance_id} className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-lg p-5 flex flex-col justify-between group hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${server.active_status ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-slate-600'}`}></span>
                        <h3 className="font-bold text-lg text-white font-mono tracking-tight">{server.instance_name}</h3>
                      </div>
                      <p className="text-xs text-slate-400 bg-slate-950 inline-block px-2 py-0.5 rounded border border-slate-800">{server.game_type}</p>
                    </div>
                    <button onClick={() => toggleServerStatus(server.instance_id, server.active_status)} disabled={loadingId === `server-${server.instance_id}`} className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold border transition-all ${server.active_status ? 'bg-slate-950 text-red-400 border-red-900 hover:bg-red-500/10' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-white'}`}>
                      {loadingId === `server-${server.instance_id}` ? 'PROCESSING...' : <><Power size={12} /> {server.active_status ? 'FORCE SHUTDOWN' : 'BOOT INSTANCE'}</>}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-slate-950 border border-slate-800 rounded p-3 mt-2">
                    <div><p className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Activity size={10}/> Port</p><p className="text-sm font-mono text-slate-300">{server.assigned_port}</p></div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Cpu size={10}/> Load</p>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden"><div className={`h-full rounded-full ${server.active_status ? 'bg-purple-500 w-[45%]' : 'bg-slate-700 w-0'}`}></div></div>
                    </div>
                    <div><p className="text-[10px] text-slate-500 uppercase font-bold">Node ID</p><p className="text-sm font-mono text-slate-300">0{server.node_id}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="animate-in fade-in duration-300 max-w-5xl mx-auto">
            <div className="mb-8 border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Shield className="text-purple-400"/> Global Ban Shield</h2>
              <p className="text-slate-400 text-sm mt-1">Triggering a ban here forcefully terminates sessions and revokes access across all child instances.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <tr><th className="px-6 py-4">Player Identity</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Audit Reason</th><th className="px-6 py-4 text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-mono text-sm">
                  {players.map((player) => (
                    <tr key={player.player_id} className={`transition-colors ${player.global_ban_status ? 'bg-red-500/5' : 'hover:bg-slate-800/30'}`}>
                      <td className="px-6 py-4"><div className={`font-bold ${player.global_ban_status ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{player.username}</div><div className="text-xs text-slate-500 font-sans">{player.email}</div></td>
                      <td className="px-6 py-4">{player.global_ban_status ? <span className="text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded text-xs font-bold font-sans">BANNED</span> : <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded text-xs font-bold font-sans">CLEAN</span>}</td>
                      <td className="px-6 py-4 text-xs text-slate-400 max-w-xs truncate">{player.ban_reason || '-'}</td>
                      <td className="px-6 py-4 text-right"><button onClick={() => toggleBanStatus(player.player_id, player.global_ban_status)} disabled={loadingId === `player-${player.player_id}`} className={`px-3 py-1.5 rounded text-xs font-bold font-sans transition-all border ${player.global_ban_status ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700' : 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border-red-500/30'}`}>{loadingId === `player-${player.player_id}` ? 'UPDATING...' : (player.global_ban_status ? 'REVOKE BAN' : 'ISSUE BAN')}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}