import React, { useState, useEffect } from 'react';
import { getSavedTrades, deleteTrade, clearAllTrades, saveTrade, getSettings } from '../utils/storage';
import { exportTradesToCsv } from '../utils/csvExport';
import { formatCurrency, formatPercent, formatDate, formatQuantity, formatUsQuantity } from '../utils/formatters';
import SectionCard from '../components/SectionCard';
import ResultCard from '../components/ResultCard';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import InputField from '../components/InputField';
import { Download, Trash2, Search, Filter, Calendar, TrendingUp, DollarSign, Landmark, Copy } from 'lucide-react';

/**
 * Saved trades history dashboard view with duplication action.
 */
export default function SavedTrades() {
  const [trades, setTrades] = useState([]);
  const [settings, setSettings] = useState(null);
  
  // Filtering and searching
  const [searchQuery, setSearchQuery] = useState('');
  const [marketFilter, setMarketFilter] = useState('ALL'); // 'ALL', 'US', 'BURSA'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'highest-profit', 'lowest-profit'

  // Confirmations
  const [isClearAllOpen, setIsClearAllOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState(null);

  useEffect(() => {
    setTrades(getSavedTrades());
    setSettings(getSettings());
  }, []);

  const handleDeleteConfirm = () => {
    if (tradeToDelete) {
      const success = deleteTrade(tradeToDelete);
      if (success) {
        setTrades(getSavedTrades());
      }
      setTradeToDelete(null);
    }
  };

  const handleClearAllConfirm = () => {
    const success = clearAllTrades();
    if (success) {
      setTrades([]);
    }
  };

  const handleDuplicateTrade = (trade) => {
    // Generate a copy with new IDs and timestamps
    const duplicatedTrade = {
      ...trade,
      id: Date.now().toString() + Math.random().toString().slice(2, 6),
      createdAt: new Date().toISOString(),
      notes: trade.notes ? `${trade.notes} (Copy)` : 'Duplicated entry'
    };

    const saved = saveTrade(duplicatedTrade);
    if (saved) {
      setTrades(getSavedTrades());
    }
  };

  const handleCsvExport = () => {
    exportTradesToCsv(filteredTrades);
  };

  // Calculations for stats summary cards
  const totalRealizedMyr = trades.reduce((sum, t) => sum + (t.netProfitMyr || 0), 0);
  const totalRealizedUsd = trades.reduce((sum, t) => sum + (t.market === 'US' ? (t.netProfitUsd || 0) : 0), 0);

  // Filter and sort operations
  const filteredTrades = trades
    .filter(t => {
      const matchesSearch = t.ticker.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMarket = marketFilter === 'ALL' ? true : t.market === marketFilter;
      return matchesSearch && matchesMarket;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'highest-profit') return b.netProfitMyr - a.netProfitMyr;
      if (sortBy === 'lowest-profit') return a.netProfitMyr - b.netProfitMyr;
      return 0;
    });

  const getProfitType = (profit) => {
    if (profit > 0) return 'profit';
    if (profit < 0) return 'loss';
    return 'neutral';
  };

  return (
    <div className="space-y-6 py-2">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center space-x-2">
            <span>Saved Trading Records</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse through your saved transaction history, export data to CSV, or inspect performance summary.
          </p>
        </div>

        {trades.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCsvExport}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-800 bg-slate-950 text-slate-300 hover:text-slate-100 hover:bg-slate-900 transition-all cursor-pointer select-none active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            
            <button
              onClick={() => setIsClearAllOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-red-955/40 bg-red-955/20 text-red-400 hover:text-red-300 hover:bg-red-900/10 transition-all cursor-pointer select-none active:scale-[0.98]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>

      {/* Stats Summary Panel */}
      {trades.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ResultCard
            label="Total Saved Entries"
            value={trades.length}
            type="neutral"
          />
          
          <ResultCard
            label="Realized Return (MYR)"
            value={formatCurrency(totalRealizedMyr, 'MYR', 2)}
            type={getProfitType(totalRealizedMyr)}
            subtitle="Combined returns of all trades"
          />

          <ResultCard
            label="US Stocks Return (USD)"
            value={formatCurrency(totalRealizedUsd, 'USD', 2)}
            type={getProfitType(totalRealizedUsd)}
            subtitle="Returns from US trades only"
          />
        </div>
      )}

      {/* Filters and Search Bar */}
      {trades.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-850 bg-slate-900/10 items-end animate-in fade-in duration-200">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Search Stock</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by ticker or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Market Filter */}
          <div>
            <label htmlFor="market-filter" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Filter Market</label>
            <select
              id="market-filter"
              value={marketFilter}
              onChange={(e) => setMarketFilter(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Markets</option>
              <option value="US">MooMoo US</option>
              <option value="BURSA">Bursa Malaysia</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <label htmlFor="sort-filter" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Sort Order</label>
            <select
              id="sort-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest-profit">Highest Profit (MYR)</option>
              <option value="lowest-profit">Lowest Profit (MYR)</option>
            </select>
          </div>
        </div>
      )}

      {/* Trades List View */}
      {filteredTrades.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTrades.map((trade) => {
            const isUS = trade.market === 'US';
            const profit = isUS ? trade.netProfitUsd : trade.netProfitMyr;
            const profitType = getProfitType(profit);
            
            return (
              <div 
                key={trade.id}
                className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/20 p-5 shadow-xl hover:border-slate-800 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between"
              >
                {/* Header info */}
                <div className="flex justify-between items-start border-b border-slate-900 pb-3 mb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-1.5 rounded-lg border text-sm font-semibold flex items-center justify-center ${
                      isUS 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                    }`}>
                      {isUS ? <DollarSign className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-bold text-white tracking-tight">{trade.ticker}</span>
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900 border border-slate-850 font-bold text-slate-500 select-none">
                          {trade.broker}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-[10px] text-slate-500 mt-0.5">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>{formatDate(trade.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleDuplicateTrade(trade)}
                      className="p-1.5 rounded-lg border border-transparent text-slate-500 hover:text-emerald-400 hover:border-emerald-950/20 hover:bg-emerald-950/5 transition-all cursor-pointer"
                      title="Duplicate Entry"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTradeToDelete(trade.id)}
                      className="p-1.5 rounded-lg border border-transparent text-slate-500 hover:text-red-400 hover:border-red-955/20 hover:bg-red-955/5 transition-all cursor-pointer"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Body Metrics */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 rounded-xl bg-slate-950/30 border border-slate-900">
                    <span className="text-[9px] uppercase text-slate-500 block font-semibold">Volume</span>
                    <span className="text-xs font-mono font-bold text-slate-300 mt-1 block">
                      {isUS ? formatUsQuantity(trade.quantity) : formatQuantity(trade.quantity)}
                    </span>
                  </div>
                  
                  <div className="text-center p-2 rounded-xl bg-slate-950/30 border border-slate-900">
                    <span className="text-[9px] uppercase text-slate-500 block font-semibold">Buy Price</span>
                    <span className="text-xs font-mono font-bold text-slate-300 mt-1 block">
                      {isUS 
                        ? formatCurrency(trade.buyPrice, 'USD', settings?.priceDecimals || 4) 
                        : formatCurrency(trade.buyPrice, 'MYR', settings?.priceDecimals || 4)}
                    </span>
                  </div>

                  <div className="text-center p-2 rounded-xl bg-slate-950/30 border border-slate-900">
                    <span className="text-[9px] uppercase text-slate-500 block font-semibold">Sell Price</span>
                    <span className="text-xs font-mono font-bold text-slate-300 mt-1 block">
                      {isUS 
                        ? formatCurrency(trade.sellPrice, 'USD', settings?.priceDecimals || 4) 
                        : formatCurrency(trade.sellPrice, 'MYR', settings?.priceDecimals || 4)}
                    </span>
                  </div>
                </div>

                {/* Final Returns row */}
                <div className="flex justify-between items-center py-2.5 px-3.5 rounded-xl border border-slate-900/60 bg-slate-950/30 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold">Profit Summary</span>
                    <div className="flex items-center space-x-1.5">
                      <span className={`font-mono font-extrabold text-sm ${
                        profitType === 'profit' ? 'text-emerald-400' : profitType === 'loss' ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        {isUS 
                          ? `${formatCurrency(trade.netProfitUsd, 'USD', 2)} / RM ${trade.netProfitMyr.toFixed(2)}` 
                          : formatCurrency(trade.netProfitMyr, 'MYR', 2)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold">ROI %</span>
                    <span className={`font-mono font-bold block ${
                      profitType === 'profit' ? 'text-emerald-400' : profitType === 'loss' ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {formatPercent(trade.roiPercent)}
                    </span>
                  </div>
                </div>

                {/* Quote metadata box */}
                {trade.sellPriceWasFetched && (
                  <div className="mt-2.5 p-2 py-1.5 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] text-[9px] text-emerald-400 leading-normal flex items-center justify-between">
                    <span>
                      📊 Price fetched from {trade.quoteSource} ({trade.quoteSymbol})
                    </span>
                    <span className="font-mono text-slate-500 text-[8px]">
                      {new Date(trade.quoteFetchedAt).toLocaleDateString('en-MY')} {new Date(trade.quoteFetchedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                {/* Notes box */}
                {trade.notes && (
                  <div className="mt-3.5 p-2.5 rounded-xl border border-slate-850 bg-slate-950/20 text-[10px] text-slate-450 leading-relaxed">
                    <span className="font-semibold text-slate-555 uppercase tracking-wider text-[8px] block mb-0.5">Trader Notes:</span>
                    <p>{trade.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={trades.length === 0 ? 'No Calculations Saved' : 'No Matches Found'}
          description={
            trades.length === 0
              ? 'Your calculations database is currently empty. Run calculations on the MooMoo US or Bursa tabs and save your trades.'
              : 'Adjust your search queries or change the market filters to find records.'
          }
        />
      )}

      {/* Confirmations modals */}
      <ConfirmDialog
        isOpen={isClearAllOpen}
        onClose={() => setIsClearAllOpen(false)}
        onConfirm={handleClearAllConfirm}
        title="Clear Trade History"
        message="Are you sure you want to delete all saved calculations? This operation is permanent and cannot be undone."
        confirmText="Clear All Data"
        isDanger={true}
      />

      <ConfirmDialog
        isOpen={!!tradeToDelete}
        onClose={() => setTradeToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Trade Entry"
        message="Are you sure you want to remove this calculation record from history?"
        confirmText="Delete Record"
        isDanger={true}
      />
    </div>
  );
}
