import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Users,
  BookmarkCheck,
  FolderGit2,
  History,
  Database,
  KeyRound,
  Coins,
  Settings,
  Bot,
  Flame,
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { useSearchStore } from '../../stores/useSearchStore.js';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
  isHot?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'AI Lead Search', path: '/search', icon: Sparkles, isHot: true },
  { name: 'All Leads', path: '/leads', icon: Users },
  { name: 'Saved Leads', path: '/saved', icon: BookmarkCheck },
  { name: 'Search Projects', path: '/projects', icon: FolderGit2 },
  { name: 'Search History', path: '/history', icon: History },
  { name: 'Data Sources', path: '/sources', icon: Database },
  { name: 'API Settings', path: '/settings/api', icon: KeyRound },
  { name: 'Usage & Costs', path: '/usage', icon: Coins },
  { name: 'Account Settings', path: '/settings/account', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const { isSearching, jobProgress } = useSearchStore();

  return (
    <aside className="w-64 bg-[#0E1526] border-r border-slate-800/80 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-tight text-white">AI Lead Finder</span>
            <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              PRO
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block -mt-0.5">B2B Discovery Platform</span>
        </div>
      </div>

      {/* Live Search Indicator (when running) */}
      {isSearching && (
        <div className="mx-4 mt-3 p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-xs text-indigo-200 flex items-center gap-2 animate-pulse">
          <Flame className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
          <div className="overflow-hidden">
            <div className="font-semibold text-white truncate">Active Discovery</div>
            <div className="text-[10px] text-indigo-300 truncate">{jobProgress?.currentMessage || 'Searching...'}</div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              <span className="flex-1">{item.name}</span>
              {item.isHot && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  AI Core
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800/80 bg-[#0A0F1D]/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400 text-sm">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'EX'}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-sm font-semibold text-slate-200 truncate">{user?.name || 'Administrator'}</div>
            <div className="text-xs text-slate-400 truncate">{user?.email || 'admin@aileadfinder.io'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
