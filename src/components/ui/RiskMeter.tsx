import { cx } from "@/lib/format";

export default function RiskMeter({ score, showLabel = true }: { score: number; showLabel?: boolean }) {
  const color = score <= 4 ? "bg-pos" : score <= 6 ? "bg-warn" : "bg-neg";
  const label = score <= 4 ? "Low" : score <= 6 ? "Medium" : "High";
  return (
    <div className="flex items-center gap-2.5" title={`Risk score ${score} of 10`}>
      <div className="flex items-center gap-[3px]" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className={cx("h-[9px] w-[5px] rounded-[1px]", i < score ? color : "bg-ink/12")}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-xs text-ink-2">
          <span className="tnum font-medium text-ink">{score}</span>/10 · {label}
        </span>
      )}
    </div>
  );
}
