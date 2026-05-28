/**
 * Formats a number as currency (USD with $ or MYR with RM).
 * @param {number} value - The numeric value to format.
 * @param {string} currency - 'USD' or 'MYR'.
 * @param {number} decimals - Number of decimal places (typically 2, or 4 for prices).
 * @returns {string} - Formatted currency string.
 */
export const formatCurrency = (value, currency, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return currency === 'USD' ? '$0.00' : 'RM 0.00';
  }
  
  const formatted = Number(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  if (currency === 'USD') {
    return `$${formatted}`;
  } else if (currency === 'MYR') {
    return `RM ${formatted}`;
  }
  return formatted;
};

/**
 * Formats a number as a percentage.
 * @param {number} value - The numeric percentage value.
 * @returns {string} - Formatted percentage string.
 */
export const formatPercent = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%';
  }
  const formatted = Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${value >= 0 ? '+' : ''}${formatted}%`;
};

/**
 * Formats a date string or timestamp into a readable date format.
 * @param {string|number} dateVal - Date representation.
 * @returns {string} - Formatted date.
 */
export const formatDate = (dateVal) => {
  if (!dateVal) return '';
  const date = new Date(dateVal);
  return date.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formats a quantity, preserving up to 4 decimal places without rounding (using standard built-in formatting).
 * @param {number} value - The quantity value.
 * @returns {string} - Formatted quantity string.
 */
export const formatQuantity = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
};

/**
 * Formats a US stock quantity, preserving up to 4 decimal places without rounding (e.g. 1.2337).
 * @param {number|string} value - The quantity value.
 * @returns {string} - Formatted quantity string.
 */
export const formatUsQuantity = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return num.toFixed(4).replace(/\.?0+$/, "");
};
