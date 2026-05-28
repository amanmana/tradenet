import React from 'react';

/**
 * Modern glassmorphic panel container for content blocks.
 */
export default function SectionCard({ children, title, subtitle, className = '', headerActions }) {
  return (
    <div className={`rounded-2xl border border-slate-800/80 bg-slate-900/35 backdrop-blur-md p-5 md:p-6 shadow-xl hover:border-slate-800/100 transition-all duration-300 ${className}`}>
      {(title || subtitle || headerActions) && (
        <div className="flex justify-between items-start mb-5 border-b border-slate-800/50 pb-4">
          <div>
            {title && <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
