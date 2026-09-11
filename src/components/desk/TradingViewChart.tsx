"use client";

import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    TradingView?: { widget: new (options: Record<string, unknown>) => unknown };
  }
}

/** A free, keyless TradingView "Advanced Chart" widget — real market data,
 * purely for visual market-watch realism. This is NOT what practice trades
 * execute against (that's still the deterministic CandleChart feed);
 * matches PrimeStone's own dual-mode chart pattern. Uses TradingView's
 * actual embeddable widget script (tv.js), not a raw iframe URL — a plain
 * iframe to their embed-widget path 403s without an allow-listed referrer,
 * the script-based widget is the real public embed method. */
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

let scriptPromise: Promise<void> | null = null;
function loadTvScript(): Promise<void> {
  if (window.TradingView) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load TradingView"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export default function TradingViewChart({ sym, height = 440 }: { sym: string; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rawId = useId();
  const containerId = `tv-widget-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    let cancelled = false;
    loadTvScript()
      .then(() => {
        if (cancelled || !window.TradingView || !containerRef.current) return;
        containerRef.current.innerHTML = "";
        new window.TradingView.widget({
          autosize: true,
          symbol: TV_SYMBOL[sym] ?? "FX:EURUSD",
          interval: "15",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#0e0e18",
          enable_publishing: false,
          hide_top_toolbar: false,
          save_image: false,
          container_id: containerId,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sym, containerId]);

  return <div id={containerId} ref={containerRef} style={{ height }} />;
}
