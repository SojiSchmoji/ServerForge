import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import {
  Box, Search, Users, Activity, Crosshair, ChevronRight,
  X, Wifi, Puzzle, Info, Zap, Shield, Signal, Copy, Check,
  Play, Globe,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const NODE_INFO = {
  1: { label: 'Caloocan, NCR',    subnet: '10.0.1' },
  2: { label: 'Quezon City, NCR', subnet: '10.0.2' },
};

const GAME_DESCRIPTIONS = {
  'Minecraft': [
    'High-performance Paper 1.21.4 server running on our Caloocan node. Enjoy vanilla+ gameplay with EssentialsX, CoreProtect land protection, and McMMO skill progression. JVM flags are tuned for 60+ concurrent players with minimal GC pauses.',
    'Purpur-based survival SMP with anti-cheat via NoCheatPlus and economy powered by Vault + EssentialsX. Features automated daily backups, custom world generation, and a monthly event calendar.',
  ],
  'Counter-Strike 2': [
    '128-tick competitive CS2 server running SourceMod + MetaMod:Source. Rank management via Get5, player statistics via HLStatsX, and a dedicated PUG bot for automated match setup.',
    'Retakes-mode CS2 server with round-based bomb defusal scenarios. Uses the RetakesPlugin with a custom map pool and automated AFK detection to keep rounds tight.',
  ],
};

const MAX_PLAYERS = { 'Minecraft': 50, 'Counter-Strike 2': 32 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Deterministic "random" player count keyed to instance id. */
const simPlayerCount = (id, max) => {
  const v = Math.abs(Math.sin(id * 127.1 + 3.5) * 43758.5453);
  return Math.max(1, Math.floor((v - Math.floor(v)) * (max - 1)));
};

const getServerAddress = (server) => {
  const info = NODE_INFO[server.node_id] ?? NODE_INFO[1];
  const host  = ((server.instance_id * 17 + server.assigned_port) % 200) + 10;
  return `${info.subnet}.${host}:${server.assigned_port}`;
};

const getNodeLabel = (nodeId) => NODE_INFO[nodeId]?.label ?? 'Philippines';

const getDescription = (server) => {
  const pool = GAME_DESCRIPTIONS[server.game_type] ?? GAME_DESCRIPTIONS['Minecraft'];
  return pool[server.instance_id % pool.length];
};

// ─── Background Layer ─────────────────────────────────────────────────────────

const PageBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    {/* Fine grid */}
    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          'linear-gradient(to right,rgba(255,255,255,0.035) 1px,transparent 1px),' +
          'linear-gradient(to bottom,rgba(255,255,255,0.035) 1px,transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    />
    {/* Purple bloom — top centre */}
    <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-purple-900/25 blur-[120px]" />
    {/* Blue bloom — bottom right */}
    <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-900/20 blur-[100px]" />
    {/* Teal accent — bottom left */}
    <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full bg-teal-900/15 blur-[90px]" />
    {/* CRT scanlines */}
    <div
      className="absolute inset-0 opacity-[0.025]"
      style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,white 3px,white 4px)' }}
    />
  </div>
);

// ─── Server Detail Panel ──────────────────────────────────────────────────────

