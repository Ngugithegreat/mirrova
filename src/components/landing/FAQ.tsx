"use client";

import { useState } from "react";
import Reveal from "@/components/ui/Reveal";

const QA: { q: string; a: string }[] = [
  {
    q: "What exactly is copy trading?",
    a: "Copy trading lets you automatically replicate the trades of another investor. When you copy a trader on Asport Traders, every position they open or close is mirrored in your own account, sized proportionally to the amount you allocated. If they put 5% of their portfolio into an asset, 5% of your allocation goes into the same asset at the same moment. You keep full ownership and control of your account throughout.",
  },
  {
    q: "How much money do I need to start?",
    a: "You can copy most traders from $100. There's no account minimum and no charge to open or hold an account. We recommend starting small, spreading allocations across two or three traders with different strategies, and increasing only once you've watched how the relationship behaves through both good and bad weeks.",
  },
  {
    q: "Do traders ever have access to my money?",
    a: "Never. Copying is purely a data relationship: the platform reads the trader's activity and reproduces it in your segregated account. Traders cannot see your balance, deposit, withdraw, or interact with your funds in any way.",
  },
  {
    q: "How are traders vetted before they're listed?",
    a: "Applicants need a verified track record of at least 12 months, a documented and consistent strategy, and drawdown behaviour within our risk framework. We audit their history for reset or hidden accounts, interview them about their process, and monitor every listed trader continuously — strategies that drift from their stated risk profile are suspended from new copies. Fewer than 2% of applicants are listed.",
  },
  {
    q: "What does it cost?",
    a: "Browsing, opening an account, deposits and withdrawals are free, and there is no management fee. Each trader sets a performance fee between 10% and 30%, charged only on the profits they generate for you and only above a high-water mark — if they lose money, they earn nothing until you're back above your previous peak. Spreads are shown per instrument before you commit.",
  },
  {
    q: "Can I stop copying whenever I want?",
    a: "Yes, instantly. You can pause a copy relationship (no new trades mirrored, existing ones stay open), close individual positions, or exit the entire relationship at market price — 24/7, with no notice period or exit fee.",
  },
  {
    q: "What protections do I have if a trader performs badly?",
    a: "Three layers. First, the copy stop-loss: set a maximum loss (say 15%) and the platform automatically liquidates the relationship if it's hit. Second, every trader's risk score and maximum historical drawdown are public, so you know the downside profile before committing. Third, negative balance protection means you can never lose more than you allocated.",
  },
  {
    q: "Is copy trading safe? Will I definitely make money?",
    a: "No investment guarantees profit, and copy trading is no exception — you are taking on the market risk of the strategies you copy, and past performance does not predict future results. What Asport Traders provides is transparency and control: verified histories, enforced risk limits, and instant exit. Only invest money you can afford to lose.",
  },
];

function Item({ q, a, open, onClick }: { q: string; a: string; open: boolean; onClick: () => void }) {
  return (
    <div className="border-t border-line">
      <button
        onClick={onClick}
        aria-expanded={open}
        className="flex w-full items-baseline justify-between gap-6 py-6 text-left"
      >
        <span className="font-display text-lg font-semibold text-ink">{q}</span>
        <span
          className={`fig shrink-0 text-xl leading-none transition-colors ${open ? "text-mint" : "text-ink-3"}`}
          aria-hidden="true"
        >
          {open ? "−" : "+"}
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="max-w-2xl pb-7 leading-[1.75] text-ink-2">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="mx-auto max-w-3xl px-5 py-20 lg:py-28" id="faq">
      <Reveal>
        <p className="eyebrow">Questions</p>
        <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-[2.75rem] sm:leading-[1.1]">
          Asked before every first allocation
        </h2>
      </Reveal>
      <div className="rule-heavy mt-10">
        {QA.map((item, i) => (
          <Item key={item.q} {...item} open={open === i} onClick={() => setOpen(open === i ? -1 : i)} />
        ))}
      </div>
    </section>
  );
}
