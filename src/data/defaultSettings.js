export const DEFAULT_SETTINGS = {
  buyFxRate: 4.40,
  sellFxRate: 4.40,
  viewCurrency: 'both', // 'usd', 'myr', 'both'
  usBrokerPreset: 'MooMoo',
  darkMode: true,
  priceDecimals: 4, // 4 decimals for stock prices
  standardDecimals: 2, // 2 decimals for values/fees/profits
  
  // MooMoo US Default Fee Presets
  moomooUs: {
    buyCommission: 0.00,
    buyPlatformFee: 0.00,
    buySettlementFee: 0.00,
    otherBuyFee: 0.00,
    sellCommission: 0.00,
    sellPlatformFee: 0.00,
    sellSettlementFee: 0.00,
    secFee: 0.00,
    tafFee: 0.00,
    catFee: 0.00,
    otherSellFee: 0.00,
  },
  
  // Bursa Malaysia Default Fee Presets
  bursa: {
    buyBrokerage: 0.00,
    buyClearing: 0.00,
    buyStampDuty: 0.00,
    buySst: 0.00,
    otherBuyFee: 0.00,
    sellBrokerage: 0.00,
    sellClearing: 0.00,
    sellStampDuty: 0.00,
    sellSst: 0.00,
    otherSellFee: 0.00,
  }
};
