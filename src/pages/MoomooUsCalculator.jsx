import React, { useState, useEffect } from 'react';
import { getSettings, saveTrade, getLastSavedTrade } from '../utils/storage';
import { calculateMoomooUsTrade, calculateMoomooUsTarget, calculateMoomooUsTradeAtPrice } from '../calculators/moomooUsCalculator';
import { formatCurrency, formatPercent, formatUsQuantity } from '../utils/formatters';
import SectionCard from '../components/SectionCard';
import InputField from '../components/InputField';
import ResultCard from '../components/ResultCard';
import MarketTabs from '../components/MarketTabs';
import { Calculator, RotateCcw, Save, Copy, Check, AlertTriangle, ArrowUpRight, DollarSign, Info, ChevronDown, ChevronUp, History, Loader2, TrendingUp } from 'lucide-react';
import { fetchYahooLastPrice } from '../services/quoteService';

/**
 * MooMoo US Calculator page with Planning & Contract Note modes and What-If scenarios.
 */
export default function MoomooUsCalculator() {
  const [settings, setSettings] = useState(null);
  
  // Modes: 'planning' or 'contract'
  const [calculationMode, setCalculationMode] = useState('planning');
  
  // Fee Mode: 'auto' or 'manual'
  const [feeMode, setFeeMode] = useState('auto');
  const [isFeesCollapsed, setIsFeesCollapsed] = useState(true);

  // Planning Mode Inputs
  const [ticker, setTicker] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyFx, setBuyFx] = useState('');
  const [sellFx, setSellFx] = useState('');
  const [useSameFx, setUseSameFx] = useState(true);
  
  // Fees (Always Absolute USD values on this page)
  const [buyCommission, setBuyCommission] = useState('0');
  const [buyPlatformFee, setBuyPlatformFee] = useState('0');
  const [buySettlementFee, setBuySettlementFee] = useState('0');
  const [otherBuyFee, setOtherBuyFee] = useState('0');
  
  const [sellCommission, setSellCommission] = useState('0');
  const [sellPlatformFee, setSellPlatformFee] = useState('0');
  const [sellSettlementFee, setSellSettlementFee] = useState('0');
  const [secFee, setSecFee] = useState('0');
  const [tafFee, setTAFFee] = useState('0');
  const [catFee, setCatFee] = useState('0');
  const [otherSellFee, setOtherSellFee] = useState('0');

  // Contract Note Mode Inputs
  const [contractTicker, setContractTicker] = useState('');
  const [contractBuyCost, setContractBuyCost] = useState('');
  const [contractSellProceeds, setContractSellProceeds] = useState('');
  const [contractNotes, setContractNotes] = useState('');

  // Target Planner States
  const [targetMode, setTargetMode] = useState('profit'); // 'profit', 'roi', 'cash'
  const [targetProfit, setTargetProfit] = useState('');
  const [targetCurrency, setTargetCurrency] = useState('USD');
  const [targetRoiPercent, setTargetRoiPercent] = useState('');

  // UI States
  const [errors, setErrors] = useState({});
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadSuccess, setLoadSuccess] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);

  // Live Quote States
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [quoteSource, setQuoteSource] = useState(null);
  const [quoteFetchedAt, setQuoteFetchedAt] = useState(null);
  const [quotePriceUsed, setQuotePriceUsed] = useState(null);
  const [quoteSymbol, setQuoteSymbol] = useState(null);
  const [quoteCurrency, setQuoteCurrency] = useState(null);
  const [sellPriceWasFetched, setSellPriceWasFetched] = useState(false);
  const [quoteManualEdited, setQuoteManualEdited] = useState(false);

  const handleFetchLastPrice = async () => {
    const symbolToFetch = (calculationMode === 'planning' ? ticker : contractTicker).trim();
    if (!symbolToFetch) return;

    setQuoteLoading(true);
    setQuoteError(null);

    const res = await fetchYahooLastPrice(symbolToFetch);
    setQuoteLoading(false);

    if (res.ok) {
      setSellPrice(res.price.toString());
      setQuoteSource(res.source);
      setQuoteFetchedAt(res.fetchedAt);
      setQuotePriceUsed(res.price);
      setQuoteSymbol(res.symbol);
      setQuoteCurrency(res.currency);
      setSellPriceWasFetched(true);
      setQuoteManualEdited(false);
    } else {
      setQuoteError(res.error);
    }
  };

  // Load defaults on mount
  useEffect(() => {
    const userSettings = getSettings();
    setSettings(userSettings);
    
    // Set exchange rates
    setBuyFx(userSettings.buyFxRate.toString());
    setSellFx(userSettings.sellFxRate.toString());
    
    // Check if defaults presets exist to determine default fees collapse
    const usPresets = userSettings.moomooUs;
    const hasActivePresets = Object.values(usPresets).some(v => v > 0);
    setIsFeesCollapsed(!hasActivePresets);
  }, []);

  // Auto Estimate Fees Calculation
  useEffect(() => {
    if (feeMode === 'auto' && settings && calculationMode === 'planning') {
      const qty = parseFloat(quantity) || 0;
      const sPrice = parseFloat(sellPrice) || 0;
      const usPresets = settings.moomooUs;
      
      setBuyCommission(usPresets.buyCommission.toString());
      setBuyPlatformFee(usPresets.buyPlatformFee.toString());
      // Settlement is per share
      setBuySettlementFee((usPresets.buySettlementFee * qty).toFixed(2));
      setOtherBuyFee(usPresets.otherBuyFee.toString());
      
      setSellCommission(usPresets.sellCommission.toString());
      setSellPlatformFee(usPresets.sellPlatformFee.toString());
      setSellSettlementFee((usPresets.sellSettlementFee * qty).toFixed(2));
      // SEC is percentage of sell value
      setSecFee((usPresets.secFee * sPrice * qty).toFixed(4));
      // TAF is per share
      setTAFFee((usPresets.tafFee * qty).toFixed(2));
      setCatFee(usPresets.catFee.toString());
      setOtherSellFee(usPresets.otherSellFee.toString());
    }
  }, [quantity, sellPrice, feeMode, settings, calculationMode]);

  // Validation function
  const validate = (isSubmitting = false) => {
    const newErrors = {};
    
    if (calculationMode === 'planning') {
      const qty = parseFloat(quantity);
      const bPrice = parseFloat(buyPrice);
      const bRate = parseFloat(buyFx);
      const sRate = parseFloat(sellFx);

      if (isNaN(qty) || qty <= 0) newErrors.quantity = 'Quantity must be more than 0';
      if (isNaN(bPrice) || bPrice <= 0) newErrors.buyPrice = 'Buy price must be more than 0';
      if (isNaN(bRate) || bRate <= 0) newErrors.buyFx = 'FX rate must be more than 0';
      if (isNaN(sRate) || sRate <= 0) newErrors.sellFx = 'FX rate must be more than 0';

      const sPrice = parseFloat(sellPrice);
      if (!isSubmitting) {
        if (sellPrice !== '' && (isNaN(sPrice) || sPrice < 0)) {
          newErrors.sellPrice = 'Sell price cannot be negative';
        }
      } else {
        if (isNaN(sPrice) || sPrice <= 0) {
          newErrors.sellPrice = 'Sell price is required for final profit calculations';
        }
      }
    } else {
      // Contract Mode validations
      const buyCost = parseFloat(contractBuyCost);
      const sellProceeds = parseFloat(contractSellProceeds);
      const bRate = parseFloat(buyFx);
      const sRate = parseFloat(sellFx);

      if (isNaN(buyCost) || buyCost <= 0) newErrors.contractBuyCost = 'Total buy cost is required';
      if (isNaN(sellProceeds) || sellProceeds <= 0) newErrors.contractSellProceeds = 'Total sell proceeds is required';
      if (isNaN(bRate) || bRate <= 0) newErrors.buyFx = 'FX rate must be more than 0';
      if (isNaN(sRate) || sRate <= 0) newErrors.sellFx = 'FX rate must be more than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Live trigger validations
  useEffect(() => {
    if (buyPrice || quantity || sellPrice || buyFx || sellFx || contractBuyCost || contractSellProceeds) {
      validate(false);
    }
  }, [buyPrice, quantity, sellPrice, buyFx, sellFx, contractBuyCost, contractSellProceeds, calculationMode]);

  // Form inputs object
  const getInputsObj = () => ({
    buyPrice,
    sellPrice: sellPrice || '0',
    quantity,
    buyFx,
    sellFx,
    buyCommission,
    buyPlatformFee,
    buySettlementFee,
    otherBuyFee,
    sellCommission,
    sellPlatformFee,
    sellSettlementFee,
    secFeeRate: settings ? settings.moomooUs.secFee : 0,
    secFee,
    tafFee,
    catFee,
    otherSellFee,
    targetMode,
    targetProfit,
    targetCurrency,
    targetRoiPercent,
  });

  const inputs = getInputsObj();
  
  // Calculate Results based on calculationMode
  let results;
  if (calculationMode === 'planning') {
    results = calculateMoomooUsTrade(inputs);
  } else {
    // Contract Note calculations
    const costUsd = parseFloat(contractBuyCost) || 0;
    const proceedsUsd = parseFloat(contractSellProceeds) || 0;
    const bFx = parseFloat(buyFx) || 0;
    const sFx = parseFloat(sellFx) || 0;
    
    const netProfitUsd = proceedsUsd - costUsd;
    const buyCostMyr = costUsd * bFx;
    const sellProceedsMyr = proceedsUsd * sFx;
    const netProfitMyr = sellProceedsMyr - buyCostMyr;
    const roiPercent = costUsd > 0 ? (netProfitUsd / costUsd) * 100 : 0;
    
    results = {
      buyValueUsd: costUsd,
      sellValueUsd: proceedsUsd,
      totalBuyCostUsd: costUsd,
      totalSellProceedsUsd: proceedsUsd,
      netProfitUsd,
      buyCostMyr,
      sellProceedsMyr,
      netProfitMyr,
      roiPercent,
      totalFeesUsd: 0, // already factored in contract cost
      breakEvenSellPriceUsd: parseFloat(quantity) > 0 ? costUsd / parseFloat(quantity) : 0,
      totalBuyFeesUsd: 0,
      totalSellFeesUsd: 0
    };
  }

  // Calculate Target Planning
  const targetResults = calculateMoomooUsTarget(inputs, results);

  // Trigger calculations
  const handleCalculate = (e) => {
    e.preventDefault();
    validate(true);
  };

  // Reset inputs
  const handleReset = () => {
    setTicker('');
    setContractTicker('');
    setBuyPrice('');
    setSellPrice('');
    setQuantity('');
    setContractBuyCost('');
    setContractSellProceeds('');
    setContractNotes('');
    
    if (settings) {
      setBuyFx(settings.buyFxRate.toString());
      setSellFx(settings.sellFxRate.toString());
      setFeeMode('auto');
      
      const fees = settings.moomooUs;
      setBuyCommission(fees.buyCommission.toString());
      setBuyPlatformFee(fees.buyPlatformFee.toString());
      setBuySettlementFee('0');
      setOtherBuyFee(fees.otherBuyFee.toString());
      
      setSellCommission(fees.sellCommission.toString());
      setSellPlatformFee(fees.sellPlatformFee.toString());
      setSellSettlementFee('0');
      setSecFee('0');
      setTAFFee('0');
      setCatFee(fees.catFee.toString());
      setOtherSellFee(fees.otherSellFee.toString());
    }
    
    setTargetProfit('');
    setTargetRoiPercent('');
    setNotes('');
    setShowNotesInput(false);
    setErrors({});

    setQuoteLoading(false);
    setQuoteError(null);
    setQuoteSource(null);
    setQuoteFetchedAt(null);
    setQuotePriceUsed(null);
    setQuoteSymbol(null);
    setQuoteCurrency(null);
    setSellPriceWasFetched(false);
    setQuoteManualEdited(false);
  };

  // Reset Fees specifically
  const handleResetFees = () => {
    if (!settings) return;
    const qty = parseFloat(quantity) || 0;
    const sPrice = parseFloat(sellPrice) || 0;
    const usPresets = settings.moomooUs;
    
    setBuyCommission(usPresets.buyCommission.toString());
    setBuyPlatformFee(usPresets.buyPlatformFee.toString());
    setBuySettlementFee((usPresets.buySettlementFee * qty).toFixed(2));
    setOtherBuyFee(usPresets.otherBuyFee.toString());
    
    setSellCommission(usPresets.sellCommission.toString());
    setSellPlatformFee(usPresets.sellPlatformFee.toString());
    setSellSettlementFee((usPresets.sellSettlementFee * qty).toFixed(2));
    setSecFee((usPresets.secFee * sPrice * qty).toFixed(4));
    setTAFFee((usPresets.tafFee * qty).toFixed(2));
    setCatFee(usPresets.catFee.toString());
    setOtherSellFee(usPresets.otherSellFee.toString());
  };

  // Copy Summary to Clipboard
  const handleCopySummary = () => {
    const isVal = validate(true);
    if (!isVal) return;

    let summaryText = '';
    if (calculationMode === 'planning') {
      summaryText = `Ticker: ${ticker.toUpperCase() || 'N/A'}
Mode: Planning Mode (MooMoo US)
Buy: ${formatUsQuantity(quantity)} @ $${parseFloat(buyPrice).toFixed(settings?.priceDecimals ?? 4)}
Sell: ${formatUsQuantity(quantity)} @ $${parseFloat(sellPrice).toFixed(settings?.priceDecimals ?? 4)}
Net Profit: $${results.netProfitUsd.toFixed(2)} / RM${results.netProfitMyr.toFixed(2)}
ROI: ${results.roiPercent.toFixed(2)}%
Break-even: $${results.breakEvenSellPriceUsd.toFixed(settings?.priceDecimals ?? 4)}`;
      if (sellPriceWasFetched) {
        const localTime = new Date(quoteFetchedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        summaryText += `\nSell price source: Yahoo Finance last price fetched at ${localTime}`;
      }
    } else {
      summaryText = `Ticker: ${contractTicker.toUpperCase() || 'N/A'}
Mode: Contract Note Verification (MooMoo US)
Buy Cost: $${parseFloat(contractBuyCost).toFixed(2)}
Sell Proceeds: $${parseFloat(contractSellProceeds).toFixed(2)}
Net Profit: $${results.netProfitUsd.toFixed(2)} / RM${results.netProfitMyr.toFixed(2)}
ROI: ${results.roiPercent.toFixed(2)}%`;
    }

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // Load last saved trade
  const handleLoadLastTrade = () => {
    const lastTrade = getLastSavedTrade('US');
    if (lastTrade) {
      setCalculationMode('planning'); // Load into planning mode
      setTicker(lastTrade.ticker);
      setBuyPrice(lastTrade.buyPrice.toString());
      setSellPrice(lastTrade.sellPrice.toString());
      setQuantity(lastTrade.quantity.toString());
      setBuyFx(lastTrade.buyFx.toString());
      setSellFx(lastTrade.sellFx.toString());
      
      setLoadSuccess(true);
      setTimeout(() => setLoadSuccess(false), 2500);
    } else {
      alert('No saved trades found in history for US stock.');
    }
  };

  // Save trade to LocalStorage
  const handleSaveTrade = () => {
    const isVal = validate(true);
    if (!isVal) return;

    if (!showNotesInput) {
      setShowNotesInput(true);
      return;
    }

    const tradeObject = {
      market: 'US',
      broker: 'MooMoo',
      ticker: (calculationMode === 'planning' ? ticker : contractTicker).toUpperCase() || 'US-STOCK',
      buyPrice: calculationMode === 'planning' ? parseFloat(buyPrice) : parseFloat(contractBuyCost) / (parseFloat(quantity) || 1),
      sellPrice: calculationMode === 'planning' ? parseFloat(sellPrice) : parseFloat(contractSellProceeds) / (parseFloat(quantity) || 1),
      quantity: parseFloat(quantity) || 1,
      buyFx: parseFloat(buyFx),
      sellFx: parseFloat(sellFx),
      totalFeesUsd: results.totalBuyCostUsd - results.buyValueUsd + results.sellValueUsd - results.totalSellProceedsUsd,
      netProfitUsd: results.netProfitUsd,
      netProfitMyr: results.netProfitMyr,
      roiPercent: results.roiPercent,
      breakEvenSellPriceUsd: results.breakEvenSellPriceUsd,
      notes: calculationMode === 'planning' ? notes : `${contractNotes} (Contract Verification)`,
      quoteSource: sellPriceWasFetched ? quoteSource : null,
      quoteFetchedAt: sellPriceWasFetched ? quoteFetchedAt : null,
      quotePriceUsed: sellPriceWasFetched ? quotePriceUsed : null,
      quoteSymbol: sellPriceWasFetched ? quoteSymbol : null,
      sellPriceWasFetched: sellPriceWasFetched,
    };

    const saved = saveTrade(tradeObject);
    if (saved) {
      setSaveSuccess(true);
      setShowNotesInput(false);
      setNotes('');
      setContractNotes('');
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  // Styling helper for net profit indicator
  const getProfitType = () => {
    if (results.netProfitUsd > 0) return 'profit';
    if (results.netProfitUsd < 0) return 'loss';
    return 'neutral';
  };

  const getTargetGapMessage = () => {
    if (parseFloat(sellPrice) > 0 && targetResults.requiredSellPriceUsd > 0) {
      if (targetResults.meetsTarget) {
        return {
          text: 'Target achieved at current sell price.',
          type: 'success'
        };
      } else {
        const gap = targetResults.targetGapUsd;
        return {
          text: `You need $${gap.toFixed(settings?.priceDecimals ?? 4)} more per share to hit your target.`,
          type: 'warning'
        };
      }
    }
    return null;
  };

  const gapMsg = getTargetGapMessage();

  // Plain English summary sentence generator
  const getSummarySentence = () => {
    const qty = parseFloat(quantity) || 0;
    const tick = (calculationMode === 'planning' ? ticker : contractTicker) ? (calculationMode === 'planning' ? ticker : contractTicker).toUpperCase() : 'your stock';
    const bPrice = calculationMode === 'planning' ? (parseFloat(buyPrice) || 0) : (parseFloat(contractBuyCost) || 0) / (qty || 1);
    const sPrice = calculationMode === 'planning' ? (parseFloat(sellPrice) || 0) : (parseFloat(contractSellProceeds) || 0) / (qty || 1);
    const profitUsd = results.netProfitUsd || 0;
    const profitMyr = results.netProfitMyr || 0;
    const roi = results.roiPercent || 0;
    
    const formattedBPrice = formatCurrency(bPrice, 'USD', settings?.priceDecimals ?? 4);
    const formattedSPrice = formatCurrency(sPrice, 'USD', settings?.priceDecimals ?? 4);
    const formattedProfitUsd = formatCurrency(Math.abs(profitUsd), 'USD', 2);
    const formattedProfitMyr = formatCurrency(Math.abs(profitMyr), 'MYR', 2);
    
    if (calculationMode === 'contract') {
      const stateWord = profitUsd >= 0 ? 'net profit' : 'net loss';
      return `Contract Note Verification: You verified a trade of ${tick} (Qty: ${formatUsQuantity(qty) || 'N/A'}). Based on total buy cost of ${formatCurrency(results.totalBuyCostUsd, 'USD', 2)} and total sell proceeds of ${formatCurrency(results.totalSellProceedsUsd, 'USD', 2)}, you realized a ${stateWord} of ${formattedProfitUsd} (RM ${formattedProfitMyr}) representing a return of ${roi.toFixed(2)}%.`;
    }

    if (sPrice <= 0) {
      return `You are planning to buy ${formatUsQuantity(qty)} shares of ${tick} at ${formattedBPrice} for a total capital outlay of ${formatCurrency(results.totalBuyCostUsd, 'USD', 2)} (including ${formatCurrency(results.totalBuyFeesUsd, 'USD', 2)} in buy-side fees). Your estimated break-even selling price is ${formatCurrency(results.breakEvenSellPriceUsd, 'USD', settings?.priceDecimals || 4)} to recover transaction costs.`;
    }
    
    const actionWord = profitUsd >= 0 ? 'net profit' : 'net loss';
    const profitStatement = profitUsd >= 0 
      ? `made a ${actionWord} of ${formattedProfitUsd} (RM ${formattedProfitMyr})`
      : `incurred a ${actionWord} of ${formattedProfitUsd} (RM ${formattedProfitMyr})`;
    let sentence = `You bought ${formatUsQuantity(qty)} shares of ${tick} at ${formattedBPrice} and sold them at ${formattedSPrice}. After accounting for ${formatCurrency(results.totalFeesUsd, 'USD', 2)} in total broker fees, you ${profitStatement}, representing a return of ${roi.toFixed(2)}% on your initial outlay.`;
    if (sellPriceWasFetched) {
      sentence += ` Sell price uses the last price fetched from Yahoo Finance.`;
    }
    return sentence;
  };

  // What-If Sell Scenarios Calculation
  const getWhatIfScenarios = () => {
    if (calculationMode !== 'planning') return [];
    const basePrice = parseFloat(sellPrice) > 0 ? parseFloat(sellPrice) : parseFloat(buyPrice) || 0;
    if (basePrice <= 0) return [];
    
    return [-0.05, -0.02, 0, 0.02, 0.05].map(pct => {
      const price = basePrice * (1 + pct);
      const scnResults = calculateMoomooUsTradeAtPrice(price, inputs);
      return {
        pct: pct * 100,
        price,
        results: scnResults
      };
    });
  };

  const whatIfScenarios = getWhatIfScenarios();

  return (
    <div className="space-y-6">
      <MarketTabs />
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center space-x-2">
            <span>MooMoo US Stock Calculator</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Calculate stock trading results, currency adjustments, and required sell targets for US stock transactions.
          </p>
        </div>

        {/* Calculation Mode Switcher */}
        <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-900 shadow-inner w-full md:w-auto shrink-0 select-none">
          <button
            type="button"
            onClick={() => setCalculationMode('planning')}
            className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              calculationMode === 'planning'
                ? 'bg-slate-900 border border-slate-800 text-emerald-450 shadow-md shadow-emerald-500/5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Planning Mode
          </button>
          <button
            type="button"
            onClick={() => setCalculationMode('contract')}
            className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              calculationMode === 'contract'
                ? 'bg-slate-900 border border-slate-800 text-emerald-450 shadow-md shadow-emerald-500/5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Contract Note Mode
          </button>
        </div>
      </div>

      {/* Toggle Helper Explanation */}
      <div className="text-[11px] text-slate-400 leading-normal bg-slate-900/20 border border-slate-900 p-3 px-4 rounded-xl flex items-start space-x-2">
        <Info className="w-4 h-4 text-slate-550 shrink-0 mt-0.5" />
        <span>
          Planning Mode estimates profit before selling. Contract Note Mode uses actual broker totals from your completed trade or broker statement.
        </span>
      </div>

      {saveSuccess && (
        <div className="flex items-center space-x-2 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-semibold animate-in fade-in duration-200">
          <Check className="w-4 h-4 shrink-0" />
          <span>Trade successfully saved to LocalStorage! You can view it under the Saved Trades tab.</span>
        </div>
      )}

      {loadSuccess && (
        <div className="flex items-center space-x-2 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-semibold animate-in fade-in duration-200">
          <History className="w-4 h-4 shrink-0" />
          <span>Last saved trade loaded into parameters successfully!</span>
        </div>
      )}

      {/* Calculator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column - Input Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleCalculate} className="space-y-6">
            
            {/* Planning Mode Inputs */}
            {calculationMode === 'planning' ? (
              <SectionCard title="Basic Trade Details" subtitle="Required parameters for stock trading.">
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
                    error={errors.buyPrice}
                    prefix="$"
                    tooltip="The purchase price paid per share in US Dollars."
                  />
                  
                  <div className="flex flex-col space-y-1.5 w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 mb-0.5">
                        <label htmlFor="sellPrice" className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                          Sell Price (USD)
                        </label>
                        <div className="group relative flex items-center">
                          <span className="cursor-help text-slate-500 hover:text-slate-350 transition-colors">
                            <Info className="w-3.5 h-3.5" />
                          </span>
                          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-52 p-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-300 leading-normal shadow-2xl backdrop-blur-md normal-case font-normal select-none pointer-events-none">
                            The selling price per share in US Dollars. You can type 0 to use the Target Planner to solve for this.
                          </div>
                        </div>
                      </div>
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
                          className={`w-full bg-slate-950/60 border ${
                            errors.sellPrice ? 'border-red-500/80 focus:border-red-500' : 'border-slate-800/80 hover:border-slate-700/60 focus:border-emerald-500/80'
                          } rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 ${
                            errors.sellPrice ? 'focus:ring-red-500' : 'focus:ring-emerald-500'
                          } transition-all duration-200`}
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
                    {errors.sellPrice && <span className="text-xs text-red-400 mt-0.5">{errors.sellPrice}</span>}
                    
                    {/* Live Fetch status / manual override / errors alerts */}
                    {quoteError && (
                      <span className="text-[10px] text-red-400 mt-1 leading-tight block">
                        ⚠️ Could not fetch last price. You can still enter sell price manually. ({quoteError})
                      </span>
                    )}
                    {sellPriceWasFetched && !quoteError && (
                      <span className="text-[10px] text-emerald-450 mt-1 leading-tight block font-medium">
                        ✓ Last price from Yahoo Finance: ${quotePriceUsed?.toFixed(4)} • {quoteSymbol} • fetched {new Date(quoteFetchedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {quoteManualEdited && !sellPriceWasFetched && (
                      <span className="text-[10px] text-slate-500 mt-1 leading-tight block font-medium">
                        ✏️ Manual sell price entered.
                      </span>
                    )}
                    {!quoteError && !sellPriceWasFetched && !quoteManualEdited && (
                      <span className="text-[10px] text-slate-500 mt-1 leading-tight block">
                        Leave 0 if planning target sell price
                      </span>
                    )}
                    
                    {sellPriceWasFetched && quoteCurrency && quoteCurrency.toUpperCase() !== 'USD' && (
                      <span className="text-[10px] text-amber-400 mt-1 leading-tight block font-medium">
                        ⚠️ Yahoo returned currency {quoteCurrency}. Please verify before using this price.
                      </span>
                    )}
                  </div>
                  
                  <InputField
                    label="Quantity"
                    id="quantity"
                    type="number"
                    step="any"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    error={errors.quantity}
                    prefix="#"
                    tooltip="The total volume of shares purchased and sold."
                  />

                  {/* FX Rates Group */}
                  <div className="sm:col-span-2 flex flex-col space-y-2 border-t border-slate-900 pt-3 mt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                        Exchange Rates (USD/MYR)
                      </label>
                      <label className="flex items-center space-x-2 text-xs text-slate-450 hover:text-slate-200 cursor-pointer transition-colors select-none">
                        <input
                          type="checkbox"
                          checked={useSameFx}
                          onChange={(e) => {
                            setUseSameFx(e.target.checked);
                            if (e.target.checked) {
                              setSellFx(buyFx);
                            }
                          }}
                          className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 bg-slate-950 w-3.5 h-3.5"
                        />
                        <span>Use same FX for buy and sell</span>
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <InputField
                        label="Buy FX Rate"
                        id="buyFx"
                        type="number"
                        step="0.0001"
                        placeholder="4.40"
                        value={buyFx}
                        onChange={(e) => {
                          setBuyFx(e.target.value);
                          if (useSameFx) {
                            setSellFx(e.target.value);
                          }
                        }}
                        error={errors.buyFx}
                        prefix="RM"
                        helperText="USD to MYR"
                        tooltip="The conversion exchange rate from USD to MYR when you bought the shares."
                      />
                      <InputField
                        label="Sell FX Rate"
                        id="sellFx"
                        type="number"
                        step="0.0001"
                        placeholder="4.40"
                        value={sellFx}
                        onChange={(e) => setSellFx(e.target.value)}
                        error={errors.sellFx}
                        prefix="RM"
                        helperText="USD to MYR"
                        disabled={useSameFx}
                        tooltip="The conversion exchange rate from USD to MYR when you sold the shares."
                      />
                    </div>
                  </div>
                </div>
              </SectionCard>
            ) : (
              /* Contract Note Mode Inputs */
              <SectionCard title="Contract Note Verification" subtitle="Enter values exactly from your broker contract note to audit returns.">
                <div className="mb-4 p-3.5 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-xl text-[11px] text-emerald-400 leading-relaxed flex items-start space-x-2">
                  <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Use this mode after a trade is completed. Enter the total buy cost and total sell proceeds shown in your broker contract note. Fees are already included in those totals.
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Ticker Symbol"
                    id="contractTicker"
                    placeholder="e.g. AAPL"
                    value={contractTicker}
                    onChange={(e) => setContractTicker(e.target.value)}
                    className="sm:col-span-2"
                  />
                  
                  <InputField
                    label="Total Buy Cost (USD)"
                    id="contractBuyCost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={contractBuyCost}
                    onChange={(e) => setContractBuyCost(e.target.value)}
                    error={errors.contractBuyCost}
                    prefix="$"
                    tooltip="The total settlement amount debited from your account (shares value + brokerage fees)."
                  />
                  
                  <InputField
                    label="Total Sell Proceeds (USD)"
                    id="contractSellProceeds"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={contractSellProceeds}
                    onChange={(e) => setContractSellProceeds(e.target.value)}
                    error={errors.contractSellProceeds}
                    prefix="$"
                    tooltip="The total settlement amount credited to your account (shares value - brokerage fees)."
                  />
                  
                  <InputField
                    label="Quantity (Optional)"
                    id="quantity"
                    type="number"
                    step="any"
                    placeholder="e.g. 10"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    prefix="#"
                    tooltip="Enter quantity to calculate average prices and break-even targets."
                  />

                  <div className="grid grid-cols-2 gap-3 sm:col-span-2 border-t border-slate-900 pt-3">
                    <InputField
                      label="Buy FX Rate"
                      id="buyFx"
                      type="number"
                      step="0.0001"
                      placeholder="4.40"
                      value={buyFx}
                      onChange={(e) => setBuyFx(e.target.value)}
                      error={errors.buyFx}
                      prefix="RM"
                      helperText="USD to MYR"
                    />
                    <InputField
                      label="Sell FX Rate"
                      id="sellFx"
                      type="number"
                      step="0.0001"
                      placeholder="4.40"
                      value={sellFx}
                      onChange={(e) => setSellFx(e.target.value)}
                      error={errors.sellFx}
                      prefix="RM"
                      helperText="USD to MYR"
                    />
                  </div>

                  <InputField
                    label="Contract Notes / Remarks"
                    id="contractNotes"
                    placeholder="e.g. Verified trade from May Statement"
                    value={contractNotes}
                    onChange={(e) => setContractNotes(e.target.value)}
                    className="sm:col-span-2"
                  />
                </div>
              </SectionCard>
            )}

            {/* Collapsible Broker Transaction Fees Section (Planning Mode only) */}
            {calculationMode === 'planning' && (
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/35 backdrop-blur-md overflow-hidden transition-all duration-300">
                {/* Header Collapsible Trigger */}
                <div 
                  onClick={() => setIsFeesCollapsed(!isFeesCollapsed)}
                  className="flex items-center justify-between p-5 md:p-6 cursor-pointer border-b border-slate-900/60 select-none hover:bg-slate-900/10"
                >
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight flex items-center">
                      <span>Broker Transaction Fees</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {isFeesCollapsed 
                        ? `Estimated total fees: ${formatCurrency(results.totalFeesUsd, 'USD', 2)} (Click to expand)`
                        : 'Charges applied on buying and selling transactions.'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-850">
                      {feeMode === 'auto' ? 'Auto Estimate' : 'Manual'}
                    </span>
                    {isFeesCollapsed ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronUp className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>

                {/* Collapsible Body */}
                {!isFeesCollapsed && (
                  <div className="p-5 md:p-6 space-y-6 animate-in slide-in-from-top-3 duration-200">
                    {/* Fee Toggle Row */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                      <div className="flex items-center space-x-2 text-xs select-none">
                        <span className="font-semibold text-slate-400">Calculation Method:</span>
                        <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-850">
                          <button
                            type="button"
                            onClick={() => setFeeMode('auto')}
                            className={`py-1 px-3 rounded-md text-[10px] font-extrabold transition-all cursor-pointer ${
                              feeMode === 'auto'
                                ? 'bg-slate-950 border border-slate-850 text-emerald-450'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Auto Estimate
                          </button>
                          <button
                            type="button"
                            onClick={() => setFeeMode('manual')}
                            className={`py-1 px-3 rounded-md text-[10px] font-extrabold transition-all cursor-pointer ${
                              feeMode === 'manual'
                                ? 'bg-slate-950 border border-slate-850 text-emerald-450'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Manual Fees
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={handleResetFees}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all cursor-pointer w-full sm:w-auto justify-center select-none"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset to presets</span>
                        </button>
                      </div>
                    </div>

                    {feeMode === 'auto' && (
                      <div className="p-3 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-xl text-[10px] text-emerald-400 leading-normal flex items-start space-x-2">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Auto Estimator is active. Fees are dynamically calculated per-share and percentage-value based on presets in settings. (Note: Labeled values are Read-Only estimations).</span>
                      </div>
                    )}

                    <div className="space-y-6">
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-550 mb-3 border-b border-slate-900/60 pb-1">
                          Buy Side Fees (USD)
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <InputField
                            label="Commission"
                            id="buyCommission"
                            type="number"
                            step="0.01"
                            value={buyCommission}
                            onChange={(e) => setBuyCommission(e.target.value)}
                            prefix="$"
                            disabled={feeMode === 'auto'}
                            tooltip="The flat fee commission charged by MooMoo US on purchasing stocks."
                          />
                          <InputField
                            label="Platform"
                            id="buyPlatformFee"
                            type="number"
                            step="0.01"
                            value={buyPlatformFee}
                            onChange={(e) => setBuyPlatformFee(e.target.value)}
                            prefix="$"
                            disabled={feeMode === 'auto'}
                            tooltip="The platform services fee charged by MooMoo US on purchase."
                          />
                          <InputField
                            label="Settlement"
                            id="buySettlementFee"
                            type="number"
                            step="0.0001"
                            value={buySettlementFee}
                            onChange={(e) => setBuySettlementFee(e.target.value)}
                            prefix="$"
                            helperText={feeMode === 'auto' ? 'Est. Total' : 'Absolute USD'}
                            disabled={feeMode === 'auto'}
                            tooltip="Buy-side settlement fee. Auto mode estimates this as (preset * quantity)."
                          />
                          <InputField
                            label="Other Fee"
                            id="otherBuyFee"
                            type="number"
                            step="0.01"
                            value={otherBuyFee}
                            onChange={(e) => setOtherBuyFee(e.target.value)}
                            prefix="$"
                            disabled={feeMode === 'auto'}
                            tooltip="Specify any other custom fees paid on the buy side."
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-550 mb-3 border-b border-slate-900/60 pb-1">
                          Sell Side Fees (USD)
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <InputField
                            label="Commission"
                            id="sellCommission"
                            type="number"
                            step="0.01"
                            value={sellCommission}
                            onChange={(e) => setSellCommission(e.target.value)}
                            prefix="$"
                            disabled={feeMode === 'auto'}
                            tooltip="The flat fee commission charged by MooMoo US on selling stocks."
                          />
                          <InputField
                            label="Platform"
                            id="sellPlatformFee"
                            type="number"
                            step="0.01"
                            value={sellPlatformFee}
                            onChange={(e) => setSellPlatformFee(e.target.value)}
                            prefix="$"
                            disabled={feeMode === 'auto'}
                            tooltip="The platform services fee charged by MooMoo US on sales."
                          />
                          <InputField
                            label="Settlement"
                            id="sellSettlementFee"
                            type="number"
                            step="0.0001"
                            value={sellSettlementFee}
                            onChange={(e) => setSellSettlementFee(e.target.value)}
                            prefix="$"
                            helperText={feeMode === 'auto' ? 'Est. Total' : 'Absolute USD'}
                            disabled={feeMode === 'auto'}
                            tooltip="Sell-side settlement fee. Auto mode estimates this as (preset * quantity)."
                          />
                          <InputField
                            label="SEC Fee"
                            id="secFee"
                            type="number"
                            step="0.000001"
                            value={secFee}
                            onChange={(e) => setSecFee(e.target.value)}
                            prefix="$"
                            helperText={feeMode === 'auto' ? 'Est. Total' : 'Absolute USD'}
                            disabled={feeMode === 'auto'}
                            tooltip="The SEC transaction fee. Auto mode calculates this as (preset rate * sellPrice * quantity)."
                          />
                          <InputField
                            label="TAF / FINRA"
                            id="tafFee"
                            type="number"
                            step="0.00001"
                            value={tafFee}
                            onChange={(e) => setTAFFee(e.target.value)}
                            prefix="$"
                            helperText={feeMode === 'auto' ? 'Est. Total' : 'Absolute USD'}
                            disabled={feeMode === 'auto'}
                            tooltip="Trading Activity Fee (TAF). Auto mode calculates this as (preset rate * quantity)."
                          />
                          <InputField
                            label="CAT Fee"
                            id="catFee"
                            type="number"
                            step="0.0001"
                            value={catFee}
                            onChange={(e) => setCatFee(e.target.value)}
                            prefix="$"
                            disabled={feeMode === 'auto'}
                            tooltip="The Consolidated Audit Trail (CAT) transaction fee applied by regulators."
                          />
                          <InputField
                            label="Other Fee"
                            id="otherSellFee"
                            type="number"
                            step="0.01"
                            value={otherSellFee}
                            onChange={(e) => setOtherSellFee(e.target.value)}
                            prefix="$"
                            className="col-span-2"
                            disabled={feeMode === 'auto'}
                            tooltip="Specify any other custom fees paid on the sell side."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Target Planner Section (Planning Mode only) */}
            {calculationMode === 'planning' && (
              <SectionCard 
                title="Target Planner" 
                subtitle="Know what price you need to sell at to hit your goal."
                className="border-emerald-500/10 bg-emerald-500/[0.02]"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <label htmlFor="targetMode" className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                        Target Mode
                      </label>
                      <select
                        id="targetMode"
                        value={targetMode}
                        onChange={(e) => setTargetMode(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
                      >
                        <option value="profit">Desired Net Profit</option>
                        <option value="roi">Desired ROI %</option>
                        <option value="cash">Desired Final Cash</option>
                      </select>
                    </div>

                    {targetMode === 'profit' || targetMode === 'cash' ? (
                      <>
                        <InputField
                          label={targetMode === 'profit' ? 'Target Profit' : 'Desired Cash'}
                          id="targetProfit"
                          type="number"
                          placeholder="0.00"
                          value={targetProfit}
                          onChange={(e) => setTargetProfit(e.target.value)}
                          prefix={targetCurrency === 'USD' ? '$' : 'RM'}
                          tooltip={targetMode === 'profit' ? "Desired net profit amount." : "The total cash value you want returned to your bank after sell fees."}
                        />
                        <div className="flex flex-col space-y-1.5">
                          <label htmlFor="targetCurrency" className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                            Target Currency
                          </label>
                          <select
                            id="targetCurrency"
                            value={targetCurrency}
                            onChange={(e) => setTargetCurrency(e.target.value)}
                            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
                          >
                            <option value="USD">USD</option>
                            <option value="MYR">MYR</option>
                          </select>
                        </div>
                      </>
                    ) : (
                      <InputField
                        label="Target ROI %"
                        id="targetRoiPercent"
                        type="number"
                        placeholder="e.g. 10"
                        value={targetRoiPercent}
                        onChange={(e) => setTargetRoiPercent(e.target.value)}
                        suffix="%"
                        className="sm:col-span-2"
                        tooltip="The target percentage return on your initial capital outlay."
                      />
                    )}
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Form actions (Trader Workflow Improvements) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3">
              <button
                type="submit"
                className="flex items-center justify-center space-x-1.5 py-3 px-4 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer select-none text-xs"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Calculate</span>
              </button>

              <button
                type="button"
                onClick={handleSaveTrade}
                disabled={calculationMode === 'planning' ? (!buyPrice || !quantity || !sellPrice) : (!contractBuyCost || !contractSellProceeds)}
                className="flex items-center justify-center space-x-1.5 py-3 px-4 rounded-xl font-bold bg-slate-900 border border-slate-800 text-emerald-450 hover:text-emerald-350 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{showNotesInput ? 'Confirm Save' : 'Save Trade'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopySummary}
                disabled={calculationMode === 'planning' ? (!buyPrice || !quantity) : (!contractBuyCost || !contractSellProceeds)}
                className="flex items-center justify-center space-x-1.5 py-3 px-4 rounded-xl font-semibold border border-slate-850 bg-slate-950 text-slate-300 hover:text-slate-100 hover:bg-slate-900 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none text-xs"
              >
                {copySuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copySuccess ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center justify-center space-x-1.5 py-3 px-4 rounded-xl font-semibold border border-slate-850 bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-900 active:scale-[0.98] transition-all cursor-pointer select-none text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleLoadLastTrade}
                className="col-span-2 sm:col-span-1 flex items-center justify-center space-x-1.5 py-3 px-4 rounded-xl font-semibold border border-slate-850 bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-900 active:scale-[0.98] transition-all cursor-pointer select-none text-xs"
              >
                <History className="w-3.5 h-3.5" />
                <span>Load Last</span>
              </button>
            </div>

            {/* Inline Notes Field when Saving */}
            {showNotesInput && (
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3.5 animate-in slide-in-from-top-2 duration-150">
                <InputField
                  label="Add Notes (Optional)"
                  id="tradeNotes"
                  placeholder="e.g. Bought breakout"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowNotesInput(false)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer select-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTrade}
                    className="px-4 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl cursor-pointer select-none"
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Right Column - Results Summary */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
          
          {/* Main Return Card */}
          <SectionCard 
            title="Profit Summary" 
            subtitle={calculationMode === 'planning' ? "Actual performance after deducting USD fees and currency impacts." : "Returns calculated from contract note amounts."}
            headerActions={
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border select-none whitespace-nowrap ${
                getProfitType() === 'profit' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : getProfitType() === 'loss' 
                    ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                    : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                {getProfitType() === 'profit' ? 'Profit' : getProfitType() === 'loss' ? 'Loss' : 'Break-even'}
              </span>
            }
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <ResultCard
                  label="Net Profit (USD)"
                  value={formatCurrency(results.netProfitUsd, 'USD', 2)}
                  type={getProfitType()}
                  size="lg"
                  className="col-span-2"
                />
                
                {settings?.viewCurrency !== 'usd' && (
                  <ResultCard
                    label="Net Profit (MYR)"
                    value={formatCurrency(results.netProfitMyr, 'MYR', 2)}
                    type={getProfitType()}
                    subtitle="FX conversion applied"
                  />
                )}

                <ResultCard
                  label="ROI %"
                  value={formatPercent(results.roiPercent)}
                  type={getProfitType()}
                  subtitle="Return on cost"
                />
              </div>

              {/* Extra Performance Stats */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-400">
                <div className="flex justify-between items-center">
                  <span>Gross Trade Value:</span>
                  <span className="font-mono text-slate-200">{formatCurrency(results.sellValueUsd, 'USD', 2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Capital Outlay:</span>
                  <span className="font-mono text-slate-200">{formatCurrency(results.totalBuyCostUsd, 'USD', 2)}</span>
                </div>
                {calculationMode === 'planning' && (
                  <div className="flex justify-between items-center text-red-450/90">
                    <span>Accumulated Broker Fees:</span>
                    <span className="font-mono">{formatCurrency(results.totalFeesUsd, 'USD', 2)}</span>
                  </div>
                )}
                {parseFloat(quantity) > 0 && (
                  <div className="flex justify-between items-center border-t border-slate-900 pt-2 text-slate-350">
                    <span>Break-Even Sell Price:</span>
                    <span className="font-mono font-bold text-white">
                      {formatCurrency(results.breakEvenSellPriceUsd, 'USD', settings?.priceDecimals || 4)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Target Result Mini Card (Planning Mode Only) */}
          {calculationMode === 'planning' && (
            <SectionCard title="Target Planner Result" className="border-slate-850 bg-slate-900/10">
              {targetResults.requiredSellPriceUsd > 0 && targetProfit ? (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Target Sell Price:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatCurrency(targetResults.requiredSellPriceUsd, 'USD', settings?.priceDecimals || 4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Required Gain %:</span>
                    <span className="font-mono text-slate-200">{formatPercent(targetResults.requiredGainPercent)}</span>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-850 text-[10px]">
                    {gapMsg && (
                      <span className={gapMsg.type === 'success' ? 'text-emerald-450' : 'text-amber-400'}>
                        {gapMsg.type === 'success' ? 'Target achieved at current sell price.' : gapMsg.text}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 leading-normal">
                  No target values entered. Enter target profit, target ROI, or desired cash returned in the Target Planner to solve for target sell price.
                </p>
              )}
            </SectionCard>
          )}

          {/* Trade Summary Box */}
          {((calculationMode === 'planning' && buyPrice && quantity) || (calculationMode === 'contract' && contractBuyCost && contractSellProceeds)) && (
            <SectionCard title="Trade Summary" className="border-slate-850 bg-slate-900/10 animate-in fade-in duration-200">
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {getSummarySentence()}
              </p>
            </SectionCard>
          )}

          {/* What-If Sell Scenario Table (Planning Mode Only) */}
          {calculationMode === 'planning' && whatIfScenarios.length > 0 && (
            <SectionCard title="What-If Sell Scenarios" subtitle="Compare potential returns at different target price movements." className="border-slate-850 bg-slate-900/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px] font-mono">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-500 font-semibold text-[9px] uppercase tracking-wider">
                      <th className="py-2">Scenario</th>
                      <th className="py-2">Price</th>
                      <th className="py-2">Profit USD</th>
                      {settings?.viewCurrency !== 'usd' && <th className="py-2">Profit MYR</th>}
                      <th className="py-2">ROI %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40">
                    {whatIfScenarios.map((scn, i) => {
                      const scnProfitType = scn.results.netProfitUsd > 0 ? 'text-emerald-400' : scn.results.netProfitUsd < 0 ? 'text-red-400' : 'text-slate-400';
                      return (
                        <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-2 text-slate-400">
                            {scn.pct === 0 ? 'Current' : `${scn.pct > 0 ? '+' : ''}${scn.pct.toFixed(0)}%`}
                          </td>
                          <td className="py-2 font-bold text-slate-200">
                            {formatCurrency(scn.price, 'USD', settings?.priceDecimals || 4)}
                          </td>
                          <td className={`py-2 font-bold ${scnProfitType}`}>
                            {formatCurrency(scn.results.netProfitUsd, 'USD', 2)}
                          </td>
                          {settings?.viewCurrency !== 'usd' && (
                            <td className={`py-2 font-bold ${scnProfitType}`}>
                              {formatCurrency(scn.results.netProfitMyr, 'MYR', 2)}
                            </td>
                          )}
                          <td className={`py-2 font-bold ${scnProfitType}`}>
                            {formatPercent(scn.results.roiPercent)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[8px] text-slate-500 mt-2">
                {parseFloat(sellPrice) > 0 
                  ? "* Movements calculated relative to current sell price."
                  : "* No sell price entered. Scenarios calculated relative to buy price."}
              </p>
            </SectionCard>
          )}

          {/* Calculator Helper Info */}
          <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/20 text-slate-500 text-[10px] space-y-1.5">
            <p>💡 Quick Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>MYR profit uses buy FX for buy cost and sell FX for sell proceeds.</li>
              <li>Break-even price includes estimated fees.</li>
              <li>Target sell price is an estimate based on current fee inputs.</li>
              <li className="text-[9px] text-slate-600 mt-1.5 border-t border-slate-900 pt-1.5 list-none uppercase font-semibold tracking-wider">
                * Market data may be delayed or unavailable. Verify with MooMoo before placing trades.
              </li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
