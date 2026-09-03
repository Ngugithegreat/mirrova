import { MONTH_LABELS } from "@/lib/traders";

/**
 * Diverging color scale: mint for gains, red for losses, neutral near zero.
 * Every cell carries its value as text, so color is never the only encoding.
 */
function cellStyle(v: number): React.CSSProperties {
  const cap = 8;
  const t = Math.min(Math.abs(v) / cap, 1);
  if (Math.abs(v) < 0.05) return { background: "rgba(22,21,15,0.06)" };
  return v > 0
    ? { background: `rgba(23, 113, 74, ${0.07 + t * 0.3})` }
    : { background: `rgba(179, 55, 47, ${0.07 + t * 0.3})` };
}

export default function MonthlyHeatmap({ returns }: { returns: number[] }) {
  const rows: { year: number; cells: (number | null)[] }[] = [];
  const byYear = new Map<number, (number | null)[]>();
  MONTH_LABELS.forEach((m, i) => {
    if (!byYear.has(m.year)) byYear.set(m.year, Array(12).fill(null));
    const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    byYear.get(m.year)![names.indexOf(m.label)] = returns[i];
  });
  [...byYear.entries()]
    .sort((a, b) => b[0] - a[0])
    .forEach(([year, cells]) => rows.push({ year, cells }));

  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="scroll-x">
      <table className="w-full min-w-[680px] border-separate border-spacing-[3px] text-center">
        <thead>
          <tr>
            <th className="pr-2 text-left text-xs font-medium text-ink-3">Year</th>
            {names.map((n) => (
              <th key={n} className="pb-1 text-xs font-medium text-ink-3">
                {n}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.year}>
              <td className="pr-2 text-left text-xs font-medium text-ink-2 tnum">{r.year}</td>
              {r.cells.map((v, i) => (
                <td
                  key={i}
                  style={v == null ? undefined : cellStyle(v)}
                  className="rounded-md px-1 py-2 text-[11px] tnum"
                >
                  {v == null ? (
                    <span className="text-ink-3/40">–</span>
                  ) : (
                    <span className={v > 0 ? "text-pos" : v < 0 ? "text-neg" : "text-ink-2"}>
                      {v > 0 ? "+" : ""}
                      {v.toFixed(1)}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-ink-3">Monthly returns, %, net of fees. Simulated track record for illustration.</p>
    </div>
  );
}
