import { DEFAULT_SETTINGS } from '../data/defaultSettings';

const STORAGE_KEYS = {
  SETTINGS: 'tradenet_my_settings',
  TRADES: 'tradenet_my_saved_trades',
};

/**
 * Retrieves the user settings from LocalStorage.
 * Falls back to DEFAULT_SETTINGS if empty.
 */
export const getSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      // Save default settings if not exists
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    // Merge with DEFAULT_SETTINGS to ensure any new keys exist
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    console.error('Error reading settings from localStorage:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Saves settings to LocalStorage.
 */
export const saveSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving settings to localStorage:', error);
    return false;
  }
};

/**
 * Retrieves saved trades list.
 */
export const getSavedTrades = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRADES);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Error reading saved trades from localStorage:', error);
    return [];
  }
};

/**
 * Saves a new trade to LocalStorage.
 */
export const saveTrade = (trade) => {
  try {
    const trades = getSavedTrades();
    const newTrade = {
      ...trade,
      id: trade.id || Date.now().toString(),
      createdAt: trade.createdAt || new Date().toISOString(),
    };
    trades.unshift(newTrade); // Newest first
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
    return newTrade;
  } catch (error) {
    console.error('Error saving trade to localStorage:', error);
    return null;
  }
};

/**
 * Deletes a trade from LocalStorage.
 */
export const deleteTrade = (id) => {
  try {
    const trades = getSavedTrades();
    const filtered = trades.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting trade from localStorage:', error);
    return false;
  }
};

/**
 * Clears all trades from LocalStorage.
 */
export const clearAllTrades = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.TRADES);
    return true;
  } catch (error) {
    console.error('Error clearing trades from localStorage:', error);
    return false;
  }
};

/**
 * Retrieves the latest saved trade for a specific market (US or BURSA)
 */
export const getLastSavedTrade = (market) => {
  try {
    const trades = getSavedTrades();
    const filtered = trades.filter((t) => t.market === market);
    return filtered.length > 0 ? filtered[0] : null;
  } catch (error) {
    console.error('Error getting last saved trade from localStorage:', error);
    return null;
  }
};
