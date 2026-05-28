/**
 * Calculates US trade results.
 * @param {Object} inputs - The input values.
 * @returns {Object} - Calculated outputs.
 */
export const calculateMoomooUsTrade = (inputs) => {
  const buyPrice = parseFloat(inputs.buyPrice) || 0;
  const sellPrice = parseFloat(inputs.sellPrice) || 0;
  const quantity = parseFloat(inputs.quantity) || 0;
  const buyFx = parseFloat(inputs.buyFx) || 0;
  const sellFx = parseFloat(inputs.sellFx) || 0;

  // Fees
  const buyCommission = parseFloat(inputs.buyCommission) || 0;
  const buyPlatform = parseFloat(inputs.buyPlatformFee) || 0;
  const buySettlement = parseFloat(inputs.buySettlementFee) || 0;
  const otherBuy = parseFloat(inputs.otherBuyFee) || 0;

  const sellCommission = parseFloat(inputs.sellCommission) || 0;
  const sellPlatform = parseFloat(inputs.sellPlatformFee) || 0;
  const sellSettlement = parseFloat(inputs.sellSettlementFee) || 0;
  const secFee = parseFloat(inputs.secFee) || 0;
  const tafFee = parseFloat(inputs.tafFee) || 0;
  const catFee = parseFloat(inputs.catFee) || 0;
  const otherSell = parseFloat(inputs.otherSellFee) || 0;

  const buyValueUsd = buyPrice * quantity;
  const sellValueUsd = sellPrice * quantity;

  const totalBuyFeesUsd = buyCommission + buyPlatform + buySettlement + otherBuy;
  const totalSellFeesUsd = sellCommission + sellPlatform + sellSettlement + secFee + tafFee + catFee + otherSell;
  const totalFeesUsd = totalBuyFeesUsd + totalSellFeesUsd;

  const totalBuyCostUsd = buyValueUsd + totalBuyFeesUsd;
  const totalSellProceedsUsd = sellValueUsd - totalSellFeesUsd;

  const netProfitUsd = totalSellProceedsUsd - totalBuyCostUsd;
  
  const roiPercent = totalBuyCostUsd > 0 ? (netProfitUsd / totalBuyCostUsd) * 100 : 0;

  const buyCostMyr = totalBuyCostUsd * buyFx;
  const sellProceedsMyr = totalSellProceedsUsd * sellFx;
  const netProfitMyr = sellProceedsMyr - buyCostMyr;

  const secFeeRate = parseFloat(inputs.secFeeRate) || 0;
  const sellFeesOtherUsd = Math.max(0, totalSellFeesUsd - secFee);
  const breakEvenSellPriceUsd = (quantity > 0 && (1 - secFeeRate) > 0)
    ? (totalBuyCostUsd + sellFeesOtherUsd) / (quantity * (1 - secFeeRate))
    : 0;

  return {
    buyValueUsd,
    sellValueUsd,
    totalBuyFeesUsd,
    totalSellFeesUsd,
    totalFeesUsd,
    totalBuyCostUsd,
    totalSellProceedsUsd,
    netProfitUsd,
    roiPercent,
    buyCostMyr,
    sellProceedsMyr,
    netProfitMyr,
    breakEvenSellPriceUsd,
  };
};

/**
 * Calculates target parameters.
 */
