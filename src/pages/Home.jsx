import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Landmark, ArrowRight, Percent, ShieldCheck, History, Calculator, RefreshCw, Settings } from 'lucide-react';
import SectionCard from '../components/SectionCard';


/**
 * App Homepage with main features and navigation cards.
 */
export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <span>Personal Trade Companion</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
          TradeNet <span className="text-emerald-400 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">MY</span>
        </h1>
        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Calculate real stock profit, transaction fees, FX conversion impacts, and target selling prices for US stocks and local Bursa Malaysia stocks.
        </p>
      </div>

      {/* Main Calculator Entry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* US Calculator */}
        <div 
          onClick={() => navigate('/moomoo-us')}
          className="group relative cursor-pointer rounded-2xl border border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/40 p-6 md:p-8 shadow-xl hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                MooMoo US Calculator
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Estimate net returns for US stock trades. Supports platform/settlement/commission fee splits, custom FX rates (buy/sell), SEC/TAF fees, and target ROI calculators.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-semibold text-emerald-400 mt-6 group-hover:translate-x-1.5 transition-transform duration-300">
            <span>Calculate US Trade</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </div>

        {/* Bursa Calculator */}
        <div 
          onClick={() => navigate('/bursa')}
          className="group relative cursor-pointer rounded-2xl border border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/40 p-6 md:p-8 shadow-xl hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 w-fit">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white group-hover:text-teal-400 transition-colors">
                Bursa Malaysia Calculator
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Calculate net profit for local MYR stock trades. Supports standard board lot helper (1 lot = 100 shares), clearing fees, brokerage presets, stamp duty, and SST percentages.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-semibold text-teal-400 mt-6 group-hover:translate-x-1.5 transition-transform duration-300">
            <span>Calculate Bursa Trade</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      </div>

      {/* Feature Summaries */}
      <div className="max-w-4xl mx-auto space-y-6 pt-4">
        <h3 className="text-center text-xs font-bold uppercase tracking-widest text-slate-500">
          Core Calculations Supported
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start space-x-3 p-4 rounded-xl border border-slate-900 bg-slate-950/20">
            <Percent className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">Net Profit & ROI %</h4>
              <p className="text-xs text-slate-500 mt-1">Computes gross yields minus total buy/sell fee overlays for actual ROI % return indicators.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 rounded-xl border border-slate-900 bg-slate-950/20">
            <RefreshCw className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">FX Conversion Impact</h4>
              <p className="text-xs text-slate-500 mt-1">Translates USD buy costs and sell proceeds to local MYR based on respective conversion rates.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 rounded-xl border border-slate-900 bg-slate-950/20">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">Break-Even Sell Price</h4>
              <p className="text-xs text-slate-500 mt-1">Solves the absolute minimum selling price required to break even after covering transaction costs.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 rounded-xl border border-slate-900 bg-slate-950/20">
            <Calculator className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">Target Profit Planner</h4>
              <p className="text-xs text-slate-500 mt-1">Specify your desired net profit amount (USD/MYR) or target ROI % and get the required sell target.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 rounded-xl border border-slate-900 bg-slate-950/20">
            <History className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">Local Saved Trades</h4>
              <p className="text-xs text-slate-500 mt-1">Store your calculations locally. Review realized yields, sort, filter, and export data logs to CSV.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 rounded-xl border border-slate-900 bg-slate-950/20">
            <Settings className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">Custom Presets</h4>
              <p className="text-xs text-slate-500 mt-1">Configure default commissions, clearance rates, taxes, and decimal settings to auto-fill inputs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
