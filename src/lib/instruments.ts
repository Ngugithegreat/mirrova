export type Instrument = { sym: string; price: number; decimals: number };

/** Canonical instrument/base-price list — shared by the homepage ticker and
 * the practice Desk so both draw from a single source of truth. */
export const INSTRUMENTS: Instrument[] = [
  { sym: "BTC/USD", price: 96420, decimals: 0 },
  { sym: "ETH/USD", price: 4285, decimals: 0 },
  { sym: "S&P 500", price: 6890, decimals: 1 },
  { sym: "NASDAQ 100", price: 25120, decimals: 1 },
  { sym: "EUR/USD", price: 1.0942, decimals: 4 },
  { sym: "GBP/USD", price: 1.3118, decimals: 4 },
  { sym: "GOLD", price: 4012.5, decimals: 1 },
  { sym: "USD/JPY", price: 148.32, decimals: 2 },
  { sym: "CRUDE OIL", price: 71.84, decimals: 2 },
  { sym: "DAX 40", price: 24310, decimals: 1 },
  { sym: "SILVER", price: 48.9, decimals: 2 },
  { sym: "AAPL", price: 268.4, decimals: 2 },
];

export function getInstrument(sym: string): Instrument | undefined {
  return INSTRUMENTS.find((i) => i.sym === sym);
}