export const calculateMoomooUsTarget = (inputs, tradeResults) => {
  const buyPrice = parseFloat(inputs.buyPrice) || 0;
  const quantity = parseFloat(inputs.quantity) || 0;
  const sellFx = parseFloat(inputs.sellFx) || 0;

  const totalBuyCostUsd = tradeResults.totalBuyCostUsd || 0;
  const totalSellFeesUsd = tradeResults.totalSellFeesUsd || 0;
  const buyCostMyr = tradeResults.buyCostMyr || 0;

  const targetMode = inputs.targetMode; // 'profit' or 'roi'
  const targetCurrency = inputs.targetCurrency || 'USD'; // 'USD' or 'MYR'
  const targetProfit = parseFloat(inputs.targetProfit) || 0;
  const targetRoiPercent = parseFloat(inputs.targetRoiPercent) || 0;

  // Retrieve SEC rate and current absolute SEC fee to extract other sell fees
  const secFeeRate = parseFloat(inputs.secFeeRate) || 0;
  const currentSecFee = parseFloat(inputs.secFee) || 0;
  const sellFeesOtherUsd = Math.max(0, totalSellFeesUsd - currentSecFee);

  let requiredSellPriceUsd = 0;
  let estimatedNetProfitUsd = 0;
  let estimatedNetProfitMyr = 0;

  if (quantity <= 0) {
    return {
      requiredSellPriceUsd: 0,
      requiredGainPercent: 0,
      requiredSellValueUsd: 0,
      estimatedNetProfitUsd: 0,
      estimatedNetProfitMyr: 0,
      targetGapUsd: 0,
      meetsTarget: false,
    };
  }

  if (targetMode === 'profit') {
    if (targetCurrency === 'USD') {
      // S = (totalBuyCostUsd + sellFeesOtherUsd + targetProfit) / (1 - secFeeRate)
      const requiredSellValueUsd = (totalBuyCostUsd + sellFeesOtherUsd + targetProfit) / (1 - secFeeRate);
      requiredSellPriceUsd = requiredSellValueUsd / quantity;
      estimatedNetProfitUsd = targetProfit;
      estimatedNetProfitMyr = targetProfit * sellFx;
    } else {
      // MYR target profit calculation
      const requiredSellProceedsMyr = buyCostMyr + targetProfit;
      const requiredSellProceedsUsd = sellFx > 0 ? requiredSellProceedsMyr / sellFx : 0;
      // S = (requiredSellProceedsUsd + sellFeesOtherUsd) / (1 - secFeeRate)
      const requiredSellValueUsd = (requiredSellProceedsUsd + sellFeesOtherUsd) / (1 - secFeeRate);
      requiredSellPriceUsd = requiredSellValueUsd / quantity;
      estimatedNetProfitMyr = targetProfit;
      estimatedNetProfitUsd = sellFx > 0 ? targetProfit / sellFx : 0;
    }
  } else if (targetMode === 'cash') {
    if (targetCurrency === 'USD') {
      // Final Cash = Sell Value - Sell Fees
      // requiredSellValueUsd = (finalCashUsd + sellFeesOtherUsd) / (1 - secFeeRate)
      const requiredSellValueUsd = (targetProfit + sellFeesOtherUsd) / (1 - secFeeRate);
      requiredSellPriceUsd = requiredSellValueUsd / quantity;
      estimatedNetProfitUsd = targetProfit - totalBuyCostUsd;
      estimatedNetProfitMyr = estimatedNetProfitUsd * sellFx;
    } else {
      // Final Cash in MYR
      const requiredSellProceedsUsd = sellFx > 0 ? targetProfit / sellFx : 0;
      const requiredSellValueUsd = (requiredSellProceedsUsd + sellFeesOtherUsd) / (1 - secFeeRate);
      requiredSellPriceUsd = requiredSellValueUsd / quantity;
      estimatedNetProfitMyr = targetProfit - buyCostMyr;
      estimatedNetProfitUsd = sellFx > 0 ? estimatedNetProfitMyr / sellFx : 0;
    }
  } else {
    // ROI mode
    const targetProfitUsd = (totalBuyCostUsd * targetRoiPercent) / 100;
    const requiredSellValueUsd = (totalBuyCostUsd + sellFeesOtherUsd + targetProfitUsd) / (1 - secFeeRate);
    requiredSellPriceUsd = requiredSellValueUsd / quantity;
    estimatedNetProfitUsd = targetProfitUsd;
    estimatedNetProfitMyr = targetProfitUsd * sellFx;
  }

  const requiredSellValueUsd = requiredSellPriceUsd * quantity;
  const requiredGainPercent = buyPrice > 0 ? ((requiredSellPriceUsd - buyPrice) / buyPrice) * 100 : 0;
  
  const sellPriceUsd = parseFloat(inputs.sellPrice) || 0;
  const targetGapUsd = requiredSellPriceUsd - sellPriceUsd;
  const meetsTarget = sellPriceUsd >= requiredSellPriceUsd;

  return {
    requiredSellPriceUsd,
    requiredGainPercent,
    requiredSellValueUsd,
    estimatedNetProfitUsd,
    estimatedNetProfitMyr,
    targetGapUsd,
    meetsTarget,
  };
};

/**
 * Calculates US trade results at a specific sell price, preserving other inputs.
 */
export const calculateMoomooUsTradeAtPrice = (price, inputs) => {
  return calculateMoomooUsTrade({
    ...inputs,
    sellPrice: price.toString()
  });
};
