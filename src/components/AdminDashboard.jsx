import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  LayoutDashboard, HardDrive, Gamepad2, Shield, Puzzle,
  Power, Cpu, Activity, Terminal, X, Plus, Box, Crosshair,
  Zap, Users, TrendingUp,
} from 'lucide-react';

// ─── Resource model ───────────────────────────────────────────────────────────
// How much each game type consumes on a hardware node when active.

const GAME_RES = {
  'Minecraft':       { ram_gb: 3,   cpu: 4,  storage_gb: 25 },
  'Counter-Strike 2':{ ram_gb: 2,   cpu: 2,  storage_gb: 15 },
  _default:          { ram_gb: 1.5, cpu: 2,  storage_gb: 10 },
};

// OS / base overhead always present on a live node
const BASE = { ram_gb: 2, cpu: 2, storage_gb: 50 };

function computeNodeStats(node, servers) {
  const all    = servers.filter((s) => s.node_id === node.node_id);
  const active = all.filter((s) => s.active_status);

  const ramUsed = BASE.ram_gb + active.reduce((acc, s) => {
    return acc + (GAME_RES[s.game_type]?.ram_gb ?? GAME_RES._default.ram_gb);
  }, 0);
  const cpuUsed = BASE.cpu + active.reduce((acc, s) => {
    return acc + (GAME_RES[s.game_type]?.cpu ?? GAME_RES._default.cpu);
  }, 0);
  // Storage counts all installed instances (active or not — files remain on disk)
  const storageUsed = BASE.storage_gb + all.reduce((acc, s) => {
    return acc + (GAME_RES[s.game_type]?.storage_gb ?? GAME_RES._default.storage_gb);
  }, 0);

  const ramPct     = Math.min(100, (ramUsed / node.total_ram_gb) * 100);
  const cpuPct     = Math.min(100, (cpuUsed / node.cpu_threads)  * 100);
  const storagePct = Math.min(100, (storageUsed / node.storage_gb) * 100);

  return { all, active, ramUsed, cpuUsed, storageUsed, ramPct, cpuPct, storagePct };
}

// Colour helpers
function barColor(pct) {
  if (pct > 80) return 'bg-red-500';
  if (pct > 55) return 'bg-amber-500';
  return 'bg-purple-500';
}
function borderClass(pct) {
  if (pct > 80) return 'border-red-500/40 shadow-[0_0_18px_rgba(239,68,68,0.12)]';
  if (pct > 55) return 'border-amber-500/40 shadow-[0_0_18px_rgba(245,158,11,0.10)]';
  return 'border-slate-800 hover:border-slate-700';
}
function statusDotClass(pct) {
  if (pct > 80) return 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]';
  if (pct > 55) return 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]';
  return 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]';
}

// ─── Panel background ─────────────────────────────────────────────────────────

function DashBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(to right,rgba(255,255,255,0.025) 1px,transparent 1px),' +
            'linear-gradient(to bottom,rgba(255,255,255,0.025) 1px,transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_80%_20%,rgba(147,51,234,0.05),transparent)]" />
    </div>
  );
}

// ─── Sidebar button ───────────────────────────────────────────────────────────

