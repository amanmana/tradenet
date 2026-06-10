import React, { useState, useEffect } from 'react';
import { getSettings, getRecentTickers, addRecentTicker, clearRecentTickers } from '../utils/storage';
import { formatCurrency, formatPercent } from '../utils/formatters';
import SectionCard from '../components/SectionCard';
import InputField from '../components/InputField';
import ResultCard from '../components/ResultCard';
import { Loader2, TrendingUp, Info, Trash2 } from 'lucide-react';
import { fetchYahooLastPrice } from '../services/quoteService';

export default function SimpleCalculator() {
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('profit'); // 'profit' or 'trailing'
  const [recentTickers, setRecentTickers] = useState([]);
  
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [ticker, setTicker] = useState('');
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [quotePriceUsed, setQuotePriceUsed] = useState(null);
  const [quoteSymbol, setQuoteSymbol] = useState(null);
  const [quoteShortName, setQuoteShortName] = useState(null);
  const [quoteFetchedAt, setQuoteFetchedAt] = useState(null);
  const [sellPriceWasFetched, setSellPriceWasFetched] = useState(false);
  const [quoteManualEdited, setQuoteManualEdited] = useState(false);
  const [capitalType, setCapitalType] = useState('lot'); // 'lot' or 'usd'
  const [capitalValue, setCapitalValue] = useState('');

  // Trailing Stop Reference States
  const [trailingTicker, setTrailingTicker] = useState('');
  const [trailingPrice, setTrailingPrice] = useState('');
  const [trailingLoading, setTrailingLoading] = useState(false);
  const [trailingError, setTrailingError] = useState(null);
  const [trailingPriceWasFetched, setTrailingPriceWasFetched] = useState(false);
  const [trailingManualEdited, setTrailingManualEdited] = useState(false);
  const [trailingQuotePrice, setTrailingQuotePrice] = useState(null);
  const [trailingQuoteSymbol, setTrailingQuoteSymbol] = useState(null);
  const [trailingQuoteShortName, setTrailingQuoteShortName] = useState(null);
  const [trailingQuoteFetchedAt, setTrailingQuoteFetchedAt] = useState(null);

  const handleFetchTrailingPrice = async () => {
    if (!trailingTicker.trim()) return;
    setTrailingLoading(true);
    setTrailingError(null);
    const res = await fetchYahooLastPrice(trailingTicker);
    setTrailingLoading(false);
    if (res.ok) {
      setTrailingPrice(res.price.toString());
      setTrailingQuoteFetchedAt(res.fetchedAt);
      setTrailingQuotePrice(res.price);
      setTrailingQuoteSymbol(res.symbol);
      setTrailingQuoteShortName(res.shortName);
      setTrailingPriceWasFetched(true);
      setTrailingManualEdited(false);
      const updated = addRecentTicker(trailingTicker);
      setRecentTickers(updated);
    } else {
      setTrailingError(res.error);
    }
  };

  const handleFetchLastPrice = async () => {
    if (!ticker.trim()) return;
    setQuoteLoading(true);
    setQuoteError(null);
    const res = await fetchYahooLastPrice(ticker);
    setQuoteLoading(false);
    if (res.ok) {
      setSellPrice(res.price.toString());
      setQuoteFetchedAt(res.fetchedAt);
      setQuotePriceUsed(res.price);
      setQuoteSymbol(res.symbol);
      setQuoteShortName(res.shortName);
      setSellPriceWasFetched(true);
      setQuoteManualEdited(false);
      const updated = addRecentTicker(ticker);
      setRecentTickers(updated);
    } else {
      setQuoteError(res.error);
    }
  };

  const handleClearTickers = () => {
    const updated = clearRecentTickers();
    setRecentTickers(updated);
  };

  useEffect(() => {
    setSettings(getSettings());
    setRecentTickers(getRecentTickers());
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Simple Calculator</h1>
          <p className="text-xs text-slate-400 mt-1">
            Quickly calculate profit/loss or find trailing stop levels.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 shadow-inner w-full md:w-auto shrink-0 select-none">
          <button
            type="button"
            onClick={() => setActiveTab('profit')}
            className={`flex-1 md:flex-none py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'profit'
                ? 'bg-slate-900 border border-slate-700/50 text-emerald-450 shadow-md shadow-emerald-500/5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Profit / Loss
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trailing')}
            className={`flex-1 md:flex-none py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'trailing'
                ? 'bg-slate-900 border border-slate-700/50 text-emerald-450 shadow-md shadow-emerald-500/5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Trailing Stop
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {activeTab === 'profit' ? (
          <>
            {/* Left Column - Input Form */}
            <div className="lg:col-span-7 space-y-6">
              <SectionCard title="Trade Details" subtitle="Enter your basic trade details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-2">
                <InputField
                  label="Ticker Symbol"
                  id="ticker"
                  placeholder="e.g. AAPL"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  tooltip="The stock ticker symbol representing the equity (e.g. AAPL, TSLA, MSFT)."
                  helperText={quoteShortName ? <span className="text-emerald-400 font-semibold text-sm">{quoteShortName}</span> : null}
                />
                {recentTickers.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Recent:</span>
                    {recentTickers.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTicker(t)}
                        className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs hover:bg-slate-800 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
                      >
                        {t}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleClearTickers}
                      className="p-1 rounded-full text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors ml-1"
                      title="Clear recent tickers"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

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
                      onChange={(e) => {
                        setSellPrice(e.target.value);
                        if (sellPriceWasFetched) {
                          setQuoteManualEdited(true);
                          setSellPriceWasFetched(false);
                        }
                      }}
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
                {sellPriceWasFetched && !quoteError && (
                  <span className="text-[10px] text-emerald-450 mt-1 leading-tight block font-medium">
                    ✓ Last price from Yahoo Finance: ${quotePriceUsed?.toFixed(4)} • {quoteSymbol}{quoteShortName ? ` (${quoteShortName})` : ''} • fetched {new Date(quoteFetchedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                {quoteManualEdited && !sellPriceWasFetched && (
                  <span className="text-[10px] text-slate-500 mt-1 leading-tight block font-medium">
                    ✏️ Manual sell price entered.
                  </span>
                )}
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
          </>
        ) : (
          <div className="lg:col-span-12 space-y-6">
            <SectionCard title="Trailing Stop Reference" subtitle="Calculate trailing stop prices based on percentage drops">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <InputField
                    label="Ticker Symbol (Optional)"
                    id="trailingTicker"
                    placeholder="e.g. AAPL"
                    value={trailingTicker}
                    onChange={(e) => setTrailingTicker(e.target.value)}
                    helperText={trailingQuoteShortName ? <span className="text-emerald-400 font-semibold text-sm">{trailingQuoteShortName}</span> : null}
                  />
                  {recentTickers.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">Recent:</span>
                      {recentTickers.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTrailingTicker(t)}
                          className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs hover:bg-slate-800 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
                        >
                          {t}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleClearTickers}
                        className="p-1 rounded-full text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors ml-1"
                        title="Clear recent tickers"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col space-y-1.5 w-full">
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <label htmlFor="trailingPrice" className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                      Reference Price (USD)
                    </label>
                  </div>
                  
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium select-none pointer-events-none text-sm">
                        $
                      </div>
                      <input
                        id="trailingPrice"
                        type="number"
                        step="0.0001"
                        placeholder="0.00"
                        value={trailingPrice}
                        onChange={(e) => {
                          setTrailingPrice(e.target.value);
                          if (trailingPriceWasFetched) {
                            setTrailingManualEdited(true);
                            setTrailingPriceWasFetched(false);
                          }
                        }}
                        className="w-full bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/60 focus:border-emerald-500/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all duration-200"
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleFetchTrailingPrice}
                      disabled={trailingLoading || !trailingTicker.trim()}
                      className="px-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-450 hover:text-slate-200 hover:bg-slate-900 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                      title="Use last price from Yahoo Finance"
                    >
                      {trailingLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      )}
                    </button>
                  </div>
                  {trailingPriceWasFetched && !trailingError && (
                    <span className="text-[10px] text-emerald-450 mt-1 leading-tight block font-medium">
                      ✓ Last price from Yahoo Finance: ${trailingQuotePrice?.toFixed(4)} • {trailingQuoteSymbol}{trailingQuoteShortName ? ` (${trailingQuoteShortName})` : ''} • fetched {new Date(trailingQuoteFetchedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {trailingManualEdited && !trailingPriceWasFetched && (
                    <span className="text-[10px] text-slate-500 mt-1 leading-tight block font-medium">
                      ✏️ Manual reference price entered.
                    </span>
                  )}
                  {trailingError && (
                    <span className="text-[10px] text-red-400 mt-1 leading-tight block">
                      ⚠️ {trailingError}
                    </span>
                  )}
                </div>
              </div>

              {parseFloat(trailingPrice) > 0 && (
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl overflow-hidden mt-2">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-slate-800/80">
                    {[0.2, 0.3, 0.5, 0.7, 1, 1.5, 2, 2.5, 3, 3.5].map(pct => {
                      const dropPrice = parseFloat(trailingPrice) * (1 - pct/100);
                      return (
                        <div key={pct} className="bg-slate-950 p-3 flex flex-col items-center justify-center hover:bg-slate-900 transition-colors">
                          <span className="text-xs text-slate-400 font-semibold mb-1">-{pct}%</span>
                          <span className="text-sm text-emerald-400 font-bold">${dropPrice.toFixed(3)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
        )}
      </div>
    </div>
  );
}
