import React from 'react';
import type { Approval } from '../types';
import { AlertOctagon, Check, X, ShieldAlert } from 'lucide-react';

interface ApprovalsModalProps {
  approvals: Approval[];
  onResolve: (id: string, approved: boolean) => void;
}

export const ApprovalsModal: React.FC<ApprovalsModalProps> = ({ approvals, onResolve }) => {
  if (approvals.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <span>Human-in-the-Loop Sign-off Required</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {approvals.length} Pending
            </span>
          </h3>
          <p className="text-xs text-amber-200/80">
            Whop requires explicit owner confirmation for production deployments and financial operations.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {approvals.map((app) => (
          <div
            key={app.id}
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-white/5"
          >
            <div>
              <div className="flex items-center space-x-2 text-xs mb-1">
                <span className="font-bold uppercase text-amber-400">[{app.requested_by}]</span>
                <span className="text-gray-400 font-mono text-[11px]">Type: {app.action_type}</span>
              </div>
              <p className="text-sm font-medium text-gray-200">{app.summary}</p>
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto">
              <button
                onClick={() => onResolve(app.id, true)}
                className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-900/30"
              >
                <Check className="w-4 h-4" />
                <span>Approve & Execute</span>
              </button>
              <button
                onClick={() => onResolve(app.id, false)}
                className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-300 hover:text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-white/10"
              >
                <X className="w-4 h-4" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
