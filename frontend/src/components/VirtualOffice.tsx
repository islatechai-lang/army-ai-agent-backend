import React, { useState } from 'react';
import type { Agent, AgentLog } from '../types';
import { 
  Terminal, Shield, TrendingUp, Sparkles, Coffee, 
  Activity, Monitor, Server, Radio, Zap, ChevronRight,
  BarChart3, Award, Flame, Cpu, Eye
} from 'lucide-react';

interface VirtualOfficeProps {
  agents: Agent[];
  logs: AgentLog[];
  onSelectAgent: (agent: Agent) => void;
}

export const VirtualOffice: React.FC<VirtualOfficeProps> = ({ agents, logs, onSelectAgent }) => {
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);

  const getLatestThought = (agentId: string) => {
    const agentLogs = logs.filter(l => l.agent_id === agentId && l.log_type === 'thought');
    if (agentLogs.length > 0) {
      const msg = agentLogs[agentLogs.length - 1].message;
      return msg.length > 95 ? msg.substring(0, 95) + '...' : msg;
    }
    return 'Scanning Whop market metrics & awaiting next directive...';
  };

  const getAgentStationConfig = (agentId: string) => {
    switch (agentId) {
      case 'ceo':
        return {
          roomName: 'EXECUTIVE STRATEGY SUITE',
          accent: '#a855f7',
          border: 'border-purple-500/30 hover:border-purple-500/70',
          bg: 'bg-gradient-to-br from-purple-950/30 via-[#0f111e] to-black/60',
          glow: 'hover:shadow-[0_0_35px_rgba(168,85,247,0.25)]',
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          icon: <Sparkles className="w-5 h-5 text-purple-400" />,
          avatarBg: 'bg-gradient-to-tr from-purple-600 to-indigo-500',
          screenContent: '📈 Niche Growth Index: 94.2%',
          decorIcon: <Award className="w-4 h-4 text-purple-400" />
        };
      case 'dev':
        return {
          roomName: 'ENGINEERING & ELEMENTS LAB',
          accent: '#10b981',
          border: 'border-emerald-500/30 hover:border-emerald-500/70',
          bg: 'bg-gradient-to-br from-emerald-950/30 via-[#0f111e] to-black/60',
          glow: 'hover:shadow-[0_0_35px_rgba(16,185,129,0.25)]',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <Terminal className="w-5 h-5 text-emerald-400" />,
          avatarBg: 'bg-gradient-to-tr from-emerald-600 to-teal-500',
          screenContent: '⚡ whop apps deploy: READY',
          decorIcon: <Server className="w-4 h-4 text-emerald-400" />
        };
      case 'marketer':
        return {
          roomName: 'GROWTH & REVENUE STUDIO',
          accent: '#f59e0b',
          border: 'border-amber-500/30 hover:border-amber-500/70',
          bg: 'bg-gradient-to-br from-amber-950/30 via-[#0f111e] to-black/60',
          glow: 'hover:shadow-[0_0_35px_rgba(245,158,11,0.25)]',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <TrendingUp className="w-5 h-5 text-amber-400" />,
          avatarBg: 'bg-gradient-to-tr from-amber-600 to-orange-500',
          screenContent: '🎯 Meta Ads CTR: 4.8% (Targeting)',
          decorIcon: <Flame className="w-4 h-4 text-amber-400" />
        };
      case 'ops':
        return {
          roomName: 'OPERATIONS & RISK WAR ROOM',
          accent: '#f43f5e',
          border: 'border-rose-500/30 hover:border-rose-500/70',
          bg: 'bg-gradient-to-br from-rose-950/30 via-[#0f111e] to-black/60',
          glow: 'hover:shadow-[0_0_35px_rgba(244,63,94,0.25)]',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: <Shield className="w-5 h-5 text-rose-400" />,
          avatarBg: 'bg-gradient-to-tr from-rose-600 to-pink-500',
          screenContent: '🛡️ Dispute Rate: 0.0% (Clean)',
          decorIcon: <Radio className="w-4 h-4 text-rose-400" />
        };
      default:
        return {
          roomName: 'MISSION CONTROL',
          accent: '#6366f1',
          border: 'border-indigo-500/30 hover:border-indigo-500/70',
          bg: 'bg-gradient-to-br from-indigo-950/30 via-[#0f111e] to-black/60',
          glow: 'hover:shadow-[0_0_35px_rgba(99,102,241,0.25)]',
          badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          icon: <Cpu className="w-5 h-5 text-indigo-400" />,
          avatarBg: 'bg-gradient-to-tr from-indigo-600 to-blue-500',
          screenContent: 'Systems Nominal',
          decorIcon: <Monitor className="w-4 h-4 text-indigo-400" />
        };
    }
  };

  return (
    <div className="relative w-full rounded-3xl border border-white/10 bg-[#090b14] p-6 shadow-2xl overflow-hidden">
      {/* Top Architectural Ceiling & Status */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between pb-6 mb-6 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <span>VIRTUAL COMPANY HEADQUARTERS</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                FLOOR 01 • LIVE
              </span>
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Visual workspace of your 4 autonomous officers running digital businesses in parallel.
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center space-x-3 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 flex items-center space-x-2">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-gray-400">Mesh State:</span>
            <span className="text-emerald-400 font-bold">100% Operational</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 flex items-center space-x-2">
            <Coffee className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-gray-400">Coffee Bar:</span>
            <span className="text-white font-bold">Stocked</span>
          </div>
        </div>
      </div>

      {/* 2.5D Isometric Floor Grid Layout */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agents.map((agent) => {
          const config = getAgentStationConfig(agent.id);
          const latestThought = getLatestThought(agent.id);
          const isThinking = agent.status === 'thinking';
          const isWorking = agent.status === 'working';

          return (
            <div
              key={agent.id}
              onClick={() => onSelectAgent(agent)}
              onMouseEnter={() => setHoveredAgentId(agent.id)}
              onMouseLeave={() => setHoveredAgentId(null)}
              className={`group relative rounded-2xl border p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${config.border} ${config.bg} ${config.glow}`}
            >
              {/* Room Header Strip */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5 text-[11px] font-mono">
                <span className="text-gray-400 flex items-center gap-1.5 tracking-wider">
                  {config.decorIcon}
                  <span>{config.roomName}</span>
                </span>
                <span className={`px-2 py-0.5 rounded-md border font-semibold flex items-center gap-1 ${
                  isWorking ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                  isThinking ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  'bg-white/5 text-gray-400 border-white/10'
                }`}>
                  {isWorking && <Activity className="w-3 h-3 animate-spin text-emerald-400" />}
                  {isThinking && <Activity className="w-3 h-3 animate-pulse text-amber-400" />}
                  {agent.status.toUpperCase()}
                </span>
              </div>

              {/* Desk & Avatar Visual Stage */}
              <div className="relative rounded-xl bg-black/40 border border-white/5 p-4 mb-4 overflow-hidden">
                {/* Visual Desk Hardware & Monitors */}
                <div className="flex items-start justify-between gap-4">
                  {/* Avatar Sprite representation with 3D Image */}
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      {/* Character Avatar Image */}
                      <div className={`w-16 h-16 rounded-2xl ${config.avatarBg} p-0.5 shadow-2xl overflow-hidden transform transition-transform group-hover:scale-105 border border-white/20`}>
                        <img 
                          src={`/avatars/${agent.id}.jpg`} 
                          alt={agent.name}
                          className="w-full h-full object-cover rounded-[14px]"
                          onError={(e) => {
                            // Fallback to text initials if image not loaded
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      {/* Status dot */}
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#090b14] flex items-center justify-center text-[8px] text-white">
                        ✓
                      </span>
                    </div>

                    <span className="mt-2 text-xs font-bold text-white tracking-wide">{agent.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{agent.role.split('/')[0]}</span>
                  </div>

                  {/* Workstation Monitors & Thought Bubble */}
                  <div className="flex-1 space-y-2.5">
                    {/* Active Speech / Thought Bubble */}
                    <div className="relative bg-[#131626] border border-white/10 rounded-xl p-3 shadow-lg">
                      <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase font-mono mb-1">
                        <span className="flex items-center gap-1 text-indigo-400">
                          <Eye className="w-3 h-3" /> Live Agent Thought
                        </span>
                        <span className="text-gray-500">Model: {agent.model_used || 'free mesh'}</span>
                      </div>
                      <p className="text-xs text-gray-200 leading-relaxed italic line-clamp-2">
                        "{latestThought}"
                      </p>
                    </div>

                    {/* Virtual Monitor Screen Graphic */}
                    <div className="px-3 py-2 rounded-lg bg-black/60 border border-emerald-500/20 font-mono text-[11px] text-emerald-400 flex items-center justify-between">
                      <div className="flex items-center space-x-2 truncate">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="truncate">{config.screenContent}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 ml-2">Whop MCP</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Station Footer / Metrics Bar */}
              <div className="flex items-center justify-between pt-1 text-xs font-mono text-gray-400">
                <div className="flex items-center space-x-3 text-[11px]">
                  <span>Tasks: <strong className="text-white">{agent.total_actions}</strong></span>
                  <span>•</span>
                  <span>Whop Scopes: <strong className="text-emerald-400">Admin Grant</strong></span>
                </div>
                <div className="flex items-center text-indigo-400 group-hover:translate-x-1 transition-transform text-xs font-semibold">
                  <span>Inspect Desk</span>
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Breakroom / Lounge Center Strip */}
      <div className="relative z-10 mt-6 pt-5 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-gray-400 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
          <span className="text-gray-300">
            Autonomous Pipeline Ready • Connects to <strong className="text-white">Whop Docs MCP</strong> and <strong className="text-white">Whop API MCP</strong>
          </span>
        </div>
        <div className="flex items-center space-x-4 font-mono text-xs">
          <span className="px-2.5 py-1 rounded-md bg-white/5 text-gray-400 border border-white/5">
            Failover Mode: Enabled
          </span>
          <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Token Cost: $0.00
          </span>
        </div>
      </div>
    </div>
  );
};
