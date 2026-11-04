import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { History, RotateCw, CheckCircle2, Clock, XCircle, ChevronRight } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const projs = await api.getProjects();
      setProjects(projs);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          Discovery & Search History
        </h2>
        <p className="text-xs text-slate-400">
          Chronological record of multi-source searches dispatched to background workers.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 p-8 rounded-2xl bg-[#111827] border border-slate-800 space-y-3">
          <History className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No Search History Available</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Dispatched search jobs will appear here with execution diagnostics and timing.
          </p>
        </div>
      ) : (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="divide-y divide-slate-800/80">
            {projects.map((item) => (
              <div
                key={item.id}
                className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Target: {item.configuration?.quantity || 50} leads in {item.country} ({item.industry})
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Executed: {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs font-bold text-white block">{item.totalFound} Leads Collected</span>
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase">{item.status}</span>
                  </div>

                  <a
                    href={`/leads?searchProjectId=${item.id}`}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="View collected leads"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
