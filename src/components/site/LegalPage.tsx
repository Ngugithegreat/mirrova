import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";

export type LegalSection = { heading: string; body: string[] };

export default function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <Navbar />
      <main className="pt-[72px]">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <h1 className="font-display text-4xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-3 text-sm text-ink-3">Last updated: {updated}</p>
          <p className="mt-6 leading-[1.8] text-ink-2">{intro}</p>
          <div className="mt-10 space-y-10">
            {sections.map((s, i) => (
              <section key={s.heading}>
                <h2 className="font-display text-xl font-semibold text-ink">
                  {i + 1}. {s.heading}
                </h2>
                <div className="mt-3 space-y-3">
                  {s.body.map((p, j) => (
                    <p key={j} className="leading-[1.8] text-ink-2">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <p className="mt-14 rounded-[3px] border border-warn/30 bg-warn/8 p-5 text-sm leading-relaxed text-ink-2">
            This document is a template for the Asport Traders platform preview and is not legal advice. Before
            operating a live investment service, have qualified counsel adapt these terms to the licences
            and regulations of each jurisdiction you serve.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
