import { formatQuantity, formatUsQuantity } from './formatters';

/**
 * Exports an array of saved trades into a CSV file downloaded by the browser.
 * @param {Array} trades - List of saved trade objects.
 */
export const exportTradesToCsv = (trades) => {
  if (!trades || trades.length === 0) return;

  const headers = [
    'Date',
    'Market',
    'Broker',
    'Ticker',
    'Buy Price',
    'Sell Price',
    'Quantity',
    'Net Profit USD',
    'Net Profit MYR',
    'ROI %',
    'Break-even Price',
    'Notes'
  ];

  const rows = trades.map(t => {
    const dateStr = new Date(t.createdAt).toLocaleDateString('en-MY');
    const escapedMarket = `"${(t.market || '').replace(/"/g, '""')}"`;
    const escapedBroker = `"${(t.broker || '').replace(/"/g, '""')}"`;
    const escapedTicker = `"${(t.ticker || '').replace(/"/g, '""')}"`;
    const buyPrice = t.buyPrice || 0;
    const sellPrice = t.sellPrice || 0;
    const quantity = t.market === 'US' ? formatUsQuantity(t.quantity) : formatQuantity(t.quantity);
    
    // For Bursa, Net Profit USD is blank. Break-even can be USD or MYR depending on market
    const netProfitUsd = t.market === 'US' ? (t.netProfitUsd ?? 0) : '';
    const netProfitMyr = t.netProfitMyr ?? 0;
    const roi = t.roiPercent ?? 0;
    
    const breakEven = t.market === 'US' 
      ? (t.breakEvenSellPriceUsd ?? 0) 
      : (t.breakEvenSellPriceMyr ?? 0);
      
    // Escape quotes in notes
    const escapedNotes = t.notes ? `"${t.notes.replace(/"/g, '""')}"` : '';

    return [
      dateStr,
      escapedMarket,
      escapedBroker,
      escapedTicker,
      buyPrice,
      sellPrice,
      quantity,
      netProfitUsd,
      netProfitMyr,
      roi,
      breakEven,
      escapedNotes
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(e => e.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `tradenet_my_saved_trades_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
