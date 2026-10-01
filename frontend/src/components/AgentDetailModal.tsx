import React, { useState } from 'react';
import type { Agent, AgentLog } from '../types';
import { X, Send, CheckCircle2 } from 'lucide-react';

interface AgentDetailModalProps {
  agent: Agent | null;
  logs: AgentLog[];
  onClose: () => void;
  apiBase?: string;
}

export const AgentDetailModal: React.FC<AgentDetailModalProps> = ({ agent, logs, onClose, apiBase = 'http://localhost:8000' }) => {
  const [directPrompt, setDirectPrompt] = useState('');
  const [sending, setSending] = useState(false);
  const [sentStatus, setSentStatus] = useState<string | null>(null);

  if (!agent) return null;

  const agentLogs = logs.filter(l => l.agent_id === agent.id);

  const handleSendDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directPrompt.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`${apiBase}/api/agents/${agent.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: directPrompt.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setSentStatus(`Directive sent to ${agent.name}!`);
        setDirectPrompt('');
        setTimeout(() => setSentStatus(null), 3000);
      }
    } catch (err) {
      setSentStatus('Failed to send directive.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0e101a] p-6 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Agent Profile Header with 3D Avatar */}
        <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-white/10">
          <div className="w-20 h-20 rounded-2xl p-0.5 bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-xl overflow-hidden">
            <img 
              src={`/avatars/${agent.id}.jpg`} 
              alt={agent.name}
              className="w-full h-full object-cover rounded-[14px]"
            />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-white">{agent.name}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                {agent.status.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-400">{agent.role}</p>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[10px] uppercase text-gray-500 font-mono">LLM Router</span>
            <p className="text-xs font-semibold text-gray-200 mt-0.5 truncate">{agent.model_used || 'gemini-flash-lite:free'}</p>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[10px] uppercase text-gray-500 font-mono">Total Actions</span>
            <p className="text-xs font-semibold text-gray-200 mt-0.5">{agent.total_actions}</p>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[10px] uppercase text-gray-500 font-mono">Whop MCP Tools</span>
            <p className="text-xs font-semibold text-emerald-400 mt-0.5">Connected (2)</p>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[10px] uppercase text-gray-500 font-mono">Token Cost</span>
            <p className="text-xs font-semibold text-indigo-400 mt-0.5">$0.00 (Free Mesh)</p>
          </div>
        </div>

        {/* Send Direct Directive to this Agent */}
        <div className="mb-6">
          <form onSubmit={handleSendDirective} className="p-4 rounded-2xl bg-black/50 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <span>Direct Officer Directive</span>
              </label>
              {sentStatus && (
                <span className="text-emerald-400 text-xs flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {sentStatus}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={directPrompt}
                onChange={(e) => setDirectPrompt(e.target.value)}
                placeholder={`Give a custom task to ${agent.name}...`}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="submit"
                disabled={sending || !directPrompt.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch</span>
              </button>
            </div>
          </form>
        </div>

        {/* Recent Agent Thoughts */}
        <div>
          <h4 className="text-xs font-semibold uppercase text-gray-400 font-mono mb-2">Recent Thoughts & Logs</h4>
          <div className="max-h-40 overflow-y-auto space-y-2 pr-1 text-xs font-mono">
            {agentLogs.length === 0 ? (
              <div className="text-gray-500 text-xs py-4 text-center">No logs recorded yet for {agent.name}.</div>
            ) : (
              agentLogs.slice(-5).map(l => (
                <div key={l.id} className="p-2.5 rounded-lg bg-black/30 border border-white/5 text-gray-300">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span className="uppercase text-indigo-400">{l.log_type}</span>
                    <span>{new Date(l.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p>{l.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
