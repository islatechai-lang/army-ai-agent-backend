import React, { useState, useEffect } from 'react';
import type { Agent, AgentLog, Task, Business, Approval } from './types';
import { VirtualOffice } from './components/VirtualOffice';
import { LiveFeed } from './components/LiveFeed';
import { KanbanBoard } from './components/KanbanBoard';
import { ApprovalsModal } from './components/ApprovalsModal';
import { AgentDetailModal } from './components/AgentDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { Rocket, Sparkles, Building2, DollarSign, Users, RefreshCw, Radio, CheckCircle, ExternalLink, Key } from 'lucide-react';

const API_BASE = typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:8000' : '';

export function App() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [nicheInput, setNicheInput] = useState<string>('');
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Initial Fetch & Polling Fallback
  const fetchData = async () => {
    try {
      const [agRes, lgRes, tkRes, bzRes, apRes] = await Promise.all([
        fetch(`${API_BASE}/api/agents`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE}/api/logs`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE}/api/tasks`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE}/api/businesses`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE}/api/approvals`).then(r => r.json()).catch(() => [])
      ]);
      setAgents(agRes);
      setLogs(lgRes);
      setTasks(tkRes);
      setBusinesses(bzRes);
      setApprovals(apRes);
    } catch (e) {
      console.error('Error fetching data from API:', e);
    }
  };

  useEffect(() => {
    fetchData();

    // WebSocket Connection
    let ws: WebSocket | null = null;
    const connectWs = () => {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.port === '5173' ? 'localhost:8000' : window.location.host;
      ws = new WebSocket(`${wsProtocol}//${wsHost}/ws/live`);
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connectWs, 3000); // Reconnect
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'init') {
            setAgents(msg.data.agents || []);
            setLogs(msg.data.logs || []);
            setTasks(msg.data.tasks || []);
            setBusinesses(msg.data.businesses || []);
            setApprovals(msg.data.approvals || []);
          } else {
            fetchData();
          }
        } catch (err) {
          console.error('WS parse error:', err);
        }
      };
    };

    connectWs();
    const interval = setInterval(fetchData, 4000); // Polling safeguard

    return () => {
      clearInterval(interval);
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

  return (
    <div className="min-h-screen bg-[#07080d] text-gray-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-white/10 bg-[#0d0f18]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-lg text-white tracking-wide">WHOP AGENT ARMY</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  v1.0 OS
                </span>
              </div>
              <p className="text-xs text-gray-400">Autonomous Business Creation & Operations Mesh</p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center space-x-4 text-xs font-mono">
            <div className="px-3.5 py-1.5 rounded-xl bg-black/40 border border-white/5 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400">Businesses:</span>
              <span className="font-bold text-white">{businesses.length}</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-black/40 border border-white/5 flex items-center space-x-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-gray-400">Army:</span>
              <span className="font-bold text-white">4 Specialized</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-black/40 border border-white/5 flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span className="text-gray-400">Token Cost:</span>
              <span className="font-bold text-emerald-400">$0.00 (Free Mesh)</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-gray-400 pl-2">
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span>{wsConnected ? 'Live' : 'Polling'}</span>
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1.5 transition-colors font-mono cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Keys / Config</span>
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
                <div key={biz.id} className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span>{biz.name}</span>
                      <span className="text-[10px] text-emerald-400 font-normal">Active</span>
                    </h4>
                    <span className="text-[11px] text-gray-500 font-mono">@{biz.handle} &bull; {biz.niche}</span>
                  </div>
                  <a
                    href={`https://whop.com/${biz.handle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

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
    </div>
  );
}

export default App;
