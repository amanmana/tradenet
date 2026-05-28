import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../utils/storage';
import { DEFAULT_SETTINGS } from '../data/defaultSettings';
import SectionCard from '../components/SectionCard';
import InputField from '../components/InputField';
import { Save, RotateCcw, Check, AlertCircle } from 'lucide-react';

/**
 * Settings configuration view.
 */
export default function Settings() {
  const [settings, setLocalSettings] = useState(DEFAULT_SETTINGS);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setLocalSettings(getSettings());
  }, []);

  const handleChange = (section, field, value) => {
    setLocalSettings(prev => {
      if (section) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    const success = saveSettings(settings);
    if (success) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all settings and presets to default? This will not delete your saved trades.')) {
      setLocalSettings(DEFAULT_SETTINGS);
      saveSettings(DEFAULT_SETTINGS);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center space-x-2">
            <span>Calculator Preferences</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure your default exchange rates, broker charges, and visual formatting.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-4.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Preferences Saved' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="flex items-center space-x-2 p-3.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 text-emerald-400 text-xs font-semibold animate-in fade-in duration-200">
          <Check className="w-4 h-4 shrink-0" />
          <span>Your default settings have been successfully updated! New trades will inherit these presets.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Preferences */}
        <SectionCard title="General Preferences" subtitle="Global rates and formatting options.">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <InputField
              label="Default Buy FX Rate"
              id="buyFxRate"
              type="number"
              step="0.0001"
              value={settings.buyFxRate}
              onChange={(e) => handleChange(null, 'buyFxRate', parseFloat(e.target.value) || 0)}
              prefix="RM"
              helperText="USD to MYR"
            />
            
            <InputField
              label="Default Sell FX Rate"
              id="sellFxRate"
              type="number"
              step="0.0001"
              value={settings.sellFxRate}
              onChange={(e) => handleChange(null, 'sellFxRate', parseFloat(e.target.value) || 0)}
              prefix="RM"
              helperText="USD to MYR"
            />

            <div className="flex flex-col space-y-1.5">
              <label htmlFor="viewCurrency" className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                Default View Currency
              </label>
              <select
                id="viewCurrency"
                value={settings.viewCurrency}
                onChange={(e) => handleChange(null, 'viewCurrency', e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
              >
                <option value="both">Both (USD & MYR)</option>
                <option value="usd">USD Only</option>
                <option value="myr">MYR Only</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label htmlFor="priceDecimals" className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                Stock Price Decimals
              </label>
              <select
                id="priceDecimals"
                value={settings.priceDecimals}
                onChange={(e) => handleChange(null, 'priceDecimals', parseInt(e.target.value))}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
              >
                <option value="2">2 Decimal Places (e.g. $190.50)</option>
                <option value="4">4 Decimal Places (e.g. $190.5025)</option>
              </select>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="usBrokerPreset" className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                US Broker Presets
              </label>
              <select
                id="usBrokerPreset"
                value={settings.usBrokerPreset}
                onChange={(e) => handleChange(null, 'usBrokerPreset', e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
              >
                <option value="MooMoo">MooMoo Malaysia</option>
              </select>
            </div>
          </div>
        </SectionCard>

        {/* MooMoo US Presets */}
        <SectionCard title="MooMoo US Default Fees" subtitle="Set standard transaction charge templates for US trades (in USD).">
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-900 pb-1">
                Buy Side Charges (USD)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <InputField
                  label="Commission"
                  id="us_buyCommission"
                  type="number"
                  step="0.01"
                  value={settings.moomooUs.buyCommission}
                  onChange={(e) => handleChange('moomooUs', 'buyCommission', parseFloat(e.target.value) || 0)}
                  prefix="$"
                />
                <InputField
                  label="Platform Fee"
                  id="us_buyPlatformFee"
                  type="number"
                  step="0.01"
                  value={settings.moomooUs.buyPlatformFee}
                  onChange={(e) => handleChange('moomooUs', 'buyPlatformFee', parseFloat(e.target.value) || 0)}
                  prefix="$"
                />
                <InputField
                  label="Settlement Fee"
                  id="us_buySettlementFee"
                  type="number"
                  step="0.0001"
                  value={settings.moomooUs.buySettlementFee}
                  onChange={(e) => handleChange('moomooUs', 'buySettlementFee', parseFloat(e.target.value) || 0)}
                  prefix="$"
                  helperText="Per share fee"
                />
                <InputField
                  label="Other Buy Fee"
                  id="us_otherBuyFee"
                  type="number"
                  step="0.01"
                  value={settings.moomooUs.otherBuyFee}
                  onChange={(e) => handleChange('moomooUs', 'otherBuyFee', parseFloat(e.target.value) || 0)}
                  prefix="$"
                />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-900 pb-1">
                Sell Side Charges (USD)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <InputField
                  label="Commission"
                  id="us_sellCommission"
                  type="number"
                  step="0.01"
                  value={settings.moomooUs.sellCommission}
                  onChange={(e) => handleChange('moomooUs', 'sellCommission', parseFloat(e.target.value) || 0)}
                  prefix="$"
                />
                <InputField
                  label="Platform Fee"
                  id="us_sellPlatformFee"
                  type="number"
                  step="0.01"
                  value={settings.moomooUs.sellPlatformFee}
                  onChange={(e) => handleChange('moomooUs', 'sellPlatformFee', parseFloat(e.target.value) || 0)}
                  prefix="$"
                />
                <InputField
                  label="Settlement Fee"
                  id="us_sellSettlementFee"
                  type="number"
                  step="0.0001"
                  value={settings.moomooUs.sellSettlementFee}
                  onChange={(e) => handleChange('moomooUs', 'sellSettlementFee', parseFloat(e.target.value) || 0)}
                  prefix="$"
                  helperText="Per share fee"
                />
                <InputField
                  label="SEC Fee"
                  id="us_secFee"
                  type="number"
                  step="0.000001"
                  value={settings.moomooUs.secFee}
                  onChange={(e) => handleChange('moomooUs', 'secFee', parseFloat(e.target.value) || 0)}
                  prefix="$"
                  helperText="Value % (e.g. 0.0000278)"
                />
                <InputField
                  label="TAF / FINRA Fee"
                  id="us_tafFee"
                  type="number"
                  step="0.00001"
                  value={settings.moomooUs.tafFee}
                  onChange={(e) => handleChange('moomooUs', 'tafFee', parseFloat(e.target.value) || 0)}
                  prefix="$"
                  helperText="Per sell share"
                />
                <InputField
                  label="CAT Fee"
                  id="us_catFee"
                  type="number"
                  step="0.0001"
                  value={settings.moomooUs.catFee}
                  onChange={(e) => handleChange('moomooUs', 'catFee', parseFloat(e.target.value) || 0)}
                  prefix="$"
                  helperText="CAT transaction fee"
                />
                <InputField
                  label="Other Sell Fee"
                  id="us_otherSellFee"
                  type="number"
                  step="0.01"
                  value={settings.moomooUs.otherSellFee}
                  onChange={(e) => handleChange('moomooUs', 'otherSellFee', parseFloat(e.target.value) || 0)}
                  prefix="$"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Bursa Malaysia Presets */}
        <SectionCard title="Bursa Malaysia Default Fees" subtitle="Set standard transaction charge templates for Bursa Malaysia trades (in MYR).">
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-900 pb-1">
                Buy Side Charges (MYR)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <InputField
                  label="Brokerage Fee"
                  id="bursa_buyBrokerage"
                  type="number"
                  step="0.01"
                  value={settings.bursa.buyBrokerage}
                  onChange={(e) => handleChange('bursa', 'buyBrokerage', parseFloat(e.target.value) || 0)}
                  prefix="RM"
                />
                <InputField
                  label="Clearing Fee"
                  id="bursa_buyClearing"
                  type="number"
                  step="0.01"
                  value={settings.bursa.buyClearing}
                  onChange={(e) => handleChange('bursa', 'buyClearing', parseFloat(e.target.value) || 0)}
                  prefix="RM"
                />
                <InputField
                  label="Stamp Duty"
                  id="bursa_buyStampDuty"
                  type="number"
                  step="1"
                  value={settings.bursa.buyStampDuty}
                  onChange={(e) => handleChange('bursa', 'buyStampDuty', parseFloat(e.target.value) || 0)}
                  prefix="RM"
                />
                <InputField
                  label="SST Amount"
                  id="bursa_buySst"
                  type="number"
                  step="0.01"
                  value={settings.bursa.buySst}
                  onChange={(e) => handleChange('bursa', 'buySst', parseFloat(e.target.value) || 0)}
                  prefix="RM"
                />
                <InputField
                  label="Other Buy Fee"
                  id="bursa_otherBuyFee"
                  type="number"
                  step="0.01"
                  value={settings.bursa.otherBuyFee}
                  onChange={(e) => handleChange('bursa', 'otherBuyFee', parseFloat(e.target.value) || 0)}
                  prefix="RM"
                />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-900 pb-1">
                Sell Side Charges (MYR)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <InputField
                  label="Brokerage Fee"
                  id="bursa_sellBrokerage"
                  type="number"
                  step="0.01"
                  value={settings.bursa.sellBrokerage}
                  onChange={(e) => handleChange('bursa', 'sellBrokerage', parseFloat(e.target.value) || 0)}
                  prefix="RM"
                />
                <InputField
                  label="Clearing Fee"
                  id="bursa_sellClearing"
                  type="number"
                  step="0.01"
                  value={settings.bursa.sellClearing}
                  onChange={(e) => handleChange('bursa', 'sellClearing', parseFloat(e.target.value) || 0)}
                  prefix="RM"
                />
                <InputField
                  label="Stamp Duty"
                  id="bursa_sellStampDuty"
                  type="number"
                  step="1"
                  value={settings.bursa.sellStampDuty}
                  onChange={(e) => handleChange('bursa', 'sellStampDuty', parseFloat(e.target.value) || 0)}
                  prefix="RM"
                />
                <InputField
                  label="SST Amount"
                  id="bursa_sellSst"
                  type="number"
                  step="0.01"
                  value={settings.bursa.sellSst}
                  onChange={(e) => handleChange('bursa', 'sellSst', parseFloat(e.target.value) || 0)}
                  prefix="RM"
                />
                <InputField
                  label="Other Sell Fee"
                  id="bursa_otherSellFee"
                  type="number"
                  step="0.01"
                  value={settings.bursa.otherSellFee}
                  onChange={(e) => handleChange('bursa', 'otherSellFee', parseFloat(e.target.value) || 0)}
                  prefix="RM"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Action Disclaimer Panel */}
        <div className="flex items-start space-x-3 p-4 rounded-2xl border border-slate-900 bg-slate-950/40 text-slate-500">
          <AlertCircle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            Note: These values are used to populate the calculator input fields on load. You can always override individual values dynamically inside each calculation form.
          </p>
        </div>
      </form>
    </div>
  );
}
