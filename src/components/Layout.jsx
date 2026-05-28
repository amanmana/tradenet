import React from 'react';
import Navbar from './Navbar';

/**
 * Main application layout wrapper.
 */
export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 text-slate-100">
      <Navbar />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {children}
      </main>
      
      <footer className="w-full border-t border-slate-900/60 bg-slate-950/40 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1.5">
          <p>© {new Date().getFullYear()} TradeNet MY. Built for Malaysian traders.</p>
          <p className="text-[10px] text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Disclaimer: This calculator is for estimation and personal planning only. We do not guarantee official fee alignment with specific brokers. Always verify final transaction charges with your broker contract note.
          </p>
        </div>
      </footer>
    </div>
  );
}
