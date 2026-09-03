const SERIES = ["var(--color-s1)", "var(--color-s2)", "var(--color-s3)", "var(--color-s4)", "var(--color-s5)"];

export default function AllocationBars({ allocation }: { allocation: { label: string; pct: number }[] }) {
  return (
    <div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full" role="img" aria-label="Portfolio allocation">
        {allocation.map((a, i) => (
          <div
            key={a.label}
            style={{ width: `${a.pct}%`, background: a.label === "Cash" ? "rgba(151,163,184,0.35)" : SERIES[i % SERIES.length] }}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {allocation.map((a, i) => (
          <li key={a.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2.5 text-ink-2">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: a.label === "Cash" ? "rgba(151,163,184,0.35)" : SERIES[i % SERIES.length] }}
              />
              {a.label}
            </span>
            <span className="tnum font-medium text-ink">{a.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
