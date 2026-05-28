import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DollarSign, Landmark } from 'lucide-react';

/**
 * Switcher component for calculators.
 */
export default function MarketTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="flex bg-slate-950/60 p-1.5 rounded-2xl border border-slate-900/80 w-full max-w-lg mx-auto mb-8 shadow-inner">
      <button
        onClick={() => navigate('/moomoo-us')}
        className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
          currentPath === '/moomoo-us'
            ? 'bg-slate-900 border border-slate-800 text-emerald-400 shadow-md shadow-emerald-500/5'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <DollarSign className="w-4 h-4" />
        <span>MooMoo US</span>
      </button>
      
      <button
        onClick={() => navigate('/bursa')}
        className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
          currentPath === '/bursa'
            ? 'bg-slate-900 border border-slate-800 text-emerald-400 shadow-md shadow-emerald-500/5'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Landmark className="w-4 h-4" />
        <span>Bursa Malaysia</span>
      </button>
    </div>
  );
}