function SidebarButton({ id, icon: Icon, label, activeTab, onClick }) {
  const isActive = activeTab === id;
  return (
    <button
      onClick={() => onClick(id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded font-bold text-sm transition-all border-l-2 ${
        isActive
          ? 'bg-purple-600/10 text-purple-400 border-purple-500'
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-transparent'
      }`}
    >
      <Icon size={15} /> {label}
    </button>
  );
}

// ─── Resource bar row ─────────────────────────────────────────────────────────

function ResourceBar({ label, used, total, pct, unit = '' }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase mb-1.5">
        <span>{label}</span>
        <span className={pct > 80 ? 'text-red-400' : pct > 55 ? 'text-amber-400' : 'text-slate-300'}>
          {typeof used === 'number' ? used.toFixed(1) : used}{unit} / {total}{unit}
        </span>
      </div>
      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── AdminDashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [activeTab,   setActiveTab]   = useState('lobbies');
  const [servers,     setServers]     = useState([]);
  const [players,     setPlayers]     = useState([]);
  const [nodes,       setNodes]       = useState([]);
  const [extensions,  setExtensions]  = useState([]);
  const [loadingId,   setLoadingId]   = useState(null);
  const [showModal,   setShowModal]   = useState(false);
  const [newInstance, setNewInstance] = useState({ name: '', game: 'Minecraft', port: '', node: 1 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [sRes, pRes, nRes, eRes] = await Promise.all([
      supabase.from('server_instance').select('*').order('instance_id'),
      supabase.from('player_profile').select('*').order('player_id'),
      supabase.from('hardware_node').select('*'),
      supabase.from('instance_extension').select('*'),
    ]);
    if (sRes.data) setServers(sRes.data);
    if (pRes.data) setPlayers(pRes.data);
    if (nRes.data) setNodes(nRes.data);
    if (eRes.data) setExtensions(eRes.data);
  };

  const toggleServerStatus = async (id, current) => {
    setLoadingId(`server-${id}`);
    await supabase.from('server_instance').update({ active_status: !current }).eq('instance_id', id);
    await fetchData();
    setLoadingId(null);
  };

  const toggleBanStatus = async (id, current) => {
    setLoadingId(`player-${id}`);
    const reason = !current ? 'Manual network-wide ban issued.' : null;
    await supabase.from('player_profile')
      .update({ global_ban_status: !current, ban_reason: reason })
      .eq('player_id', id);
    await fetchData();
    setLoadingId(null);
  };

  const handleCreateInstance = async (e) => {
    e.preventDefault();
    await supabase.from('server_instance').insert([{
      instance_name: newInstance.name,
      game_type:     newInstance.game,
      assigned_port: parseInt(newInstance.port),
      active_status: false,
      node_id:       newInstance.node,
    }]);
    setShowModal(false);
    await fetchData();
  };

  const activeCount = servers.filter((s) => s.active_status).length;

  return (
    <div className="flex h-full relative">
      <DashBackground />

      {/* ── Sidebar ── */}
      <div className="w-56 bg-slate-950/90 backdrop-blur border-r border-slate-800 p-3 flex flex-col gap-1 overflow-y-auto relative z-10 shrink-0">
        {/* Uplink badge */}
        <div className="mb-4 p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
          <div>
            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Uplink</p>
            <p className="text-xs font-black text-emerald-400 font-mono">CONNECTED</p>
          </div>
        </div>

        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1 px-2 font-mono">Infrastructure</p>
        {[
          { id: 'overview',       icon: LayoutDashboard, label: 'Network Matrix' },
          { id: 'infrastructure', icon: HardDrive,        label: 'Hardware Nodes' },
          { id: 'lobbies',        icon: Gamepad2,         label: 'Active Instances' },
        ].map((btn) => (
          <SidebarButton key={btn.id} {...btn} activeTab={activeTab} onClick={setActiveTab} />
        ))}

        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mt-5 mb-1 px-2 font-mono">Access Control</p>
        {[
          { id: 'security',   icon: Shield, label: 'Player Security' },
          { id: 'extensions', icon: Puzzle, label: 'Extension Modules' },
        ].map((btn) => (
          <SidebarButton key={btn.id} {...btn} activeTab={activeTab} onClick={setActiveTab} />
        ))}

        {/* Quick-stat counters at the bottom */}
        <div className="mt-auto pt-4 border-t border-slate-800 space-y-2">
          <div className="flex justify-between text-[10px] font-mono text-slate-600">
            <span>Active</span>
            <span className="text-emerald-400 font-black">{activeCount}/{servers.length}</span>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-600">
            <span>Players</span>
            <span className="text-blue-400 font-black">{players.length}</span>
          </div>
        </div>
      </div>

      {/* ── Main viewport ── */}
      <div className="flex-1 p-6 overflow-y-auto relative z-10">

        {/* ── NEW INSTANCE MODAL ── */}
        {showModal && (
          <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-600 to-blue-600" />
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-black text-white font-mono">Init New Instance</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateInstance} className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Instance Name</label>
                  <input
                    required type="text"
                    onChange={(e) => setNewInstance({ ...newInstance, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white text-sm focus:border-purple-500 outline-none transition-colors"
                    placeholder="e.g. Survival SMP"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Game Engine</label>
                    <select
                      onChange={(e) => setNewInstance({ ...newInstance, game: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white text-sm outline-none focus:border-purple-500 transition-colors"
                    >
                      <option>Minecraft</option>
                      <option>Counter-Strike 2</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Port Mapping</label>
                    <input
                      required type="number"
                      onChange={(e) => setNewInstance({ ...newInstance, port: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white text-sm outline-none focus:border-purple-500 transition-colors"
                      placeholder="25565"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Target Hardware Node</label>
                  <select
                    onChange={(e) => setNewInstance({ ...newInstance, node: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white text-sm outline-none focus:border-purple-500 transition-colors"
                  >
                    {nodes.map((n) => (
                      <option key={n.node_id} value={n.node_id}>
                        {n.node_name} ({n.location_label})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="mt-2 bg-purple-600 hover:bg-purple-500 text-white font-black py-2.5 rounded transition-colors text-sm tracking-wider"
                >
                  Deploy Instance
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="animate-in fade-in duration-300 max-w-[1600px] w-full mx-auto">
            <h2 className="text-xl font-black text-white mb-5 flex items-center gap-2">
              <LayoutDashboard className="text-purple-400" size={20} /> Network Matrix
            </h2>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Deployments',  val: servers.length,          color: 'text-white',       sub: 'instances registered' },
                { label: 'Active Nodes',        val: activeCount,             color: 'text-emerald-400', sub: 'currently running' },
                { label: 'Active Playerbase',   val: players.length,          color: 'text-blue-400',    sub: 'registered players' },
                { label: 'System Health',       val: '100%',                  color: 'text-emerald-400', sub: 'all nodes nominal', border: 'border-b-2 border-b-purple-500' },
              ].map(({ label, val, color, sub, border }) => (
                <div key={label} className={`bg-slate-900 border border-slate-800 p-5 rounded-xl ${border ?? ''}`}>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">{label}</p>
                  <p className={`text-4xl font-black ${color}`}>{val}</p>
                  <p className="text-[10px] text-slate-600 mt-1">{sub}</p>
                </div>
              ))}
            </div>

            {/* Per-node summary */}
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <HardDrive size={11} /> Node Status Summary
            </h3>
            <div className="space-y-3">
              {nodes.map((node) => {
                const stats = computeNodeStats(node, servers);
                return (
                  <div key={node.node_id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${statusDotClass(stats.ramPct)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white">{node.node_name}</p>
                      <p className="text-[10px] text-slate-500">{node.location_label}</p>
                    </div>
                    <div className="flex items-center gap-6 text-[10px] font-black text-slate-400">
                      <span><span className={stats.active.length > 0 ? 'text-emerald-400' : 'text-slate-600'}>{stats.active.length}</span> active / {stats.all.length} total</span>
                      <span>RAM <span className={barColor(stats.ramPct) === 'bg-red-500' ? 'text-red-400' : barColor(stats.ramPct) === 'bg-amber-500' ? 'text-amber-400' : 'text-purple-400'}>{stats.ramPct.toFixed(0)}%</span></span>
                      <span>CPU <span className={barColor(stats.cpuPct) === 'bg-red-500' ? 'text-red-400' : barColor(stats.cpuPct) === 'bg-amber-500' ? 'text-amber-400' : 'text-purple-400'}>{stats.cpuPct.toFixed(0)}%</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── HARDWARE NODES TAB ── */}
        {activeTab === 'infrastructure' && (
          <div className="animate-in fade-in duration-300 max-w-[1600px] w-full mx-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <HardDrive className="text-purple-400" size={20} /> Hardware Nodes
              </h2>
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                Resources update live with instance state
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {nodes.map((node) => {
                const stats = computeNodeStats(node, servers);
                return (
                  <div
                    key={node.node_id}
                    className={`bg-slate-900 border rounded-xl p-5 relative overflow-hidden transition-all duration-500 ${borderClass(stats.ramPct)}`}
                  >
                    {/* Big faded CPU icon */}
                    <div className="absolute top-0 right-0 p-5 opacity-[0.06] pointer-events-none">
                      <Cpu size={110} />
                    </div>

                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${statusDotClass(stats.ramPct)}`} />
                          <h3 className="text-base font-black text-white font-mono">{node.node_name}</h3>
                        </div>
                        <p className="text-xs text-purple-400 flex items-center gap-1 ml-4">
                          <Activity size={11} /> {node.location_label}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Active</p>
                        <p className="text-lg font-black text-white">
                          {stats.active.length}
                          <span className="text-slate-600 text-sm font-bold">/{stats.all.length}</span>
                        </p>
                      </div>
                    </div>

                    {/* Resource bars */}
                    <div className="space-y-3 relative z-10 mb-4">
                      <ResourceBar
                        label="Memory (RAM)"
                        used={stats.ramUsed}
                        total={node.total_ram_gb}
                        pct={stats.ramPct}
                        unit="GB"
                      />
                      <ResourceBar
                        label="CPU Threads"
                        used={stats.cpuUsed}
                        total={node.cpu_threads}
                        pct={stats.cpuPct}
                      />
                      <ResourceBar
                        label="Storage"
                        used={Math.round(stats.storageUsed)}
                        total={node.storage_gb}
                        pct={stats.storagePct}
                        unit="GB"
                      />
                    </div>

                    {/* Instance list on this node */}
                    {stats.all.length > 0 && (
                      <div className="border-t border-slate-800 pt-3 space-y-1.5">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2">
                          Deployed Instances
                        </p>
                        {stats.all.map((s) => (
                          <div
                            key={s.instance_id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                              s.active_status
                                ? 'bg-emerald-500/5 border border-emerald-500/15'
                                : 'bg-slate-950/50 border border-slate-800/50'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                s.active_status
                                  ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.7)]'
                                  : 'bg-slate-700'
                              }`}
                            />
                            {/* Game icon */}
                            {s.game_type === 'Minecraft'
                              ? <Box size={11} className={s.active_status ? 'text-emerald-400' : 'text-slate-600'} />
                              : <Crosshair size={11} className={s.active_status ? 'text-amber-400' : 'text-slate-600'} />}
                            <span className={`flex-1 font-bold truncate ${s.active_status ? 'text-slate-200' : 'text-slate-600'}`}>
                              {s.instance_name}
                            </span>
                            <span className="font-mono text-slate-600 shrink-0">:{s.assigned_port}</span>
                            <span className={`shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                              s.active_status
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-slate-800 text-slate-600 border-slate-700'
                            }`}>
                              {s.active_status ? 'RUNNING' : 'STOPPED'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {stats.all.length === 0 && (
                      <div className="border-t border-slate-800 pt-3 text-center text-slate-700 text-xs py-4">
                        No instances deployed to this node.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── LOBBIES / INSTANCES TAB ── */}
        {activeTab === 'lobbies' && (
          <div className="animate-in fade-in duration-300 max-w-[1600px] w-full mx-auto">
            <div className="flex justify-between items-end mb-5 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Terminal className="text-purple-400" size={20} /> Instance Controller
                </h2>
                <p className="text-slate-500 text-xs mt-1">Live routing and power management for containerized game servers.</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-xs font-black shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] transition-all flex items-center gap-1.5 uppercase tracking-widest"
              >
                <Plus size={14} /> Init New Instance
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {servers.map((server) => {
                const isLoading = loadingId === `server-${server.instance_id}`;
                return (
                  <div
                    key={server.instance_id}
                    className={`bg-slate-900/80 backdrop-blur border rounded-xl p-5 flex flex-col justify-between transition-all duration-300 ${
                      server.active_status
                        ? 'border-slate-700 shadow-[0_0_20px_rgba(16,185,129,0.06)]'
                        : 'border-slate-800'
                    }`}
                  >
                    {/* Top row */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`w-2 h-2 rounded-full transition-all duration-500 ${
                              server.active_status
                                ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                                : 'bg-slate-700'
                            }`}
                          />
                          <h3 className="font-black text-base text-white font-mono tracking-tight">{server.instance_name}</h3>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {server.game_type}
                          </span>
                          <span className="text-[10px] text-slate-600 font-mono">node-0{server.node_id}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleServerStatus(server.instance_id, server.active_status)}
                        disabled={isLoading}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black border transition-all uppercase tracking-wider ${
                          server.active_status
                            ? 'bg-slate-950 text-red-400 border-red-900 hover:bg-red-500/10'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-white'
                        }`}
                      >
                        {isLoading
                          ? 'Processing…'
                          : <><Power size={11} /> {server.active_status ? 'Shutdown' : 'Boot'}</>}
                      </button>
                    </div>

                    {/* Stats strip */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-950 border border-slate-900 rounded-lg p-3">
                      <div>
                        <p className="text-[9px] text-slate-600 uppercase font-black flex items-center gap-0.5 mb-1">
                          <Activity size={9} /> Port
                        </p>
                        <p className="text-sm font-mono text-slate-300">{server.assigned_port}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-600 uppercase font-black flex items-center gap-0.5 mb-1">
                          <Cpu size={9} /> Load
                        </p>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${server.active_status ? 'bg-purple-500 w-[45%]' : 'bg-slate-700 w-0'}`}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-600 uppercase font-black mb-1">Node ID</p>
                        <p className="text-sm font-mono text-slate-300">0{server.node_id}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SECURITY TAB ── */}
        {activeTab === 'security' && (
          <div className="animate-in fade-in duration-300 max-w-[1600px] w-full mx-auto">
            <div className="mb-5 border-b border-slate-800 pb-4">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Shield className="text-purple-400" size={20} /> Global Ban Shield
              </h2>
              <p className="text-slate-500 text-xs mt-1">
                Triggering a ban forcefully terminates sessions and revokes access across all instances.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                  <tr>
                    <th className="px-5 py-3.5">Player Identity</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Audit Reason</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-mono text-sm">
                  {players.map((player) => (
                    <tr
                      key={player.player_id}
                      className={`transition-colors ${player.global_ban_status ? 'bg-red-500/5' : 'hover:bg-slate-800/30'}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className={`font-black ${player.global_ban_status ? 'text-slate-600 line-through' : 'text-slate-200'}`}>
                          {player.username}
                        </div>
                        <div className="text-[11px] text-slate-600 font-sans">{player.email}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        {player.global_ban_status
                          ? <span className="text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-black font-sans uppercase">Banned</span>
                          : <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-black font-sans uppercase">Clean</span>}
                      </td>
                      <td className="px-5 py-3.5 text-[11px] text-slate-500 max-w-[180px] truncate">{player.ban_reason || '—'}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => toggleBanStatus(player.player_id, player.global_ban_status)}
                          disabled={loadingId === `player-${player.player_id}`}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-black font-sans transition-all border uppercase tracking-wider ${
                            player.global_ban_status
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                              : 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border-red-500/30'
                          }`}
                        >
                          {loadingId === `player-${player.player_id}` ? 'Updating…' : (player.global_ban_status ? 'Revoke Ban' : 'Issue Ban')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── EXTENSIONS TAB ── */}
        {activeTab === 'extensions' && (
          <div className="animate-in fade-in duration-300 max-w-[1600px] w-full mx-auto">
            <h2 className="text-xl font-black text-white mb-5 flex items-center gap-2">
              <Puzzle className="text-purple-400" size={20} /> Extension Modules
            </h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                  <tr>
                    <th className="px-5 py-3.5">Module Name</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Version</th>
                    <th className="px-5 py-3.5">Developer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {extensions.map((ext) => (
                    <tr key={ext.extension_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5 font-black text-white text-sm">{ext.extension_name}</td>
                      <td className="px-5 py-3.5">
                        <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                          {ext.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-400 text-xs">v{ext.version_number}</td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">{ext.developer}</td>
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
