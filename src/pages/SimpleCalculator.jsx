import React, { useState, useEffect } from 'react';
import { getSettings } from '../utils/storage';
import { formatCurrency, formatPercent } from '../utils/formatters';
import SectionCard from '../components/SectionCard';
import InputField from '../components/InputField';
import ResultCard from '../components/ResultCard';
import { Loader2, TrendingUp, Info } from 'lucide-react';
import { fetchYahooLastPrice } from '../services/quoteService';

export default function SimpleCalculator() {
  const [settings, setSettings] = useState(null);
  
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [ticker, setTicker] = useState('');
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [capitalType, setCapitalType] = useState('lot'); // 'lot' or 'usd'
  const [capitalValue, setCapitalValue] = useState('');

  const handleFetchLastPrice = async () => {
    if (!ticker.trim()) return;
    setQuoteLoading(true);
    setQuoteError(null);
    const res = await fetchYahooLastPrice(ticker);
    setQuoteLoading(false);
    if (res.ok) {
      setSellPrice(res.price.toString());
    } else {
      setQuoteError(res.error);
    }
  };

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  // Calculation
  const bPrice = parseFloat(buyPrice) || 0;
  const sPrice = parseFloat(sellPrice) || 0;
  const cValue = parseFloat(capitalValue) || 0;

  let shares = 0;
  if (bPrice > 0 && cValue > 0) {
    if (capitalType === 'lot') {
      shares = cValue * 100; // 1 lot = 100 shares
    } else {
      shares = cValue / bPrice;
    }
  }

  const totalBuyCostUSD = shares * bPrice;
  const totalSellProceedsUSD = shares * sPrice;
  const profitLossUSD = totalSellProceedsUSD - totalBuyCostUSD;
  const roi = totalBuyCostUSD > 0 ? (profitLossUSD / totalBuyCostUSD) * 100 : 0;

  // Convert to MYR
  const fxRate = settings?.sellFxRate || 4.40;
  const profitLossMYR = profitLossUSD * fxRate;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-900 pb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Simple Calculator</h1>
        <p className="text-xs text-slate-400 mt-1">
          Quickly calculate profit or loss in USD and MYR without complex fees.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column - Input Form */}
        <div className="lg:col-span-7 space-y-6">
          <SectionCard title="Trade Details" subtitle="Enter your basic trade details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Ticker Symbol"
                id="ticker"
                placeholder="e.g. AAPL"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="sm:col-span-2"
                tooltip="The stock ticker symbol representing the equity (e.g. AAPL, TSLA, MSFT)."
              />

              <InputField
                label="Buy Price (USD)"
                id="buyPrice"
                type="number"
                step="0.0001"
                placeholder="0.00"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                prefix="$"
              />

              <div className="flex flex-col space-y-1.5 w-full">
                <div className="flex items-center space-x-1.5 mb-0.5">
                  <label htmlFor="sellPrice" className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                    Sell Price (USD)
                  </label>
                </div>
                
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium select-none pointer-events-none text-sm">
                      $
                    </div>
                    <input
                      id="sellPrice"
                      type="number"
                      step="0.0001"
                      placeholder="0.00"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/60 focus:border-emerald-500/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all duration-200"
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleFetchLastPrice}
                    disabled={quoteLoading || !ticker.trim()}
                    className="px-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-450 hover:text-slate-200 hover:bg-slate-900 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                    title="Use last price from Yahoo Finance"
                  >
                    {quoteLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    )}
                  </button>
                </div>
                {quoteError && (
                  <span className="text-[10px] text-red-400 mt-1 leading-tight block">
                    ⚠️ {quoteError}
                  </span>
                )}
              </div>

              <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5 w-full">
                  <label htmlFor="capitalType" className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-0.5">
                    Capital Type
                  </label>
                  <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 shadow-inner w-full shrink-0 select-none">
                    <button
                      type="button"
                      onClick={() => setCapitalType('lot')}
                      className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        capitalType === 'lot'
                          ? 'bg-slate-900 border border-slate-700/50 text-emerald-450 shadow-md shadow-emerald-500/5'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Lot (x100)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCapitalType('usd')}
                      className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        capitalType === 'usd'
                          ? 'bg-slate-900 border border-slate-700/50 text-emerald-450 shadow-md shadow-emerald-500/5'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      USD ($)
                    </button>
                  </div>
                </div>

                <InputField
                  label={capitalType === 'lot' ? 'Capital (Lots)' : 'Capital (USD)'}
                  id="capitalValue"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={capitalValue}
                  onChange={(e) => setCapitalValue(e.target.value)}
                  prefix={capitalType === 'usd' ? '$' : '#'}
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-5 space-y-6 sticky top-24">
          <SectionCard title="Results" subtitle="Calculated based on your inputs">
            <div className="space-y-4">
              <ResultCard
                label="Total Shares"
                value={shares.toFixed(2)}
                currency=""
              />
              <ResultCard
                label="Profit / Loss (USD)"
                value={formatCurrency(Math.abs(profitLossUSD), '', 2)}
                currency="$"
                highlight={true}
                highlightType={profitLossUSD >= 0 ? 'profit' : 'loss'}
                prefix={profitLossUSD >= 0 ? '+' : '-'}
              />
              <ResultCard
                label={`Profit / Loss (MYR) @ ${fxRate}`}
                value={formatCurrency(Math.abs(profitLossMYR), '', 2)}
                currency="RM"
                highlight={true}
                highlightType={profitLossMYR >= 0 ? 'profit' : 'loss'}
                prefix={profitLossMYR >= 0 ? '+' : '-'}
              />
              <ResultCard
                label="ROI (%)"
                value={formatPercent(roi)}
                highlight={true}
                highlightType={roi >= 0 ? 'profit' : 'loss'}
                prefix={roi >= 0 ? '+' : ''}
              />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
