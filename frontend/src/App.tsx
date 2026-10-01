import React, { useState, useEffect } from 'react';
import type { Agent, AgentLog, Task, Business, Approval, AgentDiscussion } from './types';
import { VirtualOffice } from './components/VirtualOffice';
import { LiveFeed } from './components/LiveFeed';
import { KanbanBoard } from './components/KanbanBoard';
import { ApprovalsModal } from './components/ApprovalsModal';
import { AgentDetailModal } from './components/AgentDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { AgentDiscussionFeed } from './components/AgentDiscussionFeed';
import { DebugInspector } from './components/DebugInspector';
import { WhopManagerModal } from './components/WhopManagerModal';
import { Rocket, Sparkles, Building2, DollarSign, Users, RefreshCw, Radio, CheckCircle, ExternalLink, Key, ShoppingBag, Zap, Bug, Activity, Terminal } from 'lucide-react';

const API_BASE = typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:8000' : '';

export function App() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [discussions, setDiscussions] = useState<AgentDiscussion[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [nicheInput, setNicheInput] = useState<string>('');
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [isAutonomous, setIsAutonomous] = useState<boolean>(true);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [wsLatency, setWsLatency] = useState<number>(18);
  const [cycleCount, setCycleCount] = useState<number>(1);
  const [nextCycleIn, setNextCycleIn] = useState<number>(60);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDebugOpen, setIsDebugOpen] = useState<boolean>(false);
  const [isWhopManagerOpen, setIsWhopManagerOpen] = useState<boolean>(false);

  // Initial Fetch & Polling Fallback
  const fetchData = async () => {
    try {
      const [agRes, lgRes, tkRes, bzRes, apRes, dcRes, atRes] = await Promise.all([
        fetch(`${API_BASE}/api/agents`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE}/api/logs`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE}/api/tasks`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE}/api/businesses`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE}/api/approvals`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE}/api/discussions`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE}/api/autonomous/status`).then(r => r.json()).catch(() => ({ is_running: true, cycle_count: 1, next_cycle_seconds: 60 }))
      ]);
      setAgents(agRes);
      setLogs(lgRes);
      setTasks(tkRes);
      setBusinesses(bzRes);
      setApprovals(apRes);
      setDiscussions(dcRes);
      if (atRes) {
        if (typeof atRes.is_running === 'boolean') setIsAutonomous(atRes.is_running);
        if (typeof atRes.cycle_count === 'number') setCycleCount(atRes.cycle_count);
        if (typeof atRes.next_cycle_seconds === 'number') setNextCycleIn(atRes.next_cycle_seconds);
      }
    } catch (e) {
      console.error('Error fetching data from API:', e);
    }
  };

  useEffect(() => {
    fetchData();

    // Countdown timer for next autonomous cycle
    const countdownTimer = setInterval(() => {
      setNextCycleIn(prev => (prev > 1 ? prev - 1 : 60));
    }, 1000);

    // WebSocket Connection
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.port === '5173' ? 'localhost:8000' : window.location.host;
      try {
        ws = new WebSocket(`${wsProtocol}//${wsHost}/ws/live`);
      } catch (err) {
        console.warn('WS instantiate error:', err);
        return;
      }

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onclose = () => {
        setWsConnected(false);
        clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(connectWs, 3000); // Reconnect
      };

      ws.onerror = () => {
        setWsConnected(false);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          // Handle server heartbeat ping
          if (msg.type === 'ping') {
            if (msg.timestamp) {
              const latency = Math.max(1, Math.round(Date.now() - msg.timestamp * 1000));
              setWsLatency(latency);
            }
            try {
              ws?.send(JSON.stringify({ type: 'pong' }));
            } catch {}
            return; // Don't trigger refetch on ping
          }

          if (msg.type === 'init') {
            setAgents(msg.data.agents || []);
            setLogs(msg.data.logs || []);
            setDiscussions(msg.data.discussions || []);
            setTasks(msg.data.tasks || []);
            setBusinesses(msg.data.businesses || []);
            setApprovals(msg.data.approvals || []);
          } else if (msg.type === 'agent_discussion') {
            setDiscussions(prev => [msg.data, ...prev]);
          } else if (msg.type === 'autonomous_status_changed') {
            setIsAutonomous(msg.data.is_running);
          } else if (msg.type === 'autonomous_cycle_completed') {
            if (msg.data?.cycle) setCycleCount(msg.data.cycle);
            setNextCycleIn(60);
            fetchData();
          } else {
            fetchData();
          }
        } catch (err) {
          console.error('WS parse error:', err);
        }
      };
    };

    connectWs();
    const interval = setInterval(fetchData, 8000); // Secondary fallback

    return () => {
      clearInterval(interval);
      clearInterval(countdownTimer);
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicheInput.trim() || isLaunching) return;

    setIsLaunching(true);
    try {
      const res = await fetch(`${API_BASE}/api/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: nicheInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setNicheInput('');
        fetchData();
      }
    } catch (err) {
      console.error('Launch error:', err);
    } finally {
      setTimeout(() => setIsLaunching(false), 2000);
    }
  };

  const handleResolveApproval = async (id: string, approved: boolean) => {
    try {
      await fetch(`${API_BASE}/api/approvals/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved })
      });
      fetchData();
    } catch (err) {
      console.error('Approval resolution error:', err);
    }
  };

  const handleToggleAutonomous = async () => {
    try {
      const next = !isAutonomous;
      setIsAutonomous(next);
      await fetch(`${API_BASE}/api/autonomous/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ running: next })
      });
    } catch (err) {
      console.error('Toggle autonomous error:', err);
    }
  };

  const handleTriggerPulse = async () => {
    try {
      await fetch(`${API_BASE}/api/autonomous/trigger`, { method: 'POST' });
      setTimeout(fetchData, 600);
    } catch (err) {
      console.error('Manual pulse trigger error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080d] text-gray-100 flex flex-col font-sans">
      {/* Top Diagnostics Status Banner */}
      <div className="bg-[#090b14] border-b border-white/5 px-4 py-1.5 text-[11px] font-mono flex flex-wrap items-center justify-between text-gray-400 gap-2">
        <div className="flex items-center space-x-3 overflow-x-auto">
          <span className="flex items-center gap-1.5 text-gray-300">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-400 animate-pulse'}`} />
            <span>{wsConnected ? `Live Gateway (${wsLatency}ms)` : 'Reconnecting Gateway...'}</span>
          </span>
          <span className="text-gray-600 hidden sm:inline">&bull;</span>
          <span className="text-indigo-400 hidden sm:inline">Whop: biz_wDSHPXqL0Ew9Jr</span>
          <span className="text-gray-600 hidden sm:inline">&bull;</span>
          <span className="text-amber-300">Pulse #{cycleCount} (in {nextCycleIn}s)</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleTriggerPulse}
            className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors cursor-pointer"
          >
            <Activity className="w-3 h-3" />
            <span>Pulse Now</span>
          </button>
          <button
            onClick={() => setIsDebugOpen(true)}
            className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors cursor-pointer"
          >
            <Bug className="w-3 h-3" />
            <span>Diagnostics</span>
          </button>
        </div>
      </div>

      {/* Top Navigation Bar */}
      <header className="border-b border-white/10 bg-[#0d0f18]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-bold text-base sm:text-lg text-white tracking-wide">WHOP AGENT ARMY</h1>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    v1.0 OS
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-400">Autonomous Business Creation & Operations Mesh</p>
              </div>
            </div>

            {/* Mobile-only diagnostics quick button */}
            <button
              onClick={() => setIsDebugOpen(true)}
              className="md:hidden p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              title="Open Diagnostics"
            >
              <Terminal className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Metrics Bar - Fully Responsive */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full md:w-auto text-xs font-mono">
            <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between sm:justify-start space-x-2">
              <div className="flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-gray-400">Stores:</span>
              </div>
              <span className="font-bold text-white">{businesses.length}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between sm:justify-start space-x-2">
              <div className="flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-gray-400">Army:</span>
              </div>
              <span className="font-bold text-white">4 Active</span>
            </div>

            <button
              onClick={handleToggleAutonomous}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl border flex items-center justify-center space-x-1.5 transition-all font-mono cursor-pointer ${
                isAutonomous
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${isAutonomous ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
              <span className="text-[11px]">{isAutonomous ? '24/7 Army: ON' : 'Army: PAUSED'}</span>
            </button>

            <button
              onClick={() => setIsWhopManagerOpen(true)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 flex items-center justify-center space-x-1.5 transition-colors font-mono cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="text-[11px]">Whop Manager</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 flex items-center justify-center space-x-1.5 transition-colors font-mono cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="text-[11px]">Keys / Config</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-6 py-6 space-y-6 flex-1">
        {/* Launchpad: Deploy an Army to a Niche */}
        <div className="relative rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 via-[#0e1120] to-purple-950/30 p-5 shadow-[0_0_35px_rgba(99,102,241,0.12)]">
          <form onSubmit={handleLaunch} className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Deploy Autonomous Creation Pipeline</h3>
                <p className="text-xs text-gray-400">
                  Enter any digital niche. Atlas (CEO), Cypher (Dev), Echo (Marketer), and Nova (Ops) will build it.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto md:min-w-[480px]">
              <input
                type="text"
                value={nicheInput}
                onChange={(e) => setNicheInput(e.target.value)}
                placeholder="e.g. AI Prompt Vault, Discord Alpha Group, Notion Freelance OS..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
              <button
                type="submit"
                disabled={isLaunching || !nicheInput.trim()}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide flex items-center gap-2 transition-all shadow-lg ${
                  isLaunching || !nicheInput.trim()
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:scale-[1.02]'
                }`}
              >
                {isLaunching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deploying...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    <span>Launch Army</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Approvals Modal (Human-in-the-Loop) */}
        <ApprovalsModal approvals={approvals} onResolve={handleResolveApproval} />

        {/* 2.5D Isometric Virtual Office Simulation Floor */}
        <VirtualOffice
          agents={agents}
          logs={logs}
          onSelectAgent={(agent) => setSelectedAgent(agent)}
        />

        {/* Created Businesses Portfolio Bar */}
        {businesses.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#0d0f18] p-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                <span>Active Whop Businesses Created by Army</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400 font-mono">
                  {businesses.length} Total
                </span>
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {businesses.map((biz) => (
                <div key={biz.id} className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                        <span>{biz.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-normal">Active</span>
                      </h4>
                      <span className="text-[11px] text-gray-500 font-mono">@{biz.handle} &bull; {biz.niche}</span>
                    </div>
                    <a
                      href={`https://whop.com/${biz.handle}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title="Open store on Whop"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-white/5 gap-2">
                    {biz.promo_code ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-pink-500/10 border border-pink-500/20 text-pink-400 font-mono">
                        Code: {biz.promo_code}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-600 font-mono">Standard Tier</span>
                    )}

                    {biz.checkout_url ? (
                      <a
                        href={biz.checkout_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono flex items-center gap-1 transition-all hover:scale-105"
                      >
                        <ShoppingBag className="w-3 h-3 text-emerald-400" />
                        <span>Live Checkout</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-gray-500 font-mono">Pricing Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 24/7 Agent Army Team Discussions */}
        <AgentDiscussionFeed discussions={discussions} />

        {/* Two-Column Operations Layout: Terminal & Kanban */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LiveFeed logs={logs} />
          <KanbanBoard tasks={tasks} />
        </div>
      </main>

      {/* Agent Detail Modal */}
      <AgentDetailModal
        agent={selectedAgent}
        logs={logs}
        onClose={() => setSelectedAgent(null)}
        apiBase={API_BASE}
      />

      {/* Settings & Credentials Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiBase={API_BASE}
      />

      {/* Realtime System Diagnostics & Live Trace Modal */}
      <DebugInspector
        isOpen={isDebugOpen}
        onClose={() => setIsDebugOpen(false)}
        wsConnected={wsConnected}
        wsLatency={wsLatency}
        isAutonomous={isAutonomous}
        cycleCount={cycleCount}
        nextCycleIn={nextCycleIn}
        logs={logs}
        businesses={businesses}
        onTriggerPulse={handleTriggerPulse}
      />

      {/* Live Whop Account Manager Modal */}
      <WhopManagerModal
        isOpen={isWhopManagerOpen}
        onClose={() => setIsWhopManagerOpen(false)}
        onDataChanged={fetchData}
      />
    </div>
  );
}

export default App;