function ServerDetailPanel({ server, extensions, onClose }) {
  const [mounted,  setMounted]  = useState(false);
  const [copied,   setCopied]   = useState(false);

  /* Slide-in on mount */
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  /* Close on Escape */
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const address    = getServerAddress(server);
  const max        = MAX_PLAYERS[server.game_type] ?? 32;
  const count      = simPlayerCount(server.instance_id, max);
  const pct        = Math.round((count / max) * 100);
  const description = getDescription(server);
  const serverExts = extensions.filter((e) => e.instance_id === server.instance_id);

  const handleCopy = () => {
    navigator.clipboard.writeText(address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isMinecraft = server.game_type === 'Minecraft';
  const tps         = isMinecraft ? '20 TPS' : '128-tick';

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Dimmed backdrop */}
      <div
        className={`flex-1 transition-opacity duration-300 bg-black/65 backdrop-blur-sm cursor-pointer ${mounted ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        className={`
          w-full max-w-md bg-slate-950 border-l border-slate-800
          flex flex-col overflow-y-auto shadow-2xl
          transform transition-transform duration-300 ease-out
          ${mounted ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* ── Banner ── */}
        <div className={`relative h-44 flex-shrink-0 flex items-end ${
          isMinecraft
            ? 'bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950'
            : 'bg-gradient-to-br from-amber-900 via-orange-950 to-slate-950'
        }`}>
          {/* Pattern overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'linear-gradient(to right,rgba(255,255,255,0.04) 1px,transparent 1px),' +
                'linear-gradient(to bottom,rgba(255,255,255,0.04) 1px,transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          <div className="absolute inset-0 bg-black/35" />

          {/* Big game icon */}
          {isMinecraft
            ? <Box    size={90} className="absolute inset-0 m-auto text-white/5" />
            : <Crosshair size={90} className="absolute inset-0 m-auto text-white/5" />}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur border border-slate-700 text-slate-400 hover:text-white p-2 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>

          {/* Bottom info */}
          <div className="relative z-10 p-4 w-full bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
            <div className="flex items-end justify-between">
              <div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                  isMinecraft
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                }`}>
                  {server.game_type}
                </span>
                <h2 className="text-xl font-black text-white mt-1 leading-tight">{server.instance_name}</h2>
              </div>
              <div className="flex items-center gap-1.5 pb-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-emerald-400 text-xs font-black uppercase tracking-wider">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 p-5 space-y-5">

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Users,  val: `${count}/${max}`, sub: 'Players',  color: 'text-blue-400'   },
              { icon: Signal, val: tps,                sub: 'Tick rate', color: 'text-purple-400' },
              { icon: Zap,    val: '<5 ms',            sub: 'Avg ping',  color: 'text-emerald-400'},
            ].map(({ icon: Icon, val, sub, color }) => (
              <div key={sub} className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
                <Icon size={14} className={`${color} mx-auto mb-1`} />
                <div className="text-base font-black text-white leading-none">{val}</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold mt-0.5">{sub}</div>
              </div>
            ))}
          </div>

          {/* Player capacity bar */}
          <div>
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase mb-1.5">
              <span className="flex items-center gap-1"><Users size={9}/> Capacity</span>
              <span className="text-slate-300">{count} / {max} ({pct}%)</span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Info size={10} /> Server Description
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {description}{' '}
              Hosted on{' '}
              <span className="text-purple-400 font-bold">{getNodeLabel(server.node_id)}</span>{' '}
              infrastructure.
            </p>
          </div>

          {/* IP address */}
          <div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Wifi size={10} /> Connection Details
            </h3>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Server Address</p>
                <p className="font-mono text-white font-bold text-sm tracking-wider">{address}</p>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white rounded text-[11px] font-black transition-all border border-slate-700 hover:border-purple-500 uppercase tracking-wide"
              >
                {copied ? <><Check size={11}/> Copied!</> : <><Copy size={11}/> Copy</>}
              </button>
            </div>
          </div>

          {/* Required mods / extensions */}
          <div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Puzzle size={10} /> Required Mods &amp; Plugins
            </h3>
            {serverExts.length > 0 ? (
              <div className="space-y-2">
                {serverExts.map((ext) => (
                  <div key={ext.extension_id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{ext.extension_name}</p>
                      <p className="text-[10px] text-slate-500">{ext.developer} · v{ext.version_number}</p>
                    </div>
                    <span className="text-[10px] font-black bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded uppercase tracking-wide shrink-0">
                      {ext.category}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
                <Shield size={18} className="text-emerald-400 mx-auto mb-1.5" />
                <p className="text-sm font-bold text-slate-300">No client-side mods required</p>
                <p className="text-[11px] text-slate-600 mt-0.5">Connect using the standard {server.game_type} client</p>
              </div>
            )}
          </div>

          {/* Node info */}
          <div className="flex items-center gap-2 text-[11px] text-slate-600 border-t border-slate-800 pt-4">
            <Globe size={11} />
            <span>Node hosted in <span className="text-slate-400 font-bold">{getNodeLabel(server.node_id)}</span></span>
            <span className="ml-auto font-mono">PORT :{server.assigned_port}</span>
          </div>

          {/* CTA */}
          <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black py-3.5 rounded-lg transition-all shadow-[0_0_20px_rgba(147,51,234,0.25)] hover:shadow-[0_0_30px_rgba(147,51,234,0.45)] flex items-center justify-center gap-2 text-sm uppercase tracking-widest">
            <Play size={14} className="fill-current" /> Connect Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Server Card ──────────────────────────────────────────────────────────────

function ServerCard({ server, extensions, onClick }) {
  const isMinecraft = server.game_type === 'Minecraft';
  const max   = MAX_PLAYERS[server.game_type] ?? 32;
  const count = simPlayerCount(server.instance_id, max);
  const pct   = Math.round((count / max) * 100);

  return (
    <div
      onClick={onClick}
      className="
        bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden
        hover:border-purple-500/50 transition-all duration-200
        hover:shadow-[0_0_28px_rgba(147,51,234,0.18)]
        group relative flex flex-col cursor-pointer
      "
    >
      {/* ── Banner ── */}
      <div className={`relative h-24 flex items-center justify-center overflow-hidden ${
        isMinecraft
          ? 'bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950'
          : 'bg-gradient-to-br from-amber-900 via-orange-950 to-slate-950'
      }`}>
        {/* Fine grid overlay */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(to right,rgba(255,255,255,0.04) 1px,transparent 1px),' +
              'linear-gradient(to bottom,rgba(255,255,255,0.04) 1px,transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />
        <div className="absolute inset-0 bg-black/30" />

        {/* Big icon — zooms on hover */}
        {isMinecraft
          ? <Box      size={48} className="text-white/10 relative z-10 group-hover:scale-110 transition-transform duration-300" />
          : <Crosshair size={48} className="text-white/10 relative z-10 group-hover:scale-110 transition-transform duration-300" />}

        {/* Game-type badge */}
        <span className={`absolute top-2 left-2 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${
          isMinecraft
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        }`}>
          {server.game_type}
        </span>

        {/* Player count badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-950/80 backdrop-blur px-1.5 py-0.5 rounded text-[10px] font-black text-white border border-white/5">
          <Users size={9} className="text-blue-400" />
          {count}<span className="text-slate-500">/{max}</span>
        </div>

        {/* Hover "open" indicator */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20">
          <div className="bg-white text-slate-900 rounded-full p-1.5 shadow-lg">
            <ChevronRight size={14} />
          </div>
        </div>
      </div>

      {/* ── Info ── */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        {/* Title — purple on hover */}
        <h3 className="font-black text-sm text-white group-hover:text-purple-400 transition-colors leading-tight">
          {server.instance_name}
        </h3>

        {/* Location */}
        <p className="text-[11px] text-slate-500 flex items-center gap-1">
          <Globe size={10} /> {getNodeLabel(server.node_id)}
        </p>

        {/* Capacity bar */}
        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-auto">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-slate-500 font-mono text-[10px] font-bold">:{server.assigned_port}</span>
          </div>
          <span className="text-[10px] font-black text-slate-600 group-hover:text-purple-400 flex items-center gap-0.5 transition-colors">
            View Details <ChevronRight size={9} />
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Public Landing ───────────────────────────────────────────────────────────

export default function PublicLanding() {
  const [servers,        setServers]        = useState([]);
  const [extensions,     setExtensions]     = useState([]);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [filter,         setFilter]         = useState('All');
  const [selectedServer, setSelectedServer] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const [sRes, eRes] = await Promise.all([
        supabase.from('server_instance').select('*').eq('active_status', true),
        supabase.from('instance_extension').select('*'),
      ]);
      if (sRes.data) setServers(sRes.data);
      if (eRes.data) setExtensions(eRes.data);
    };
    fetchData();
  }, []);

  const filtered = servers.filter((s) => {
    const matchSearch = s.instance_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filter === 'All' || s.game_type === filter;
    return matchSearch && matchFilter;
  });

  const handleClose = useCallback(() => setSelectedServer(null), []);

  return (
    <div className="bg-slate-950 min-h-full relative">
      <PageBackground />

      {/* ── Hero ── */}
      <div className="relative border-b border-slate-800/60 overflow-hidden">
        {/* Hero bg layers */}
        <div className="absolute inset-0 bg-slate-900" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right,rgba(255,255,255,0.04) 1px,transparent 1px),' +
              'linear-gradient(to bottom,rgba(255,255,255,0.04) 1px,transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* Radial purple bloom */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_70%_90%_at_50%_-10%,rgba(147,51,234,0.28),transparent)]" />
        {/* Blue corner accent */}
        <div className="absolute bottom-0 left-0 w-1/3 h-2/3 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.12),transparent)]" />
        {/* Scanlines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,white 3px,white 4px)' }}
        />
        {/* Right edge accent line */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-purple-500/20 to-transparent" />

        <div className="max-w-[1600px] w-full mx-auto px-6 py-10 relative z-10">
          <div className="max-w-3xl mx-auto text-center">

            {/* Badge */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-purple-500/30" />
              <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-4 py-1 rounded-full text-[10px] font-black tracking-[0.18em] uppercase">
                v2.0 Infrastructure Online
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-purple-500/30" />
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tighter leading-none">
              Enter the{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-blue-500">
                Forge.
              </span>
            </h1>
            <p className="text-sm text-slate-400 max-w-lg mx-auto mb-7">
              Discover high-performance multiplayer networks. Zero lag. Instant routing. Built by players, for players.
            </p>

            {/* Search + filters in one row */}
            <div className="flex gap-2 items-stretch">
              {/* Search */}
              <div className="relative flex-1 group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition duration-300" />
                <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden focus-within:border-purple-500 transition-colors">
                  <Search className="text-slate-500 ml-3 shrink-0" size={15} />
                  <input
                    type="text"
                    placeholder="Search lobbies (Survival, Retakes…)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-white px-3 py-2.5 outline-none placeholder:text-slate-600 text-sm"
                  />
                </div>
              </div>

              {/* Filter pills */}
              {['All', 'Minecraft', 'Counter-Strike 2'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 py-2 rounded-lg font-black text-xs whitespace-nowrap transition-all ${
                    filter === type
                      ? 'bg-white text-slate-900'
                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats ticker */}
        <div className="border-t border-slate-800/60 bg-slate-950/60 backdrop-blur-sm">
          <div className="max-w-[1600px] w-full mx-auto px-6 py-2 flex items-center gap-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              {servers.length} Active Nodes
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={11} className="text-blue-400" /> 1,429 Players Online
            </div>
            <div className="flex items-center gap-1.5">
              <Zap size={11} className="text-purple-400" /> All Systems Nominal
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <Activity size={11} className="text-emerald-400" /> Live
            </div>
          </div>
        </div>
      </div>

      {/* ── Server Grid ── */}
      <div className="max-w-[1600px] w-full mx-auto px-6 py-5 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filtered.map((server) => (
            <ServerCard
              key={server.instance_id}
              server={server}
              extensions={extensions}
              onClick={() => setSelectedServer(server)}
            />
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-600">
              <Box size={40} className="mx-auto mb-3 opacity-20" />
              <p className="text-lg font-black text-slate-500">No instances found.</p>
              <p className="text-sm text-slate-600 mt-1">Try adjusting your search or filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Panel ── */}
      {selectedServer && (
        <ServerDetailPanel
          server={selectedServer}
          extensions={extensions}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
