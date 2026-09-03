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
    body: "2FA on login, withdrawals and copy changes; withdrawal addresses lock for 24 hours after any change.",
  },
  {
    title: "Negative balance protection",
    body: "Your loss on any copy relationship is capped at your allocation. You can never owe more than you put in.",
  },
];

const IVORY = "text-[#f2efe6]";
const IVORY_2 = "text-[#bdb9ac]";
const IVORY_3 = "text-[#8b877b]";

export default function Protection() {
  return (
    <section className="band-ink" id="security">
      <div aria-hidden="true">
        <div className="aurora aurora-2 -top-24 right-[10%] h-[340px] w-[420px] !opacity-30" />
        <div className="aurora aurora-1 bottom-0 left-[5%] h-[300px] w-[300px] !opacity-25" />
      </div>
      <div className="relative mx-auto grid max-w-[1200px] items-start gap-16 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
        <Reveal>
          <p className="eyebrow !text-mint">Protection first</p>
          <h2 className={`font-display mt-4 text-3xl font-semibold tracking-tight sm:text-[2.75rem] sm:leading-[1.1] ${IVORY}`}>
            Your capital, defended on every layer
          </h2>
          <p className={`mt-6 text-lg leading-relaxed ${IVORY_2}`}>
            Copy trading only works when the copier is protected better than the trader. Mirrova was
            engineered around that asymmetry: your money stays yours, your limits are enforced by the
            platform — not by trust — and your downside on every relationship is hard-capped.
          </p>
          <div className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {ITEMS.map((it) => (
              <div key={it.title} className="border-t border-[#f2efe6]/15 pt-4">
                <h3 className={`font-semibold ${IVORY}`}>{it.title}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${IVORY_2}`}>{it.body}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="border border-[#f2efe6]/20 p-8">
            <p className="eyebrow !text-mint">Worked example</p>
            <h3 className={`font-display mt-3 text-2xl font-semibold ${IVORY}`}>
              A $2,000 copy with a 15% stop-loss
            </h3>

            <div className="mt-8 space-y-6">
              {[
                { label: "Your allocation", value: "$2,000.00", bar: 100, tone: "#bdb9ac" },
                { label: "Maximum possible loss", value: "$300.00", bar: 15, tone: "#e0705f" },
                { label: "Protected floor", value: "$1,700.00", bar: 85, tone: "#4bc48b" },
              ].map((r) => (
                <div key={r.label}>
                  <div className="flex items-baseline justify-between">
                    <span className={`text-sm ${IVORY_2}`}>{r.label}</span>
                    <span className={`fig text-lg font-semibold ${IVORY}`}>{r.value}</span>
                  </div>
                  <div className="mt-2.5 h-[6px] w-full bg-[#f2efe6]/10">
                    <div className="h-full" style={{ width: `${r.bar}%`, background: r.tone }} />
                  </div>
                </div>
              ))}
            </div>

            <p className={`mt-9 border-t border-[#f2efe6]/15 pt-6 text-sm leading-relaxed ${IVORY_2}`}>
              If the copied portfolio ever touches <span className={`tnum ${IVORY}`}>−15%</span>, every
              mirrored position is closed at market and{" "}
              <span className={`tnum ${IVORY}`}>$1,700+</span> returns to your cash balance. No human in
              the loop, no delay, no exceptions.
            </p>
            <p className={`mt-4 text-xs ${IVORY_3}`}>
              Illustration. Fast or gapping markets can execute below the configured level.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
