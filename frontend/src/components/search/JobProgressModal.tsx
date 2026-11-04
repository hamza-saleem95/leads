import React from 'react';
import { Modal } from '../common/Modal.js';
import { useSearchStore } from '../../stores/useSearchStore.js';
import { api } from '../../services/api.js';
import { ScoreIndicator } from '../common/ScoreIndicator.js';
import { StatusPill } from '../common/StatusPill.js';
import {
  Play,
  Pause,
  XCircle,
  RotateCw,
  CheckCircle2,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  Loader2,
  Flame,
} from 'lucide-react';

interface JobProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewAllLeads: () => void;
}

export const JobProgressModal: React.FC<JobProgressModalProps> = ({
  isOpen,
  onClose,
  onViewAllLeads,
}) => {
  const { jobProgress, activeJobId, liveLeads, isSearching, stopJob } = useSearchStore();

  const handleCancel = async () => {
    if (!activeJobId) return;
    try {
      await api.cancelJob(activeJobId);
      stopJob();
    } catch (e: any) {
      console.error('Cancel failed', e);
    }
  };

  const handlePause = async () => {
    if (!activeJobId) return;
    try {
      await api.pauseJob(activeJobId);
    } catch (e: any) {
      console.error('Pause failed', e);
    }
  };

  const handleResume = async () => {
    if (!activeJobId) return;
    try {
      await api.resumeJob(activeJobId);
    } catch (e: any) {
      console.error('Resume failed', e);
    }
  };

  const handleRetry = async () => {
    if (!activeJobId) return;
    try {
      await api.retryJob(activeJobId);
    } catch (e: any) {
      console.error('Retry failed', e);
    }
  };

  const isCompleted = jobProgress?.status === 'COMPLETED';
  const isFailed = jobProgress?.status === 'FAILED';
  const isCancelled = jobProgress?.status === 'CANCELLED';
  const isPaused = jobProgress?.status === 'PAUSED';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCompleted ? 'Search & Extraction Complete' : 'Discovery Pipeline Live Execution'}
      subtitle={jobProgress?.currentMessage || 'Multi-source engine active...'}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Progress Bar & Stat Badges */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              ) : isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400" />
              )}
              <span className="font-bold text-white capitalize">{jobProgress?.stage?.toLowerCase() || 'Processing'}</span>
            </div>
            <span className="font-bold text-indigo-400">{jobProgress?.progress || 0}% Completed</span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isCompleted ? 'bg-emerald-500' : isFailed ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-sky-400'
              }`}
              style={{ width: `${jobProgress?.progress || 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
            <span>Processed: <strong className="text-white">{jobProgress?.processedItems || liveLeads.length}</strong> / {jobProgress?.totalItems || 50} targets</span>
            <span>Verified Leads: <strong className="text-emerald-400">{liveLeads.length}</strong></span>
          </div>
        </div>

        {/* Job Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSearching && (
              <>
                {isPaused ? (
                  <button
                    onClick={handleResume}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Resume
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    Pause
                  </button>
                )}
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/30"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </>
            )}

            {(isFailed || isCancelled) && (
              <button
                onClick={handleRetry}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Retry Search
              </button>
            )}
          </div>

          {isCompleted && (
            <button
              onClick={() => {
                onClose();
                onViewAllLeads();
              }}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
            >
              <span>View All Collected Leads ({liveLeads.length})</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Incoming Leads Stream */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Streamed Lead Records ({liveLeads.length})
            </span>
            <span className="text-[11px] text-slate-400">Live deduplication & quality scoring active</span>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {liveLeads.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs rounded-xl border border-dashed border-slate-800">
                Dispatched search providers. Awaiting candidate business records...
              </div>
            ) : (
              liveLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                >
                  <div className="space-y-1 overflow-hidden pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate">{lead.companyName}</span>
                      <StatusPill status={lead.emailStatus} type="email" />
                      <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800 uppercase">
                        {lead.sourceProvider}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                      {lead.email && (
                        <span className="flex items-center gap-1 text-slate-300 truncate">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {lead.email}
                        </span>
                      )}
                      {lead.phone && (
                        <span className="flex items-center gap-1 truncate">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {lead.phone}
                        </span>
                      )}
                      {lead.website && (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-indigo-400 hover:underline truncate"
                        >
                          <Globe className="w-3 h-3" />
                          {lead.website.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <ScoreIndicator score={lead.leadScore} size="sm" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
