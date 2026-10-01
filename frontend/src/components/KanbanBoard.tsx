import React from 'react';
import type { Task } from '../types';
import { CheckCircle2, Clock, AlertCircle, Sparkles } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks }) => {
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0f18] p-5">
      <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          <span>Active Operations Board</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
            {tasks.length} Total
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* In Progress Column */}
        <div className="rounded-xl bg-black/20 border border-white/5 p-3.5">
          <div className="flex items-center justify-between mb-3 text-xs font-medium text-amber-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>In Progress ({inProgressTasks.length})</span>
            </span>
          </div>

          <div className="space-y-2.5">
            {inProgressTasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500">
                All tasks completed. Ready for new mission.
              </div>
            ) : (
              inProgressTasks.map(t => (
                <div key={t.id} className="p-3 rounded-lg bg-[#141724] border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="uppercase font-bold text-indigo-400">@{t.assigned_to}</span>
                    <span className="text-[10px] text-gray-500">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <h4 className="text-xs font-medium text-gray-200">{t.title}</h4>
                  {t.description && (
                    <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{t.description}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Column */}
        <div className="rounded-xl bg-black/20 border border-white/5 p-3.5">
          <div className="flex items-center justify-between mb-3 text-xs font-medium text-emerald-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed Milestones ({completedTasks.length})</span>
            </span>
          </div>

          <div className="space-y-2.5">
            {completedTasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500">
                Milestones will appear here once executed.
              </div>
            ) : (
              completedTasks.map(t => (
                <div key={t.id} className="p-3 rounded-lg bg-[#141724] border border-white/5 opacity-80">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="uppercase font-bold text-gray-400">@{t.assigned_to}</span>
                    <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </span>
                  </div>
                  <h4 className="text-xs font-medium text-gray-300 line-through">{t.title}</h4>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
