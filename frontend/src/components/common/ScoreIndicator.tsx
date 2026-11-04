import React from 'react';

interface ScoreIndicatorProps {
  score: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreIndicator: React.FC<ScoreIndicatorProps> = ({ score, showDetails = false, size = 'md' }) => {
  const rounded = Math.round(score);

  const getColor = () => {
    if (rounded >= 80) return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', bar: 'bg-emerald-500', label: 'High Quality' };
    if (rounded >= 60) return { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', bar: 'bg-indigo-500', label: 'Good Match' };
    if (rounded >= 40) return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', bar: 'bg-amber-500', label: 'Moderate' };
    return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', bar: 'bg-rose-500', label: 'Low Score' };
  };

  const { bg, text, border, bar, label } = getColor();

  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${bg} ${text} border ${border}`}>
        <span>{rounded}</span>
        <span className="text-[10px] opacity-75">/100</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 min-w-[70px]">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-bold ${text}`}>{rounded}</span>
        {showDetails && <span className="text-[10px] text-slate-400">{label}</span>}
      </div>
      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${rounded}%` }} />
      </div>
    </div>
  );
};
