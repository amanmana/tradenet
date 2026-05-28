export async function fetchYahooLastPrice(symbol) {
  const cleanSymbol = String(symbol || "").trim().toUpperCase();

  if (!cleanSymbol) {
    return { ok: false, error: "Enter a ticker symbol first." };
  }

  const response = await fetch(
    `/api/yahoo-quote?symbol=${encodeURIComponent(cleanSymbol)}`
  );

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    return {
      ok: false,
      error: data?.error || "Could not fetch last price."
    };
  }

  return {
    ok: true,
    symbol: data.symbol,
    price: Number(data.price),
    previousClose: data.previousClose,
    currency: data.currency,
    exchangeName: data.exchangeName,
    shortName: data.shortName,
    regularMarketTime: data.regularMarketTime,
    source: data.source,
    fetchedAt: data.fetchedAt
  };
}
