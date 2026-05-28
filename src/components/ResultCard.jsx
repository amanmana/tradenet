import React from 'react';
import { Info } from 'lucide-react';

/**
 * Metric result visualization block with automatic color-states for financial returns.
 */
export default function ResultCard({ label, value, type = 'neutral', subtitle, size = 'md', className = '', tooltip }) {
  const getThemeClasses = () => {
    switch (type) {
      case 'profit':
        return 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 shadow-md shadow-emerald-950/10';
      case 'loss':
        return 'border-red-500/25 bg-red-500/5 text-red-400 shadow-md shadow-red-950/10';
      case 'neutral':
      default:
        return 'border-slate-800 bg-slate-900/20 text-slate-200';
    }
  };

  const getValueSize = () => {
    switch (size) {
      case 'lg':
        return 'text-2xl md:text-3xl font-extrabold font-mono tracking-tight';
      case 'sm':
        return 'text-base font-semibold font-mono';
      case 'md':
      default:
        return 'text-xl md:text-2xl font-bold font-mono tracking-tight';
    }
  };

  return (
    <div className={`rounded-xl border p-4 transition-all duration-200 ${getThemeClasses()} ${className}`}>
      <div className="flex items-center space-x-1.5 mb-1">
        <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-400 block">
          {label}
        </span>
        {tooltip && (
          <div className="group relative flex items-center">
            <span className="cursor-help text-slate-500 hover:text-slate-400 transition-colors">
              <Info className="w-3.5 h-3.5" />
            </span>
            <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-350 leading-normal shadow-2xl backdrop-blur-md normal-case font-normal select-none pointer-events-none">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <div className={getValueSize()}>{value}</div>
      {subtitle && <p className="text-[10px] md:text-xs text-slate-400/70 mt-1">{subtitle}</p>}
    </div>
  );
}
