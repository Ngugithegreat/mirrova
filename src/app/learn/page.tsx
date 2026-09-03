import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { ARTICLES } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Academy",
  description:
    "The Mirrova Academy — clear, practical guides to copy trading: how it works, choosing traders, managing risk, understanding fees.",
};

const LEVEL_TONE: Record<string, string> = {
  Beginner: "border-pos/40 bg-pos/10 text-pos",
  Intermediate: "border-warn/40 bg-warn/10 text-warn",
  Advanced: "border-s5/40 bg-s5/10 text-[#e58bab]",
};

export default function LearnPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[72px]">
        <div className="border-b border-line-soft bg-surface/40">
          <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-mint">Academy</p>
            <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Learn copy trading properly
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-ink-2">
              No hype, no signals-group nonsense. Practical guides written the way we&apos;d explain it to a
              friend — including the risks most platforms bury.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {ARTICLES.map((a) => (
              <Link key={a.slug} href={`/learn/${a.slug}`} className="panel panel-hover group flex h-full flex-col p-7">
                <div className="flex items-center gap-2.5">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${LEVEL_TONE[a.level]}`}>
                    {a.level}
                  </span>
                  <span className="text-xs text-ink-3">{a.minutes} min read</span>
                </div>
                <h2 className="font-display mt-4 text-xl font-semibold leading-snug text-ink group-hover:text-mint">
                  {a.title}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-2">{a.teaser}</p>
                <span className="mt-5 text-sm font-medium text-mint">Read guide →</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
