import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Sparkles, Activity, ShieldCheck } from 'lucide-react';
import { useSearchStore } from '../../stores/useSearchStore.js';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { isSearching, jobProgress } = useSearchStore();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return { title: 'Dashboard', sub: 'Live overview of lead discovery performance' };
      case '/search': return { title: 'AI Lead Search Assistant', sub: 'Natural language search query & strategy formulation' };
      case '/leads': return { title: 'All Business Leads', sub: 'Filter, inspect, score and export discovered companies' };
      case '/saved': return { title: 'Saved Leads', sub: 'Your starred priority prospects' };
      case '/projects': return { title: 'Search Projects', sub: 'Organized lead generation campaigns' };
      case '/history': return { title: 'Search History', sub: 'Log of previous discovery queries & extractions' };
      case '/sources': return { title: 'Data Sources & Providers', sub: 'Tavily, SerpAPI, Bing, and Google Places integrations' };
      case '/settings/api': return { title: 'API & Model Settings', sub: 'Configure API keys, model parameters, and credentials' };
      case '/usage': return { title: 'Usage & Cost Analytics', sub: 'Token consumption, provider breakdown, and cost estimation' };
      case '/settings/account': return { title: 'Account Settings', sub: 'Workspace configuration and security' };
      default: return { title: 'AI Lead Finder', sub: 'Production Platform' };
    }
  };

  const { title, sub } = getPageTitle();

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0E1526]/80 backdrop-blur-md px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight leading-none">{title}</h1>
        <p className="text-xs text-slate-400 mt-1">{sub}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Real-time Job Status Pill */}
        {isSearching ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <span className="font-medium">Discovering... {jobProgress?.progress || 0}%</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-400 text-xs">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Engines Ready</span>
          </div>
        )}

        <div className="h-4 w-[1px] bg-slate-800" />

        <Link
          to="/search"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New AI Search</span>
        </Link>
      </div>
    </header>
  );
};
