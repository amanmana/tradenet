/**
 * Calculates Bursa Malaysia trade results.
 * @param {Object} inputs - The input values.
 * @returns {Object} - Calculated outputs.
 */
export const calculateBursaTrade = (inputs) => {
  const buyPrice = parseFloat(inputs.buyPrice) || 0;
  const sellPrice = parseFloat(inputs.sellPrice) || 0;
  const quantity = parseFloat(inputs.quantity) || 0;

  // Fees
  const buyBrokerage = parseFloat(inputs.buyBrokerage) || 0;
  const buyClearing = parseFloat(inputs.buyClearing) || 0;
  const buyStampDuty = parseFloat(inputs.buyStampDuty) || 0;
  const buySst = parseFloat(inputs.buySst) || 0;
  const otherBuy = parseFloat(inputs.otherBuyFee) || 0;

  const sellBrokerage = parseFloat(inputs.sellBrokerage) || 0;
  const sellClearing = parseFloat(inputs.sellClearing) || 0;
  const sellStampDuty = parseFloat(inputs.sellStampDuty) || 0;
  const sellSst = parseFloat(inputs.sellSst) || 0;
  const otherSell = parseFloat(inputs.otherSellFee) || 0;

  const buyValueMyr = buyPrice * quantity;
  const sellValueMyr = sellPrice * quantity;

  const totalBuyFeesMyr = buyBrokerage + buyClearing + buyStampDuty + buySst + otherBuy;
  const totalSellFeesMyr = sellBrokerage + sellClearing + sellStampDuty + sellSst + otherSell;
  const totalFeesMyr = totalBuyFeesMyr + totalSellFeesMyr;

  const totalBuyCostMyr = buyValueMyr + totalBuyFeesMyr;
  const totalSellProceedsMyr = sellValueMyr - totalSellFeesMyr;

  const netProfitMyr = totalSellProceedsMyr - totalBuyCostMyr;
  
  const roiPercent = totalBuyCostMyr > 0 ? (netProfitMyr / totalBuyCostMyr) * 100 : 0;

  const breakEvenSellPriceMyr = quantity > 0 ? (totalBuyCostMyr + totalSellFeesMyr) / quantity : 0;

  return {
    buyValueMyr,
    sellValueMyr,
    totalBuyFeesMyr,
    totalSellFeesMyr,
    totalFeesMyr,
    totalBuyCostMyr,
    totalSellProceedsMyr,
    netProfitMyr,
    roiPercent,
    breakEvenSellPriceMyr,
  };
};

/**
 * Calculates Bursa Malaysia target planner outputs.
 */
export const calculateBursaTarget = (inputs, tradeResults) => {
  const buyPrice = parseFloat(inputs.buyPrice) || 0;
  const quantity = parseFloat(inputs.quantity) || 0;

  const totalBuyCostMyr = tradeResults.totalBuyCostMyr || 0;
  const totalSellFeesMyr = tradeResults.totalSellFeesMyr || 0;

  const targetMode = inputs.targetMode; // 'profit' or 'roi'
  const targetProfit = parseFloat(inputs.targetProfit) || 0;
  const targetRoiPercent = parseFloat(inputs.targetRoiPercent) || 0;

  let requiredSellPriceMyr = 0;
  let estimatedNetProfitMyr = 0;

  if (quantity <= 0) {
    return {
      requiredSellPriceMyr: 0,
      requiredGainPercent: 0,
      requiredSellValueMyr: 0,
      estimatedNetProfitMyr: 0,
      targetGapMyr: 0,
      meetsTarget: false,
    };
  }

  if (targetMode === 'profit') {
    const requiredSellValueMyr = totalBuyCostMyr + totalSellFeesMyr + targetProfit;
    requiredSellPriceMyr = requiredSellValueMyr / quantity;
    estimatedNetProfitMyr = targetProfit;
  } else if (targetMode === 'cash') {
    // Final Cash = Sell Value - Sell Fees
    // requiredSellValueMyr = finalCashMyr + totalSellFeesMyr
    const requiredSellValueMyr = targetProfit + totalSellFeesMyr;
    requiredSellPriceMyr = requiredSellValueMyr / quantity;
    estimatedNetProfitMyr = targetProfit - totalBuyCostMyr;
  } else {
    // ROI mode
    const targetProfitMyr = (totalBuyCostMyr * targetRoiPercent) / 100;
    const requiredSellValueMyr = totalBuyCostMyr + totalSellFeesMyr + targetProfitMyr;
    requiredSellPriceMyr = requiredSellValueMyr / quantity;
    estimatedNetProfitMyr = targetProfitMyr;
  }

  const requiredSellValueMyr = requiredSellPriceMyr * quantity;
  const requiredGainPercent = buyPrice > 0 ? ((requiredSellPriceMyr - buyPrice) / buyPrice) * 100 : 0;

  const sellPriceMyr = parseFloat(inputs.sellPrice) || 0;
  const targetGapMyr = requiredSellPriceMyr - sellPriceMyr;
  const meetsTarget = sellPriceMyr >= requiredSellPriceMyr;

  return {
    requiredSellPriceMyr,
    requiredGainPercent,
    requiredSellValueMyr,
    estimatedNetProfitMyr,
    targetGapMyr,
    meetsTarget,
  };
};

/**
 * Calculates Bursa trade results at a specific sell price, preserving other inputs.
 */
export const calculateBursaTradeAtPrice = (price, inputs) => {
  return calculateBursaTrade({
    ...inputs,
    sellPrice: price.toString()
  });
};
