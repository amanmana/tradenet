import React from 'react';
import { History } from 'lucide-react';

/**
 * Placeholder component when no saved calculations exist.
 */
export default function EmptyState({
  title = 'No Saved Trades',
  description = 'Your saved calculations will appear here. Run a calculation and click "Save Trade" to record your entries.',
  icon: Icon = History
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/10 text-center">
      <div className="p-4 rounded-full bg-slate-900/80 border border-slate-800/50 text-slate-500 mb-4 animate-pulse">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-200">{title}</h3>
      <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">{description}</p>
    </div>
  );
}
