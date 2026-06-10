import React, { useState, useEffect } from 'react';
import { getSettings } from '../utils/storage';
import { formatCurrency, formatPercent } from '../utils/formatters';
import SectionCard from '../components/SectionCard';
import InputField from '../components/InputField';
import ResultCard from '../components/ResultCard';

export default function SimpleCalculator() {
  const [settings, setSettings] = useState(null);
  
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [capitalType, setCapitalType] = useState('lot'); // 'lot' or 'usd'
  const [capitalValue, setCapitalValue] = useState('');

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
                label="Buy Price (USD)"
                id="buyPrice"
                type="number"
                step="0.0001"
                placeholder="0.00"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                prefix="$"
              />

              <InputField
                label="Sell Price (USD)"
                id="sellPrice"
                type="number"
                step="0.0001"
                placeholder="0.00"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                prefix="$"
              />

              <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5 w-full">
                  <label htmlFor="capitalType" className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                    Capital Type
                  </label>
                  <select
                    id="capitalType"
                    value={capitalType}
                    onChange={(e) => setCapitalType(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl py-2.5 px-4 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="lot">Lot (1 Lot = 100 Shares)</option>
                    <option value="usd">USD ($)</option>
                  </select>
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
