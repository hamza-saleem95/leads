import React from 'react';
import { LeadStatus, EmailStatus } from '../../types/index.js';
import { CheckCircle2, AlertCircle, Clock, XCircle, HelpCircle } from 'lucide-react';

interface StatusPillProps {
  status: LeadStatus | EmailStatus | string;
  type?: 'lead' | 'email';
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, type = 'lead' }) => {
  if (type === 'email') {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </span>
        );
      case 'INVALID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" />
            Invalid
          </span>
        );
      case 'UNVERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            Unverified
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <HelpCircle className="w-3 h-3" />
            Unknown
          </span>
        );
    }
  }

  // Lead Status
  switch (status) {
    case 'NEW':
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30">
          New
        </span>
      );
    case 'REVIEWED':
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
          Reviewed
        </span>
      );
    case 'QUALIFIED':
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          Qualified
        </span>
      );
    case 'CONTACTED':
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
          Contacted
        </span>
      );
    case 'CONVERTED':
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/30">
          Converted
        </span>
      );
    case 'REJECTED':
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          Rejected
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400">
          {status}
        </span>
      );
  }
};
