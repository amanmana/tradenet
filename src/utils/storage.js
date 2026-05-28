import { DEFAULT_SETTINGS } from '../data/defaultSettings';

const STORAGE_KEYS = {
  SETTINGS: 'tradenet_my_settings',
  TRADES: 'tradenet_my_saved_trades',
};

/**
 * Migrates old `bursa` key (field names: buyBrokerage, sellBrokerage…)
 * into the new `bursaFees` key (field names: buyBrokerageFee, sellBrokerageFee…).
 * Safe to call multiple times — no-ops if already migrated.
 */
const migrateLegacyBursa = (saved) => {
  if (!saved) return saved;

  // If old `bursa` key exists but new `bursaFees` does not, migrate
  if (saved.bursa && !saved.bursaFees) {
    const b = saved.bursa;
    saved = {
      ...saved,
      bursaFees: {
        buyBrokerageFee: b.buyBrokerage ?? 0,
        buyClearingFee: b.buyClearing ?? 0,
        buyStampDuty: b.buyStampDuty ?? 0,
        buySst: b.buySst ?? 0,
        otherBuyFee: b.otherBuyFee ?? 0,
        sellBrokerageFee: b.sellBrokerage ?? 0,
        sellClearingFee: b.sellClearing ?? 0,
        sellStampDuty: b.sellStampDuty ?? 0,
        sellSst: b.sellSst ?? 0,
        otherSellFee: b.otherSellFee ?? 0,
      },
    };
    // Drop the old key so we don't migrate again
    delete saved.bursa;
  }

  return saved;
};

/**
 * Deep-merges saved settings with DEFAULT_SETTINGS.
 * Handles migration from legacy `bursa` → `bursaFees`.
 */
export const mergeWithDefaultSettings = (saved) => {
  if (!saved || typeof saved !== 'object') return { ...DEFAULT_SETTINGS };

  const migrated = migrateLegacyBursa({ ...saved });

  return {
    ...DEFAULT_SETTINGS,
    ...migrated,
    moomooUs: {
      ...DEFAULT_SETTINGS.moomooUs,
      ...(migrated.moomooUs || {}),
    },
    bursaFees: {
      ...DEFAULT_SETTINGS.bursaFees,
      ...(migrated.bursaFees || {}),
    },
  };
};

/**
 * Retrieves user settings from localStorage.
 * Falls back gracefully to DEFAULT_SETTINGS if nothing is stored yet.
 */
export const getSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return { ...DEFAULT_SETTINGS };
    }
    return mergeWithDefaultSettings(JSON.parse(raw));
  } catch (error) {
    console.error('[TradeNet] Error reading settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
};

/**
 * Saves settings to localStorage. Merges before writing so partial saves
 * never lose keys added in newer app versions.
 * Returns true on success.
 */
export const saveSettings = (settings) => {
  try {
    const toSave = mergeWithDefaultSettings(settings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(toSave));
    if (import.meta.env.DEV) {
      console.log('[TradeNet MY] settings saved', toSave);
    }
    return true;
  } catch (error) {
    console.error('[TradeNet] Error saving settings:', error);
    return false;
  }
};

/**
 * Resets settings to factory defaults, persists, and returns the defaults.
 */
export const resetSettings = () => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    return { ...DEFAULT_SETTINGS };
  } catch (error) {
    console.error('[TradeNet] Error resetting settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
};

/**
 * Retrieves saved trades list (newest first).
 */
export const getSavedTrades = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRADES);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('[TradeNet] Error reading saved trades:', error);
    return [];
  }
};

/**
 * Saves a new trade to localStorage (prepends for newest-first order).
 */
export const saveTrade = (trade) => {
  try {
    const trades = getSavedTrades();
    const newTrade = {
      ...trade,
      id: trade.id || Date.now().toString(),
      createdAt: trade.createdAt || new Date().toISOString(),
    };
    trades.unshift(newTrade);
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
    return newTrade;
  } catch (error) {
    console.error('[TradeNet] Error saving trade:', error);
    return null;
  }
};

/**
 * Deletes a single trade by id.
 */
export const deleteTrade = (id) => {
  try {
    const filtered = getSavedTrades().filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('[TradeNet] Error deleting trade:', error);
    return false;
  }
};

/**
 * Clears all saved trades.
 */
export const clearAllTrades = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.TRADES);
    return true;
  } catch (error) {
    console.error('[TradeNet] Error clearing trades:', error);
    return false;
  }
};

/**
 * Returns the most recent saved trade for a given market ('US' | 'BURSA').
 */
export const getLastSavedTrade = (market) => {
  try {
    const trades = getSavedTrades();
    return trades.find((t) => t.market === market) ?? null;
  } catch (error) {
    console.error('[TradeNet] Error getting last saved trade:', error);
    return null;
  }
};
