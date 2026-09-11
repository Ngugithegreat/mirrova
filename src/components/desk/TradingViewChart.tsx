"use client";

/** A free, keyless TradingView "Advanced Chart" iframe embed — real market
 * data, purely for visual market-watch realism. This is NOT what practice
 * trades execute against (that's still the deterministic CandleChart feed);
 * matches PrimeStone's own dual-mode chart pattern. */
const TV_SYMBOL: Record<string, string> = {
  "BTC/USD": "BINANCE:BTCUSDT",
  "ETH/USD": "BINANCE:ETHUSDT",
  "S&P 500": "TVC:SPX",
  "NASDAQ 100": "TVC:NDX",
  "EUR/USD": "FX:EURUSD",
  "GBP/USD": "FX:GBPUSD",
  GOLD: "TVC:GOLD",
  "USD/JPY": "FX:USDJPY",
  "CRUDE OIL": "TVC:USOIL",
  "DAX 40": "TVC:DAX",
  SILVER: "TVC:SILVER",
  AAPL: "NASDAQ:AAPL",
};

export default function TradingViewChart({ sym, height = 440 }: { sym: string; height?: number }) {
  const tvSymbol = TV_SYMBOL[sym] ?? "FX:EURUSD";
  const src = `https://s3.tradingview.com/embed-widget/advanced-chart/?symbol=${encodeURIComponent(tvSymbol)}&interval=15&theme=dark&style=1&locale=en&hide_top_toolbar=0&hide_legend=0&toolbar_bg=%230e0e18&studies=%5B%5D`;
  return (
    <iframe
      key={sym}
      src={src}
      style={{ width: "100%", height, border: "none" }}
      title={`${sym} live chart`}
    />
  );
}
