import React, { useState } from 'react';
import type { AgentLog } from '../types';
import { Terminal, Filter, Code2, AlertTriangle, CheckCircle2, MessageSquare } from 'lucide-react';

interface LiveFeedProps {
  logs: AgentLog[];
}

export const LiveFeed: React.FC<LiveFeedProps> = ({ logs }) => {
  const [filterAgent, setFilterAgent] = useState<string>('all');

  const filteredLogs = logs.filter(l => filterAgent === 'all' || l.agent_id === filterAgent);

  const getLogBadge = (logType: string) => {
    switch (logType) {
      case 'thought':
        return <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1"><MessageSquare className="w-2.5 h-2.5" /> THOUGHT</span>;
      case 'tool_call':
        return <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1"><Code2 className="w-2.5 h-2.5" /> TOOL</span>;
      case 'tool_result':
        return <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> RESULT</span>;
      case 'milestone':
        return <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> MILESTONE</span>;
      case 'error':
        return <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> ERROR</span>;
      default:
        return <span className="text-[10px] px-2 py-0.5 rounded bg-gray-500/10 text-gray-400 border border-gray-500/20">{logType}</span>;
    }
  };

  const getAgentColor = (agentId: string) => {
    switch (agentId) {
      case 'ceo': return 'text-purple-400';
      case 'dev': return 'text-emerald-400';
      case 'marketer': return 'text-amber-400';
      case 'ops': return 'text-rose-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0f18] p-5 flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-white text-sm">Live Agent Thought & MCP Stream</h3>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 text-xs">
          {['all', 'ceo', 'dev', 'marketer', 'ops'].map((ag) => (
            <button
              key={ag}
              onClick={() => setFilterAgent(ag)}
              className={`px-2 py-1 rounded-md text-[11px] capitalize transition-colors ${
                filterAgent === ag
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {ag === 'all' ? 'All Agents' : ag}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Logs Container */}
      <div className="flex-1 overflow-y-auto space-y-2.5 font-mono text-xs pr-2">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs">
            <Terminal className="w-8 h-8 mb-2 opacity-30" />
            <span>No activity logs yet. Trigger a launch or task above.</span>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-lg bg-black/40 border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5 text-[11px]">
                <div className="flex items-center space-x-2">
                  <span className={`font-bold uppercase tracking-wider ${getAgentColor(log.agent_id)}`}>
                    [{log.agent_id}]
                  </span>
                  {getLogBadge(log.log_type)}
                </div>
                <span className="text-gray-500 text-[10px]">
                  {new Date(log.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-gray-300 leading-relaxed break-words whitespace-pre-wrap">
                {log.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
