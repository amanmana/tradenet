export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const symbol = String(url.searchParams.get("symbol") || "")
      .trim()
      .toUpperCase();

    if (!symbol || !/^[A-Z0-9.\-^=]{1,20}$/.test(symbol)) {
      return json({ ok: false, error: "Invalid symbol" }, 400);
    }

    const yahooUrl =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;

    const response = await fetch(yahooUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 TradeNetMY/1.0",
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      return json({
        ok: false,
        error: `Yahoo Finance request failed with status ${response.status}`
      }, response.status);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const meta = result?.meta;

    const price = Number(meta?.regularMarketPrice);

    if (!Number.isFinite(price) || price <= 0) {
      return json({
        ok: false,
        error: "No valid market price found for this symbol"
      }, 404);
    }

    return json({
      ok: true,
      symbol,
      price,
      previousClose: meta?.previousClose ?? null,
      currency: meta?.currency ?? null,
      exchangeName: meta?.exchangeName ?? null,
      shortName: meta?.shortName ?? null,
      regularMarketTime: meta?.regularMarketTime ?? null,
      source: "Yahoo Finance",
      fetchedAt: new Date().toISOString()
    }, 200, {
      "Cache-Control": "public, max-age=15"
    });
  } catch (error) {
    return json({
      ok: false,
      error: error?.message || "Failed to fetch quote"
    }, 500);
  }
}

function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders
    }
  });
}
