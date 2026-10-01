import React, { useState } from 'react';
import type { AgentLog, Business } from '../types';
import { Terminal, Activity, Wifi, ShieldCheck, Play, RefreshCw, Copy, Check, X, AlertTriangle, Bug } from 'lucide-react';

interface DebugInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  wsConnected: boolean;
  wsLatency: number;
  isAutonomous: boolean;
  cycleCount: number;
  nextCycleIn: number;
  logs: AgentLog[];
  businesses: Business[];
  onTriggerPulse: () => Promise<void>;
}

export const DebugInspector: React.FC<DebugInspectorProps> = ({
  isOpen,
  onClose,
  wsConnected,
  wsLatency,
  isAutonomous,
  cycleCount,
  nextCycleIn,
  logs,
  businesses,
  onTriggerPulse,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPulsing, setIsPulsing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePulse = async () => {
    setIsPulsing(true);
    try {
      await onTriggerPulse();
    } finally {
      setTimeout(() => setIsPulsing(false), 1200);
    }
  };

  const handleCopyBundle = () => {
    const bundle = {
      timestamp: new Date().toISOString(),
      websocket: {
        connected: wsConnected,
        latency_ms: wsLatency,
      },
      autonomous_loop: {
        running: isAutonomous,
        current_cycle: cycleCount,
        next_cycle_in_seconds: nextCycleIn,
      },
      whop_commerce: {
        account_id: 'biz_wDSHPXqL0Ew9Jr',
        total_businesses: businesses.length,
        products: businesses.map(b => ({
          name: b.name,
          product_id: b.whop_product_id,
          checkout_url: b.checkout_url,
          promo_code: b.promo_code,
        })),
      },
      recent_logs: logs.slice(0, 30),
    };

    navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter(log => {
    if (filterType !== 'all' && log.log_type !== filterType) return false;
    if (filterAgent !== 'all' && log.agent_id !== filterAgent) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0c0e17] border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#090b12]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <span>System Diagnostics & Live Trace</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Realtime
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-mono">Whop Agent Army OS • Production Diagnostics Console</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyBundle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs border border-white/10 transition-colors cursor-pointer"
              title="Copy Full Diagnostic JSON Bundle"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Debug Bundle'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Status Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-black/40 border-b border-white/5 text-xs">
          
          {/* WebSocket Status */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Wifi className={`w-3.5 h-3.5 ${wsConnected ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}`} />
              Live WebSocket
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className={`font-bold font-mono ${wsConnected ? 'text-emerald-300' : 'text-rose-300'}`}>
                {wsConnected ? 'CONNECTED' : 'RECONNECTING'}
              </span>
              <span className="text-[11px] text-gray-500 font-mono">{wsLatency}ms</span>
            </div>
          </div>

          {/* Whop Auth Status */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between">
            <span className="text-gray-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Whop Account
            </span>
            <div className="mt-2">
              <span className="font-bold text-gray-200 font-mono text-[11px] block truncate">biz_wDSHPXqL0Ew9Jr</span>
              <span className="text-[10px] text-emerald-400">Authenticated (Prod)</span>
            </div>
          </div>

          {/* Autonomous Heartbeat */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              Army Heartbeat
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-bold text-indigo-300 font-mono">Cycle #{cycleCount}</span>
              <span className="text-[11px] text-amber-300 font-mono">in {nextCycleIn}s</span>
            </div>
          </div>

          {/* Manual Pulse Trigger */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between">
            <span className="text-gray-400">Force Action</span>
            <button
              onClick={handlePulse}
              disabled={isPulsing}
              className="mt-2 w-full py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {isPulsing ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Pulsing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Trigger Pulse</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 bg-[#0a0c14] border-b border-white/5 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-gray-400 text-[11px] mr-1">Level:</span>
            {['all', 'milestone', 'tool_result', 'thought', 'error'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono capitalize transition-colors cursor-pointer ${
                  filterType === t
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-gray-300 font-mono focus:outline-none focus:border-cyan-500/50"
            >
              <option value="all">All Agents</option>
              <option value="ceo">CEO (Atlas)</option>
              <option value="dev">Dev (Cypher)</option>
              <option value="marketer">Marketer (Echo)</option>
              <option value="ops">Ops (Nova)</option>
            </select>

            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 sm:w-44 bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-gray-300 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        {/* Live Trace Stream Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs bg-[#07080e]">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bug className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No matching system trace events found</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const badgeColors: Record<string, string> = {
                milestone: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                tool_result: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                thought: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                error: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
                info: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
              };

              const agentColors: Record<string, string> = {
                ceo: 'text-amber-400',
                dev: 'text-cyan-400',
                marketer: 'text-pink-400',
                ops: 'text-emerald-400',
                system: 'text-gray-400',
              };

              const timeStr = log.created_at
                ? new Date(log.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : '--:--:--';

              return (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row items-start sm:items-baseline gap-2 sm:gap-3 p-2.5 rounded-lg bg-black/40 border border-white/[0.04] hover:border-cyan-500/20 transition-colors"
                >
                  <span className="text-gray-500 text-[10px] shrink-0">{timeStr}</span>
                  <span className={`font-bold uppercase text-[11px] shrink-0 ${agentColors[log.agent_id] || 'text-gray-300'}`}>
                    [{log.agent_id}]
                  </span>
                  <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border shrink-0 ${badgeColors[log.log_type] || badgeColors.info}`}>
                    {log.log_type}
                  </span>
                  <span className="text-gray-300 break-all leading-relaxed flex-1">
                    {log.message}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-[#090b12] flex items-center justify-between text-xs text-gray-400 font-mono">
          <span>Showing {filteredLogs.length} of {logs.length} trace items</span>
          <span className="text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Live Event Stream
          </span>
        </div>

      </div>
    </div>
  );
};
