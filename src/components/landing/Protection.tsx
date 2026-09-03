import Reveal from "@/components/ui/Reveal";

const ITEMS = [
  {
    title: "Segregated accounts",
    body: "Client funds are held in segregated accounts with tier-1 banking partners, separate from company operating capital.",
  },
  {
    title: "Bank-grade encryption",
    body: "TLS 1.3 in transit, AES-256 at rest, and hardware-backed key management for every credential we store.",
  },
  {
    title: "Two-factor everything",
    body: "2FA on login, withdrawals and copy-relationship changes. Withdrawal addresses are locked for 24h after any change.",
  },
  {
    title: "Negative balance protection",
    body: "Your loss on any copy relationship is capped at your allocation. You can never owe more than you put in.",
  },
];

export default function Protection() {
  return (
    <section className="border-y border-line-soft bg-surface/40" id="security">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 lg:grid-cols-2 lg:px-8 lg:py-32">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mint">Protection first</p>
          <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-[2.6rem] sm:leading-[1.15]">
            Your capital, defended on every layer
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-2">
            Copy trading only works when the copier is protected better than the trader. Mirrova was
            engineered around that asymmetry: your money stays yours, your risk limits are enforced by
            the platform — not by trust — and your downside on every relationship is hard-capped.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {ITEMS.map((it) => (
              <div key={it.title}>
                <div className="flex items-center gap-2.5">
                  <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-mint" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.8a1 1 0 0 0-1.4-1.4L9 10.1 7.7 8.8a1 1 0 1 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4Z"
                    />
                  </svg>
                  <h3 className="font-semibold text-ink">{it.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{it.body}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="panel relative overflow-hidden p-8">
            <div
              className="absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-25 blur-3xl"
              style={{ background: "radial-gradient(closest-side, rgba(60,227,167,0.5), transparent)" }}
              aria-hidden="true"
            />
            <h3 className="font-display text-lg font-semibold text-ink">Risk Shield in action</h3>
            <p className="mt-2 text-sm text-ink-2">A $2,000 copy with a 15% copy stop-loss:</p>

            <div className="mt-6 space-y-4">
              {[
                { label: "Your allocation", value: "$2,000.00", bar: 100, tone: "bg-s1" },
                { label: "Maximum possible loss", value: "$300.00", bar: 15, tone: "bg-neg" },
                { label: "Protected floor", value: "$1,700.00", bar: 85, tone: "bg-pos" },
              ].map((r) => (
                <div key={r.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-2">{r.label}</span>
                    <span className="tnum font-semibold text-ink">{r.value}</span>
                  </div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-line-soft">
                    <div className={`h-full rounded-full ${r.tone}`} style={{ width: `${r.bar}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7 rounded-xl border border-line bg-raised/60 p-4 text-sm leading-relaxed text-ink-2">
              If the copied portfolio ever touches <span className="tnum text-ink">−15%</span>, every mirrored
              position is closed at market and{" "}
              <span className="tnum text-ink">$1,700+</span> returns to your cash balance. No human in the
              loop, no delay, no exceptions.
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
