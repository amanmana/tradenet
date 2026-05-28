import React, { useState, useEffect } from 'react';
import { getSettings, saveTrade, getLastSavedTrade } from '../utils/storage';
import { calculateBursaTrade, calculateBursaTarget, calculateBursaTradeAtPrice } from '../calculators/bursaCalculator';
import { formatCurrency, formatPercent } from '../utils/formatters';
import SectionCard from '../components/SectionCard';
import InputField from '../components/InputField';
import ResultCard from '../components/ResultCard';
import MarketTabs from '../components/MarketTabs';
import { Calculator, RotateCcw, Save, Copy, Check, AlertTriangle, ArrowUpRight, Landmark, Info, ChevronDown, ChevronUp, History } from 'lucide-react';

/**
 * Bursa Malaysia Calculator page with Planning & Contract Note modes and What-If scenarios.
 */
export default function BursaCalculator() {
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

  // Fees (Always Absolute MYR values on this page)
  const [buyBrokerage, setBuyBrokerage] = useState('0');
  const [buyClearing, setBuyClearing] = useState('0');
  const [buyStampDuty, setBuyStampDuty] = useState('0');
  const [buySst, setBuySst] = useState('0');
  const [otherBuyFee, setOtherBuyFee] = useState('0');

  const [sellBrokerage, setSellBrokerage] = useState('0');
  const [sellClearing, setSellClearing] = useState('0');
  const [sellStampDuty, setSellStampDuty] = useState('0');
  const [sellSst, setSellSst] = useState('0');
  const [otherSellFee, setOtherSellFee] = useState('0');

  // Contract Note Mode Inputs
  const [contractTicker, setContractTicker] = useState('');
  const [contractBuyCost, setContractBuyCost] = useState('');
  const [contractSellProceeds, setContractSellProceeds] = useState('');
  const [contractNotes, setContractNotes] = useState('');

  // Target Planner States
  const [targetMode, setTargetMode] = useState('profit'); // 'profit', 'roi', 'cash'
  const [targetProfit, setTargetProfit] = useState('');
  const [targetRoiPercent, setTargetRoiPercent] = useState('');

  // UI States
  const [errors, setErrors] = useState({});
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadSuccess, setLoadSuccess] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);

  // Load defaults on mount
  useEffect(() => {
    const userSettings = getSettings();
    setSettings(userSettings);

    const bPresets = userSettings.bursa;
    const hasActivePresets = Object.values(bPresets).some(v => v > 0);
    setIsFeesCollapsed(!hasActivePresets);
  }, []);

  // Auto Estimate Fees
  useEffect(() => {
    if (feeMode === 'auto' && settings && calculationMode === 'planning') {
      const bPresets = settings.bursa;
      
      setBuyBrokerage(bPresets.buyBrokerage.toString());
      setBuyClearing(bPresets.buyClearing.toString());
      setBuyStampDuty(bPresets.buyStampDuty.toString());
      setBuySst(bPresets.buySst.toString());
      setOtherBuyFee(bPresets.otherBuyFee.toString());

      setSellBrokerage(bPresets.sellBrokerage.toString());
      setSellClearing(bPresets.sellClearing.toString());
      setSellStampDuty(bPresets.sellStampDuty.toString());
      setSellSst(bPresets.sellSst.toString());
      setOtherSellFee(bPresets.otherSellFee.toString());
    }
  }, [feeMode, settings, calculationMode]);

  // Validation function
  const validate = (isSubmitting = false) => {
    const newErrors = {};

    if (calculationMode === 'planning') {
      const qty = parseFloat(quantity);
      const bPrice = parseFloat(buyPrice);

      if (isNaN(qty) || qty <= 0) newErrors.quantity = 'Quantity must be more than 0';
      if (isNaN(bPrice) || bPrice <= 0) newErrors.buyPrice = 'Buy price must be more than 0';

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

      if (isNaN(buyCost) || buyCost <= 0) newErrors.contractBuyCost = 'Total buy cost is required';
      if (isNaN(sellProceeds) || sellProceeds <= 0) newErrors.contractSellProceeds = 'Total sell proceeds is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Live trigger validations
  useEffect(() => {
    if (buyPrice || quantity || sellPrice || contractBuyCost || contractSellProceeds) {
      validate(false);
    }
  }, [buyPrice, quantity, sellPrice, contractBuyCost, contractSellProceeds, calculationMode]);

  // Form inputs object
  const getInputsObj = () => ({
    buyPrice,
    sellPrice: sellPrice || '0',
    quantity,
    buyBrokerage,
    buyClearing,
    buyStampDuty,
    buySst,
    otherBuyFee,
    sellBrokerage,
    sellClearing,
    sellStampDuty,
    sellSst,
    otherSellFee,
    targetMode,
    targetProfit,
    targetRoiPercent,
  });

  const inputs = getInputsObj();

  // Calculate results based on calculationMode
  let results;
  if (calculationMode === 'planning') {
    results = calculateBursaTrade(inputs);
  } else {
    // Contract Note Mode
    const costMyr = parseFloat(contractBuyCost) || 0;
    const proceedsMyr = parseFloat(contractSellProceeds) || 0;

    const netProfitMyr = proceedsMyr - costMyr;
    const roiPercent = costMyr > 0 ? (netProfitMyr / costMyr) * 100 : 0;

    results = {
      buyValueMyr: costMyr,
      sellValueMyr: proceedsMyr,
      totalBuyCostMyr: costMyr,
      totalSellProceedsMyr: proceedsMyr,
      netProfitMyr,
      roiPercent,
      totalFeesMyr: 0,
      breakEvenSellPriceMyr: parseFloat(quantity) > 0 ? costMyr / parseFloat(quantity) : 0,
      totalBuyFeesMyr: 0,
      totalSellFeesMyr: 0
    };
  }

  // Calculate target planner outputs
  const targetResults = calculateBursaTarget(inputs, results);

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
      setFeeMode('auto');
      const fees = settings.bursa;
      setBuyBrokerage(fees.buyBrokerage.toString());
      setBuyClearing(fees.buyClearing.toString());
      setBuyStampDuty(fees.buyStampDuty.toString());
      setBuySst(fees.buySst.toString());
      setOtherBuyFee(fees.otherBuyFee.toString());

      setSellBrokerage(fees.sellBrokerage.toString());
      setSellClearing(fees.sellClearing.toString());
      setSellStampDuty(fees.sellStampDuty.toString());
      setSellSst(fees.sellSst.toString());
      setOtherSellFee(fees.otherSellFee.toString());
    }

    setTargetProfit('');
    setTargetRoiPercent('');
    setNotes('');
    setShowNotesInput(false);
    setErrors({});
  };

  // Reset Fees specifically
  const handleResetFees = () => {
    if (!settings) return;
    const bPresets = settings.bursa;
    
    setBuyBrokerage(bPresets.buyBrokerage.toString());
    setBuyClearing(bPresets.buyClearing.toString());
    setBuyStampDuty(bPresets.buyStampDuty.toString());
    setBuySst(bPresets.buySst.toString());
    setOtherBuyFee(bPresets.otherBuyFee.toString());

    setSellBrokerage(bPresets.sellBrokerage.toString());
    setSellClearing(bPresets.sellClearing.toString());
    setSellStampDuty(bPresets.sellStampDuty.toString());
    setSellSst(bPresets.sellSst.toString());
    setOtherSellFee(bPresets.otherSellFee.toString());
  };

  // Copy Summary to Clipboard
  const handleCopySummary = () => {
    const isVal = validate(true);
    if (!isVal) return;

    let summaryText = '';
    if (calculationMode === 'planning') {
      summaryText = `Ticker: ${ticker.toUpperCase() || 'N/A'}
Mode: Planning Mode (Bursa)
Buy: ${quantity} @ RM${parseFloat(buyPrice).toFixed(settings?.priceDecimals || 2)}
Sell: ${quantity} @ RM${parseFloat(sellPrice).toFixed(settings?.priceDecimals || 2)}
Net Profit: RM${results.netProfitMyr.toFixed(2)}
ROI: ${results.roiPercent.toFixed(2)}%
Break-even: RM${results.breakEvenSellPriceMyr.toFixed(settings?.priceDecimals || 2)}`;
    } else {
      summaryText = `Ticker: ${contractTicker.toUpperCase() || 'N/A'}
Mode: Contract Note Verification (Bursa)
Buy Cost: RM${parseFloat(contractBuyCost).toFixed(2)}
Sell Proceeds: RM${parseFloat(contractSellProceeds).toFixed(2)}
Net Profit: RM${results.netProfitMyr.toFixed(2)}
ROI: ${results.roiPercent.toFixed(2)}%`;
    }

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // Load last saved trade
  const handleLoadLastTrade = () => {
    const lastTrade = getLastSavedTrade('BURSA');
    if (lastTrade) {
      setCalculationMode('planning');
      setTicker(lastTrade.ticker);
      setBuyPrice(lastTrade.buyPrice.toString());
      setSellPrice(lastTrade.sellPrice.toString());
      setQuantity(lastTrade.quantity.toString());
      
      setLoadSuccess(true);
      setTimeout(() => setLoadSuccess(false), 2550);
    } else {
      alert('No saved trades found in history for Bursa stock.');
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
      market: 'BURSA',
      broker: 'Bursa Malaysia',
      ticker: (calculationMode === 'planning' ? ticker : contractTicker).toUpperCase() || 'BURSA-STOCK',
      buyPrice: calculationMode === 'planning' ? parseFloat(buyPrice) : parseFloat(contractBuyCost) / (parseFloat(quantity) || 1),
      sellPrice: calculationMode === 'planning' ? parseFloat(sellPrice) : parseFloat(contractSellProceeds) / (parseFloat(quantity) || 1),
      quantity: parseFloat(quantity) || 1,
      totalFeesMyr: results.totalBuyCostMyr - results.buyValueMyr + results.sellValueMyr - results.totalSellProceedsMyr,
      netProfitMyr: results.netProfitMyr,
      roiPercent: results.roiPercent,
      breakEvenSellPriceMyr: results.breakEvenSellPriceMyr,
      notes: calculationMode === 'planning' ? notes : `${contractNotes} (Contract Verification)`,
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

  // Board Lot Helper
  const handleBoardLotMultiplier = (lots) => {
    setQuantity((lots * 100).toString());
  };

  // Styling helper for net profit indicator
  const getProfitType = () => {
    if (results.netProfitMyr > 0) return 'profit';
    if (results.netProfitMyr < 0) return 'loss';
    return 'neutral';
  };

  // Plain English summary sentence generator
  const getSummarySentence = () => {
    const qty = parseFloat(quantity) || 0;
    const tick = (calculationMode === 'planning' ? ticker : contractTicker) ? (calculationMode === 'planning' ? ticker : contractTicker).toUpperCase() : 'your stock';
    const bPrice = calculationMode === 'planning' ? (parseFloat(buyPrice) || 0) : (parseFloat(contractBuyCost) || 0) / (qty || 1);
    const sPrice = calculationMode === 'planning' ? (parseFloat(sellPrice) || 0) : (parseFloat(contractSellProceeds) || 0) / (qty || 1);
    const profitMyr = results.netProfitMyr || 0;
    const feesMyr = results.totalFeesMyr || 0;
    const roi = results.roiPercent || 0;

    const formattedBPrice = formatCurrency(bPrice, 'MYR', settings?.priceDecimals || 2);
    const formattedSPrice = formatCurrency(sPrice, 'MYR', settings?.priceDecimals || 2);
    const formattedProfitMyr = formatCurrency(Math.abs(profitMyr), 'MYR', 2);
    const formattedFeesMyr = formatCurrency(feesMyr, 'MYR', 2);

    if (calculationMode === 'contract') {
      const stateWord = profitMyr >= 0 ? 'net profit' : 'net loss';
      return `Contract Note Verification: You verified a trade of ${tick} (Qty: ${qty.toLocaleString() || 'N/A'}). Based on total buy cost of ${formatCurrency(results.totalBuyCostMyr, 'MYR', 2)} and total sell proceeds of ${formatCurrency(results.totalSellProceedsMyr, 'MYR', 2)}, you realized a ${stateWord} of ${formattedProfitMyr} representing a return of ${roi.toFixed(2)}%.`;
    }

    if (sPrice <= 0) {
      return `You are planning to buy ${qty.toLocaleString()} shares of ${tick} at ${formattedBPrice} for a total capital outlay of ${formatCurrency(results.totalBuyCostMyr, 'MYR', 2)} (including ${formatCurrency(results.totalBuyFeesMyr, 'MYR', 2)} in buy-side fees). Your estimated break-even selling price is ${formatCurrency(results.breakEvenSellPriceMyr, 'MYR', settings?.priceDecimals || 4)} to recover transaction costs.`;
    }

    const actionWord = profitMyr >= 0 ? 'net profit' : 'net loss';
    const profitStatement = profitMyr >= 0 
      ? `made a ${actionWord} of ${formattedProfitMyr}`
      : `incurred a ${actionWord} of ${formattedProfitMyr}`;

    return `You bought ${qty.toLocaleString()} shares of ${tick} at ${formattedBPrice} and sold them at ${formattedSPrice}. After accounting for ${formattedFeesMyr} in total broker fees, you ${profitStatement}, representing a return of ${roi.toFixed(2)}% on your initial outlay.`;
  };

  const getTargetGapMessage = () => {
    if (parseFloat(sellPrice) > 0 && targetResults.requiredSellPriceMyr > 0) {
      if (targetResults.meetsTarget) {
        return {
          text: 'Target achieved at current sell price.',
          type: 'success'
        };
      } else {
        const gap = targetResults.targetGapMyr;
        return {
          text: `You need RM ${gap.toFixed(settings?.priceDecimals || 2)} more per share to hit your target.`,
          type: 'warning'
        };
      }
    }
    return null;
  };

  const gapMsg = getTargetGapMessage();

  // What-If Sell Scenarios Calculation
  const getWhatIfScenarios = () => {
    if (calculationMode !== 'planning') return [];
    const basePrice = parseFloat(sellPrice) > 0 ? parseFloat(sellPrice) : parseFloat(buyPrice) || 0;
    if (basePrice <= 0) return [];

    return [-0.05, -0.02, 0, 0.02, 0.05].map(pct => {
      const price = basePrice * (1 + pct);
      const scnResults = calculateBursaTradeAtPrice(price, inputs);
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
            <span>Bursa Malaysia Stock Calculator</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Calculate stock trading results, transaction charges, and required sell targets for Bursa Malaysia stocks.
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
                    label="Stock Name / Ticker"
                    id="ticker"
                    placeholder="e.g. MAYBANK"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    className="sm:col-span-2"
                    tooltip="The name or ticker symbol of the Malaysian stock (e.g. MAYBANK, PBBANK, TENAGA)."
                  />

                  <InputField
                    label="Buy Price (MYR)"
                    id="buyPrice"
                    type="number"
                    step="0.0001"
                    placeholder="0.00"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    error={errors.buyPrice}
                    prefix="RM"
                    tooltip="The price paid per share in Malaysian Ringgit."
                  />

                  <InputField
                    label="Sell Price (MYR)"
                    id="sellPrice"
                    type="number"
                    step="0.0001"
                    placeholder="0.00"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    error={errors.sellPrice}
                    prefix="RM"
                    helperText="Leave 0 if planning target sell price"
                    tooltip="The selling price per share in Malaysian Ringgit. Leave at 0 to use the Target Planner."
                  />

                  <div className="flex flex-col space-y-1.5 w-full sm:col-span-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="quantity" className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                        Quantity (Shares)
                      </label>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Board Lot Helper</span>
                    </div>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium select-none pointer-events-none text-sm">
                          #
                        </div>
                        <input
                          id="quantity"
                          type="number"
                          step="1"
                          placeholder="0"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          className={`w-full bg-slate-950/60 border ${
                            errors.quantity ? 'border-red-500/80 focus:border-red-500' : 'border-slate-800/80 hover:border-slate-700/60 focus:border-emerald-500/80'
                          } rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 ${
                            errors.quantity ? 'focus:ring-red-500' : 'focus:ring-emerald-500'
                          } transition-all duration-200`}
                        />
                      </div>
                      
                      {/* Lot buttons */}
                      <div className="flex space-x-1 shrink-0">
                        {[1, 5, 10].map(lots => (
                          <button
                            key={lots}
                            type="button"
                            onClick={() => handleBoardLotMultiplier(lots)}
                            className="px-3 rounded-xl border border-slate-800 bg-slate-950 text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all cursor-pointer"
                          >
                            {lots} Lot{lots > 1 ? 's' : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                    {errors.quantity && <span className="text-xs text-red-400 mt-0.5">{errors.quantity}</span>}
                    {!errors.quantity && <span className="text-[10px] text-slate-500 mt-0.5">Note: 1 board lot equals 100 shares on Bursa Malaysia.</span>}
                  </div>
                </div>
              </SectionCard>
            ) : (
              /* Contract Note Mode Inputs */
              <SectionCard title="Contract Note Verification" subtitle="Enter values exactly from your broker contract note to audit returns.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Stock Name / Ticker"
                    id="contractTicker"
                    placeholder="e.g. MAYBANK"
                    value={contractTicker}
                    onChange={(e) => setContractTicker(e.target.value)}
                    className="sm:col-span-2"
                  />

                  <InputField
                    label="Total Buy Cost (MYR)"
                    id="contractBuyCost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={contractBuyCost}
                    onChange={(e) => setContractBuyCost(e.target.value)}
                    error={errors.contractBuyCost}
                    prefix="RM"
                    tooltip="The total settlement amount debited from your account (shares value + brokerage fees)."
                  />

                  <InputField
                    label="Total Sell Proceeds (MYR)"
                    id="contractSellProceeds"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={contractSellProceeds}
                    onChange={(e) => setContractSellProceeds(e.target.value)}
                    error={errors.contractSellProceeds}
                    prefix="RM"
                    tooltip="The total settlement amount credited to your account (shares value - brokerage fees)."
                  />

                  <InputField
                    label="Quantity (Optional)"
                    id="quantity"
                    type="number"
                    step="1"
                    placeholder="e.g. 1000"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    prefix="#"
                    tooltip="Enter quantity to calculate average prices and break-even targets."
                  />

                  <InputField
                    label="Contract Notes / Remarks"
                    id="contractNotes"
                    placeholder="e.g. Verified contract note from broker app"
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
                      <span>Bursa Transaction Fees</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {isFeesCollapsed 
                        ? `Estimated total fees: ${formatCurrency(results.totalFeesMyr, 'MYR', 2)} (Click to expand)`
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
                        <span>Auto Estimator is active. Using saved presets from settings. (Note: Labeled values are Read-Only estimations).</span>
                      </div>
                    )}

                    <div className="space-y-6">
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-550 mb-3 border-b border-slate-900/60 pb-1">
                          Buy Side Fees (MYR)
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                          <InputField
                            label="Brokerage"
                            id="buyBrokerage"
                            type="number"
                            step="0.01"
                            value={buyBrokerage}
                            onChange={(e) => setBuyBrokerage(e.target.value)}
                            prefix="RM"
                            disabled={feeMode === 'auto'}
                            tooltip="The commission fee charged by your local broker on purchase."
                          />
                          <InputField
                            label="Clearing"
                            id="buyClearing"
                            type="number"
                            step="0.01"
                            value={buyClearing}
                            onChange={(e) => setBuyClearing(e.target.value)}
                            prefix="RM"
                            disabled={feeMode === 'auto'}
                            tooltip="The Bursa clearing fee preset from settings."
                          />
                          <InputField
                            label="Stamp Duty"
                            id="buyStampDuty"
                            type="number"
                            step="1"
                            value={buyStampDuty}
                            onChange={(e) => setBuyStampDuty(e.target.value)}
                            prefix="RM"
                            disabled={feeMode === 'auto'}
                            tooltip="Stamp duty charge preset from settings."
                          />
                          <InputField
                            label="SST"
                            id="buySst"
                            type="number"
                            step="0.01"
                            value={buySst}
                            onChange={(e) => setBuySst(e.target.value)}
                            prefix="RM"
                            disabled={feeMode === 'auto'}
                            tooltip="Service tax (6% or 8%) charged on broker commissions."
                          />
                          <InputField
                            label="Other Fee"
                            id="otherBuyFee"
                            type="number"
                            step="0.01"
                            value={otherBuyFee}
                            onChange={(e) => setOtherBuyFee(e.target.value)}
                            prefix="RM"
                            disabled={feeMode === 'auto'}
                            tooltip="Specify any other custom fees paid on the buy side."
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-550 mb-3 border-b border-slate-900/60 pb-1">
                          Sell Side Fees (MYR)
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                          <InputField
                            label="Brokerage"
                            id="sellBrokerage"
                            type="number"
                            step="0.01"
                            value={sellBrokerage}
                            onChange={(e) => setSellBrokerage(e.target.value)}
                            prefix="RM"
                            disabled={feeMode === 'auto'}
                            tooltip="The commission fee charged by your local broker on sales."
                          />
                          <InputField
                            label="Clearing"
                            id="sellClearing"
                            type="number"
                            step="0.01"
                            value={sellClearing}
                            onChange={(e) => setSellClearing(e.target.value)}
                            prefix="RM"
                            disabled={feeMode === 'auto'}
                            tooltip="The Bursa clearing fee preset from settings."
                          />
                          <InputField
                            label="Stamp Duty"
                            id="sellStampDuty"
                            type="number"
                            step="1"
                            value={sellStampDuty}
                            onChange={(e) => setSellStampDuty(e.target.value)}
                            prefix="RM"
                            disabled={feeMode === 'auto'}
                            tooltip="Stamp duty charge preset from settings."
                          />
                          <InputField
                            label="SST"
                            id="sellSst"
                            type="number"
                            step="0.01"
                            value={sellSst}
                            onChange={(e) => setSellSst(e.target.value)}
                            prefix="RM"
                            disabled={feeMode === 'auto'}
                            tooltip="Service tax (6% or 8%) charged on broker commissions."
                          />
                          <InputField
                            label="Other Fee"
                            id="otherSellFee"
                            type="number"
                            step="0.01"
                            value={otherSellFee}
                            onChange={(e) => setOtherSellFee(e.target.value)}
                            prefix="RM"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <InputField
                        label={targetMode === 'profit' ? 'Target Profit (MYR)' : 'Desired Cash (MYR)'}
                        id="targetProfit"
                        type="number"
                        placeholder="0.00"
                        value={targetProfit}
                        onChange={(e) => setTargetProfit(e.target.value)}
                        prefix="RM"
                        tooltip={targetMode === 'profit' ? "Desired net profit amount in MYR." : "The total cash value returned to your bank in MYR."}
                      />
                    ) : (
                      <InputField
                        label="Target ROI %"
                        id="targetRoiPercent"
                        type="number"
                        placeholder="e.g. 10"
                        value={targetRoiPercent}
                        onChange={(e) => setTargetRoiPercent(e.target.value)}
                        suffix="%"
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
                className="flex items-center justify-center space-x-1.5 py-3 px-4 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-955 shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all cursor-pointer select-none text-xs"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Calculate</span>
              </button>

              <button
                type="button"
                onClick={handleSaveTrade}
                disabled={calculationMode === 'planning' ? (!buyPrice || !quantity || !sellPrice) : (!contractBuyCost || !contractSellProceeds)}
                className="flex items-center justify-center space-x-1.5 py-3 px-4 rounded-xl font-bold bg-slate-900 border border-slate-800 text-emerald-455 hover:text-emerald-355 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{showNotesInput ? 'Confirm Save' : 'Save Trade'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopySummary}
                disabled={calculationMode === 'planning' ? (!buyPrice || !quantity) : (!contractBuyCost || !contractSellProceeds)}
                className="flex items-center justify-center space-x-1.5 py-3 px-4 rounded-xl font-semibold border border-slate-850 bg-slate-955 text-slate-300 hover:text-slate-100 hover:bg-slate-900 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none text-xs"
              >
                {copySuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copySuccess ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center justify-center space-x-1.5 py-3 px-4 rounded-xl font-semibold border border-slate-855 bg-slate-955 text-slate-400 hover:text-slate-200 hover:bg-slate-900 active:scale-[0.98] transition-all cursor-pointer select-none text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleLoadLastTrade}
                className="col-span-2 sm:col-span-1 flex items-center justify-center space-x-1.5 py-3 px-4 rounded-xl font-semibold border border-slate-855 bg-slate-955 text-slate-400 hover:text-slate-200 hover:bg-slate-900 active:scale-[0.98] transition-all cursor-pointer select-none text-xs"
              >
                <History className="w-3.5 h-3.5" />
                <span>Load Last</span>
              </button>
            </div>

            {/* Inline Notes Field when Saving */}
            {showNotesInput && (
              <div className="p-4 bg-slate-950 border border-slate-855 rounded-xl space-y-3.5 animate-in slide-in-from-top-2 duration-150">
                <InputField
                  label="Add Notes (Optional)"
                  id="tradeNotes"
                  placeholder="e.g. Dividend target reinvest"
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
                    className="px-4 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-955 rounded-xl cursor-pointer select-none"
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
            title="Realized Yields"
            subtitle={calculationMode === 'planning' ? "Actual performance after deducting MYR clearance, brokerage, stamp and SST rates." : "Returns calculated from contract note amounts."}
            headerActions={
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border select-none ${
                getProfitType() === 'profit' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450' 
                  : getProfitType() === 'loss' 
                    ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                    : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                {getProfitType() === 'profit' ? 'Profit' : getProfitType() === 'loss' ? 'Loss' : 'Break-even'}
              </span>
            }
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ResultCard
                  label="Net Profit (MYR)"
                  value={formatCurrency(results.netProfitMyr, 'MYR', 2)}
                  type={getProfitType()}
                  size="lg"
                  className="sm:col-span-2"
                  tooltip="Your net gain or loss in MYR after subtracting cleared commissions, duty stamp, and broker platform charges."
                />

                <ResultCard
                  label="ROI %"
                  value={formatPercent(results.roiPercent)}
                  type={getProfitType()}
                  subtitle="Return on cost"
                  className="sm:col-span-2"
                  tooltip="Return on Investment percentage, calculated as (Net Profit MYR / Total Capital Outlay MYR) * 100."
                />
              </div>

              {/* Extra Performance Stats */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-400">
                <div className="flex justify-between items-center">
                  <span>Gross Trade Value:</span>
                  <span className="font-mono text-slate-200">{formatCurrency(results.sellValueMyr, 'MYR', 2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Capital Outlay:</span>
                  <span className="font-mono text-slate-200">{formatCurrency(results.totalBuyCostMyr, 'MYR', 2)}</span>
                </div>
                {calculationMode === 'planning' && (
                  <div className="flex justify-between items-center text-red-450/90">
                    <span>Accumulated Broker Fees:</span>
                    <span className="font-mono">{formatCurrency(results.totalFeesMyr, 'MYR', 2)}</span>
                  </div>
                )}
                {parseFloat(quantity) > 0 && (
                  <div className="flex justify-between items-center border-t border-slate-900 pt-2 text-slate-355">
                    <span>Break-Even Sell Price:</span>
                    <span className="font-mono font-bold text-white">
                      {formatCurrency(results.breakEvenSellPriceMyr, 'MYR', settings?.priceDecimals || 4)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Target Result Mini Card (Planning Mode Only) */}
          {calculationMode === 'planning' && (
            <SectionCard title="Target Planner Result" className="border-slate-850 bg-slate-900/10">
              {targetResults.requiredSellPriceMyr > 0 && targetProfit ? (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Target Sell Price:</span>
                    <span className="font-mono font-bold text-emerald-450">
                      {formatCurrency(targetResults.requiredSellPriceMyr, 'MYR', settings?.priceDecimals || 4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Required Gain %:</span>
                    <span className="font-mono text-slate-200">{formatPercent(targetResults.requiredGainPercent)}</span>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-850 text-[10px]">
                    {gapMsg && (
                      <span className={gapMsg.type === 'success' ? 'text-emerald-455' : 'text-amber-400'}>
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
            <SectionCard title="Trade Summary" className="border-slate-855 bg-slate-900/10 animate-in fade-in duration-200">
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {getSummarySentence()}
              </p>
            </SectionCard>
          )}

          {/* What-If Sell Scenario Table (Planning Mode Only) */}
          {calculationMode === 'planning' && whatIfScenarios.length > 0 && (
            <SectionCard title="What-If Sell Scenarios" subtitle="Compare potential returns at different target price movements." className="border-slate-855 bg-slate-900/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px] font-mono">
                  <thead>
                    <tr className="border-b border-slate-855 text-slate-500 font-semibold text-[9px] uppercase tracking-wider">
                      <th className="py-2">Scenario</th>
                      <th className="py-2">Price</th>
                      <th className="py-2">Profit MYR</th>
                      <th className="py-2">ROI %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-855/40">
                    {whatIfScenarios.map((scn, i) => {
                      const scnProfitType = scn.results.netProfitMyr > 0 ? 'text-emerald-450' : scn.results.netProfitMyr < 0 ? 'text-red-400' : 'text-slate-400';
                      return (
                        <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-2 text-slate-400">
                            {scn.pct === 0 ? 'Current' : `${scn.pct > 0 ? '+' : ''}${scn.pct.toFixed(0)}%`}
                          </td>
                          <td className="py-2 font-bold text-slate-200">
                            {formatCurrency(scn.price, 'MYR', settings?.priceDecimals || 4)}
                          </td>
                          <td className={`py-2 font-bold ${scnProfitType}`}>
                            {formatCurrency(scn.results.netProfitMyr, 'MYR', 2)}
                          </td>
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
              <li>Break-even price includes clearing, brokerage, and SST.</li>
              <li>SST is typically 6% or 8% depending on the brokerage provider. Check with your broker contract.</li>
              <li>Target sell price is estimated based on current inputs.</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
