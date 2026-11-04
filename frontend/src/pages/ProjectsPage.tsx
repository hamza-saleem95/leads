import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { SearchProject } from '../types/index.js';
import { FolderGit2, Users, Calendar, ArrowRight, Sparkles, MapPin } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<SearchProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-indigo-400" />
            Search Projects ({projects.length})
          </h2>
          <p className="text-xs text-slate-400">
            Organized lead generation campaigns and market intelligence searches.
          </p>
        </div>

        <Link
          to="/search"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Project Search</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 p-8 rounded-2xl bg-[#111827] border border-slate-800 space-y-3">
          <FolderGit2 className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No Search Projects Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Launch your first search via the AI Assistant to create a structured project campaign.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-[#111827] border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 shadow-sm space-y-4 transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    {proj.industry}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 uppercase">
                    {proj.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                  {proj.name}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{proj.country}</span>
                  {proj.configuration?.cities && proj.configuration.cities.length > 0 && (
                    <span className="text-[11px] text-slate-400 truncate">
                      ({proj.configuration.cities.join(', ')})
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{proj.totalFound} Leads</span>
                </div>

                <Link
                  to={`/leads?searchProjectId=${proj.id}`}
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold group-hover:translate-x-0.5 transition-transform"
                >
                  <span>View Leads</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
