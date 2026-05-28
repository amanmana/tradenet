import React, { useState, useEffect, useCallback } from 'react';
import { getSettings, saveSettings, resetSettings, getSavedTrades } from '../utils/storage';
import { DEFAULT_SETTINGS } from '../data/defaultSettings';
import SectionCard from '../components/SectionCard';
import InputField from '../components/InputField';
import {
  Save, RotateCcw, Check, AlertCircle, Info,
  Eraser, ClipboardCopy, RefreshCw,
} from 'lucide-react';

/** Tiny toast component shown inline under a card. */
function Toast({ type, children }) {
  const base = 'flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border animate-in fade-in duration-200';
  const styles = {
    success: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
    warn: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
    info: 'border-sky-500/20 bg-sky-500/5 text-sky-400',
  };
  const icons = {
    success: <Check className="w-3.5 h-3.5 shrink-0" />,
    warn: <AlertCircle className="w-3.5 h-3.5 shrink-0" />,
    info: <Info className="w-3.5 h-3.5 shrink-0" />,
  };
  return (
    <div className={`${base} ${styles[type] ?? styles.info}`}>
      {icons[type]}
      <span>{children}</span>
    </div>
  );
}

/**
 * Settings configuration view.
 */
export default function Settings() {
  // Persisted snapshot (what is currently in localStorage)
  const [savedSnapshot, setSavedSnapshot] = useState(null);
  // Live form state (may differ from savedSnapshot when user edits)
  const [settings, setLocalSettings] = useState(DEFAULT_SETTINGS);
  // Tracks whether form has unsaved edits
  const [isDirty, setIsDirty] = useState(false);

  // Toast messages keyed by section: 'global' | 'usFees'
  const [toasts, setToasts] = useState({});

  const showToast = useCallback((section, type, msg, ms = 3000) => {
    setToasts(prev => ({ ...prev, [section]: { type, msg } }));
    setTimeout(() => setToasts(prev => {
      const next = { ...prev };
      delete next[section];
      return next;
    }), ms);
  }, []);

  // Copy-from-trade status for the header button
  const [copyFeeStatus, setCopyFeeStatus] = useState(null);

  // On mount: load from localStorage
  useEffect(() => {
    const loaded = getSettings();
    setSavedSnapshot(loaded);
    setLocalSettings(loaded);
  }, []);

  // Mark form dirty when settings change (after initial load)
  const handleChange = useCallback((section, field, value) => {
    setIsDirty(true);
    setLocalSettings(prev => {
      if (section) {
        return { ...prev, [section]: { ...prev[section], [field]: value } };
      }
      return { ...prev, [field]: value };
    });
  }, []);

  // ─── Global Save ──────────────────────────────────────────────────────────
  const handleSave = (e) => {
    if (e?.preventDefault) e.preventDefault();
    const ok = saveSettings(settings);
    if (ok) {
      setSavedSnapshot({ ...settings });
      setIsDirty(false);
      showToast('global', 'success', 'Settings saved.');
    }
  };

  // ─── Global Reset to factory defaults ────────────────────────────────────
  const handleResetDefaults = () => {
    if (!window.confirm('Reset ALL settings to factory defaults? This will not delete your saved trades.')) return;
    const defaults = resetSettings();
    setSavedSnapshot({ ...defaults });
    setLocalSettings({ ...defaults });
    setIsDirty(false);
    showToast('global', 'info', 'All settings reset to defaults.');
  };

  // ─── US Fee Presets: Save inline ─────────────────────────────────────────
  const handleSaveUsFees = () => {
    const ok = saveSettings(settings);
    if (ok) {
      setSavedSnapshot({ ...settings });
      setIsDirty(false);
      showToast('usFees', 'success', 'Settings saved.');
    }
  };

  // ─── US Fee Presets: Reset to zero (UI only, not saved yet) ──────────────
  const handleResetUsFeesToZero = () => {
    setIsDirty(true);
    setLocalSettings(prev => ({
      ...prev,
      moomooUs: {
        ...prev.moomooUs,
        buyCommission: 0,
        buyPlatformFee: 0,
        buySettlementFee: 0,
        otherBuyFee: 0,
        sellCommission: 0,
        sellPlatformFee: 0,
        sellSettlementFee: 0,
        secFee: 0,
        tafFee: 0,
        catFee: 0,
        otherSellFee: 0,
      },
    }));
    showToast('usFees', 'warn', 'Fee presets reset in form. Click Save Settings to keep changes.', 4000);
  };

  // ─── US Fee Presets: Restore saved ───────────────────────────────────────
  const handleRestoreUsFees = () => {
    if (!savedSnapshot) return;
    setLocalSettings(prev => ({
      ...prev,
      moomooUs: { ...savedSnapshot.moomooUs },
    }));
    setIsDirty(false);
    showToast('usFees', 'info', 'Saved settings restored.', 3000);
  };

  // ─── US Fee Presets: Copy from last saved trade ───────────────────────────
  const handleCopyFromLastTrade = () => {
    const trades = getSavedTrades();
    const lastUs = trades.find(t => t.market === 'US' && t.feeBreakdown);
    if (!lastUs) {
      const hasAnyUs = trades.some(t => t.market === 'US');
      setCopyFeeStatus(hasAnyUs ? 'no-breakdown' : 'none');
      setTimeout(() => setCopyFeeStatus(null), 4000);
      return;
    }
    const fb = lastUs.feeBreakdown;
    setIsDirty(true);
    setLocalSettings(prev => ({
      ...prev,
      moomooUs: {
        ...prev.moomooUs,
        buyCommission: fb.buyCommission ?? 0,
        buyPlatformFee: fb.buyPlatformFee ?? 0,
        buySettlementFee: fb.buySettlementFee ?? 0,
        otherBuyFee: fb.otherBuyFee ?? 0,
        sellCommission: fb.sellCommission ?? 0,
        sellPlatformFee: fb.sellPlatformFee ?? 0,
        sellSettlementFee: fb.sellSettlementFee ?? 0,
        secFee: fb.secFee ?? 0,
        tafFee: fb.tafFee ?? 0,
        catFee: fb.catFee ?? 0,
        otherSellFee: fb.otherSellFee ?? 0,
      },
    }));
    setCopyFeeStatus('ok');
    setTimeout(() => setCopyFeeStatus(null), 3000);
  };

  // ─── Rendering ────────────────────────────────────────────────────────────
  if (!savedSnapshot) return null; // wait for hydration

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <span>Calculator Preferences</span>
            {isDirty && (
              <span className="text-[11px] font-semibold text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/25 bg-amber-500/[0.07] tracking-wide whitespace-nowrap">
                Unsaved changes
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure your default exchange rates, broker charges, and visual formatting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            id="btn-save-settings-global"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            {toasts.global?.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{toasts.global?.type === 'success' ? 'Saved!' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Global toast */}
      {toasts.global && (
        <Toast type={toasts.global.type}>{toasts.global.msg}</Toast>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── General Preferences ─────────────────────────────────────────── */}
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
                <option value="both">Both (USD &amp; MYR)</option>
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

        {/* ── MooMoo US Fee Presets ────────────────────────────────────────── */}
        <SectionCard
          title={
            <span className="flex items-center gap-2.5">
              MooMoo US Fee Presets
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-400 select-none whitespace-nowrap">
                User-defined
              </span>
            </span>
          }
          subtitle="Set your own estimated fee assumptions for US trades. Leave as 0 if you prefer to enter actual fees manually from your broker contract note."
          headerActions={
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                type="button"
                id="btn-keep-all-zero"
                onClick={handleResetUsFeesToZero}
                title="Set all US fee fields to 0 in the form (not saved yet)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all cursor-pointer whitespace-nowrap"
              >
                <Eraser className="w-3 h-3" />
                Reset to Zero
              </button>
              <button
                type="button"
                id="btn-copy-last-trade-fees"
                onClick={handleCopyFromLastTrade}
                title="Populate presets from your latest saved MooMoo US trade"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border border-slate-800 bg-slate-950 text-slate-400 hover:text-emerald-400 hover:border-emerald-900/40 hover:bg-emerald-950/10 transition-all cursor-pointer whitespace-nowrap"
              >
                <ClipboardCopy className="w-3 h-3" />
                Copy from last saved trade
              </button>
            </div>
          }
        >
          <div className="space-y-5">
            {/* Disclaimer */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] text-amber-300/80 text-[11px] leading-relaxed">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
              <span>
                These presets are not official live MooMoo rates. Broker and regulatory fees can change,
                and some charges depend on order fills, fractional share rules, promotions, and contract note details.
              </span>
            </div>

            {/* Copy-from-trade feedback */}
            {copyFeeStatus === 'ok' && (
              <Toast type="success">Fee presets populated from your last saved MooMoo US trade. Click &quot;Save Settings&quot; to persist.</Toast>
            )}
            {copyFeeStatus === 'none' && (
              <Toast type="warn">No saved MooMoo US trades found. Save a trade from the calculator first.</Toast>
            )}
            {copyFeeStatus === 'no-breakdown' && (
              <Toast type="warn">Existing trades don&apos;t include a fee breakdown. Save a new trade from the calculator to enable this.</Toast>
            )}

            {/* Buy Side */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-900 pb-1">
                Buy Side Charges (USD)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <InputField label="Commission" id="us_buyCommission" type="number" step="0.01" prefix="$"
                  value={settings.moomooUs.buyCommission}
                  onChange={(e) => handleChange('moomooUs', 'buyCommission', parseFloat(e.target.value) || 0)}
                />
                <InputField label="Platform Fee" id="us_buyPlatformFee" type="number" step="0.01" prefix="$"
                  value={settings.moomooUs.buyPlatformFee}
                  onChange={(e) => handleChange('moomooUs', 'buyPlatformFee', parseFloat(e.target.value) || 0)}
                />
                <InputField label="Settlement Fee" id="us_buySettlementFee" type="number" step="0.0001" prefix="$"
                  helperText="Per share fee"
                  value={settings.moomooUs.buySettlementFee}
                  onChange={(e) => handleChange('moomooUs', 'buySettlementFee', parseFloat(e.target.value) || 0)}
                />
                <InputField label="Other Buy Fee" id="us_otherBuyFee" type="number" step="0.01" prefix="$"
                  value={settings.moomooUs.otherBuyFee}
                  onChange={(e) => handleChange('moomooUs', 'otherBuyFee', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Sell Side */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-900 pb-1">
                Sell Side Charges (USD)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <InputField label="Commission" id="us_sellCommission" type="number" step="0.01" prefix="$"
                  value={settings.moomooUs.sellCommission}
                  onChange={(e) => handleChange('moomooUs', 'sellCommission', parseFloat(e.target.value) || 0)}
                />
                <InputField label="Platform Fee" id="us_sellPlatformFee" type="number" step="0.01" prefix="$"
                  value={settings.moomooUs.sellPlatformFee}
                  onChange={(e) => handleChange('moomooUs', 'sellPlatformFee', parseFloat(e.target.value) || 0)}
                />
                <InputField label="Settlement Fee" id="us_sellSettlementFee" type="number" step="0.0001" prefix="$"
                  helperText="Per share fee"
                  value={settings.moomooUs.sellSettlementFee}
                  onChange={(e) => handleChange('moomooUs', 'sellSettlementFee', parseFloat(e.target.value) || 0)}
                />
                <InputField label="SEC Fee Rate" id="us_secFee" type="number" step="0.000001" prefix="$"
                  helperText="% of sell value (e.g. 0.0000278)"
                  value={settings.moomooUs.secFee}
                  onChange={(e) => handleChange('moomooUs', 'secFee', parseFloat(e.target.value) || 0)}
                />
                <InputField label="TAF / FINRA Fee" id="us_tafFee" type="number" step="0.00001" prefix="$"
                  helperText="Per sell share"
                  value={settings.moomooUs.tafFee}
                  onChange={(e) => handleChange('moomooUs', 'tafFee', parseFloat(e.target.value) || 0)}
                />
                <InputField label="CAT Fee" id="us_catFee" type="number" step="0.0001" prefix="$"
                  helperText="CAT transaction fee"
                  value={settings.moomooUs.catFee}
                  onChange={(e) => handleChange('moomooUs', 'catFee', parseFloat(e.target.value) || 0)}
                />
                <InputField label="Other Sell Fee" id="us_otherSellFee" type="number" step="0.01" prefix="$"
                  value={settings.moomooUs.otherSellFee}
                  onChange={(e) => handleChange('moomooUs', 'otherSellFee', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Inline toast for fee preset section */}
            {toasts.usFees && (
              <Toast type={toasts.usFees.type}>{toasts.usFees.msg}</Toast>
            )}

            {/* Card-level action footer */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/60">
              {/* Helper note */}
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm">
                These are user-defined fee presets. They are saved locally in your browser and used for Auto Estimate mode.
              </p>
              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
                <button
                  type="button"
                  id="btn-restore-saved-us"
                  onClick={handleRestoreUsFees}
                  title="Discard unsaved edits and reload saved values"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Restore Saved
                </button>
                <button
                  type="button"
                  id="btn-save-us-fees"
                  onClick={handleSaveUsFees}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-sm shadow-emerald-500/10 cursor-pointer whitespace-nowrap"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── Bursa Malaysia Presets ───────────────────────────────────────── */}
        <SectionCard title="Bursa Malaysia Default Fees" subtitle="Set standard transaction charge templates for Bursa Malaysia trades (in MYR).">
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-900 pb-1">
                Buy Side Charges (MYR)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <InputField label="Brokerage Fee" id="bursa_buyBrokerage" type="number" step="0.01" prefix="RM"
                  value={settings.bursa.buyBrokerage}
                  onChange={(e) => handleChange('bursa', 'buyBrokerage', parseFloat(e.target.value) || 0)}
                />
                <InputField label="Clearing Fee" id="bursa_buyClearing" type="number" step="0.01" prefix="RM"
                  value={settings.bursa.buyClearing}
                  onChange={(e) => handleChange('bursa', 'buyClearing', parseFloat(e.target.value) || 0)}
                />
                <InputField label="Stamp Duty" id="bursa_buyStampDuty" type="number" step="1" prefix="RM"
                  value={settings.bursa.buyStampDuty}
                  onChange={(e) => handleChange('bursa', 'buyStampDuty', parseFloat(e.target.value) || 0)}
                />
                <InputField label="SST Amount" id="bursa_buySst" type="number" step="0.01" prefix="RM"
                  value={settings.bursa.buySst}
                  onChange={(e) => handleChange('bursa', 'buySst', parseFloat(e.target.value) || 0)}
                />
                <InputField label="Other Buy Fee" id="bursa_otherBuyFee" type="number" step="0.01" prefix="RM"
                  value={settings.bursa.otherBuyFee}
                  onChange={(e) => handleChange('bursa', 'otherBuyFee', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-900 pb-1">
                Sell Side Charges (MYR)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <InputField label="Brokerage Fee" id="bursa_sellBrokerage" type="number" step="0.01" prefix="RM"
                  value={settings.bursa.sellBrokerage}
                  onChange={(e) => handleChange('bursa', 'sellBrokerage', parseFloat(e.target.value) || 0)}
                />
                <InputField label="Clearing Fee" id="bursa_sellClearing" type="number" step="0.01" prefix="RM"
                  value={settings.bursa.sellClearing}
                  onChange={(e) => handleChange('bursa', 'sellClearing', parseFloat(e.target.value) || 0)}
                />
                <InputField label="Stamp Duty" id="bursa_sellStampDuty" type="number" step="1" prefix="RM"
                  value={settings.bursa.sellStampDuty}
                  onChange={(e) => handleChange('bursa', 'sellStampDuty', parseFloat(e.target.value) || 0)}
                />
                <InputField label="SST Amount" id="bursa_sellSst" type="number" step="0.01" prefix="RM"
                  value={settings.bursa.sellSst}
                  onChange={(e) => handleChange('bursa', 'sellSst', parseFloat(e.target.value) || 0)}
                />
                <InputField label="Other Sell Fee" id="bursa_otherSellFee" type="number" step="0.01" prefix="RM"
                  value={settings.bursa.otherSellFee}
                  onChange={(e) => handleChange('bursa', 'otherSellFee', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Bottom disclaimer */}
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-slate-900 bg-slate-950/40 text-slate-500">
          <AlertCircle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            These values populate the calculator input fields on load (Auto Estimate mode). You can always override individual values dynamically inside each calculation form.
          </p>
        </div>
      </form>
    </div>
  );
}
