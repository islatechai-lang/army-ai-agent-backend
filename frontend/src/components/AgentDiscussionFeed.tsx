import React from 'react';
import type { AgentDiscussion } from '../types';
import { MessageSquare, ArrowRight, Bot, Sparkles } from 'lucide-react';

interface Props {
  discussions: AgentDiscussion[];
}

const AGENT_META: Record<string, { name: string; avatar: string; color: string; badgeBg: string }> = {
  ceo: { name: 'Atlas', avatar: '/avatars/ceo.jpg', color: 'text-amber-400', badgeBg: 'bg-amber-500/10 border-amber-500/30' },
  dev: { name: 'Cypher', avatar: '/avatars/dev.jpg', color: 'text-indigo-400', badgeBg: 'bg-indigo-500/10 border-indigo-500/30' },
  marketer: { name: 'Echo', avatar: '/avatars/marketer.jpg', color: 'text-pink-400', badgeBg: 'bg-pink-500/10 border-pink-500/30' },
  ops: { name: 'Nova', avatar: '/avatars/ops.jpg', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 border-emerald-500/30' },
  team: { name: 'Team', avatar: '/avatars/ceo.jpg', color: 'text-purple-400', badgeBg: 'bg-purple-500/10 border-purple-500/30' }
};

export const AgentDiscussionFeed: React.FC<Props> = ({ discussions }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0f18] p-5 flex flex-col h-[380px]">
      <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span>Autonomous Agent Team Discussions</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            24/7 Active
          </span>
        </h3>
        <span className="text-xs text-gray-500 font-mono">
          {discussions.length} dialogues
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-white/10">
        {discussions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
            <Bot className="w-8 h-8 mb-2 opacity-40 text-indigo-400" />
            <p className="text-xs">Agents are analyzing market signals and preparing the next collaborative plan...</p>
          </div>
        ) : (
          discussions.map((d) => {
            const sender = AGENT_META[d.sender_id] || AGENT_META.ceo;
            const recipient = AGENT_META[d.recipient_id] || AGENT_META.team;

            return (
              <div key={d.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={sender.avatar}
                      alt={sender.name}
                      className="w-5 h-5 rounded-full object-cover border border-white/20"
                    />
                    <span className={`text-xs font-bold ${sender.color}`}>{sender.name}</span>
                    <ArrowRight className="w-3 h-3 text-gray-600" />
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md border ${recipient.badgeBg} ${recipient.color}`}>
                      @{recipient.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed pl-7">
                  {d.message}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
