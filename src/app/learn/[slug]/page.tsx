import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { ButtonLink } from "@/components/ui/Button";
import Auroras from "@/components/motion/Auroras";
import { ARTICLES, getArticle } from "@/lib/articles";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return {};
  return { title: a.title, description: a.teaser };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  const others = ARTICLES.filter((a) => a.slug !== slug).slice(0, 3);

  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden pt-[72px]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[380px]" aria-hidden="true"><Auroras dim /></div>
        <article className="relative mx-auto max-w-3xl px-5 py-14">
          <Link href="/learn" className="text-sm text-ink-3 transition-colors hover:text-ink">
            ← Academy
          </Link>
          <p className="mt-6 text-xs text-ink-3">
            {article.level} · {article.minutes} min read
          </p>
          <h1 className="font-display mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-[2.6rem] sm:leading-[1.15]">
            {article.title}
          </h1>

          <div className="mt-10 space-y-10">
            {article.sections.map((s, i) => (
              <section key={i}>
                {s.heading && <h2 className="font-display mb-4 text-xl font-semibold text-ink sm:text-2xl">{s.heading}</h2>}
                <div className="space-y-4">
                  {s.paragraphs.map((p, j) => (
                    <p key={j} className="leading-[1.8] text-ink-2">
                      {p}
                    </p>
                  ))}
                </div>
                {s.bullets && (
                  <ul className="mt-4 space-y-3">
                    {s.bullets.map((b, j) => (
                      <li key={j} className="flex gap-3 leading-relaxed text-ink-2">
                        <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-mint" aria-hidden="true" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <div className="panel mt-14 p-8 text-center">
            <h2 className="font-display text-xl font-semibold">Put it into practice</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
              Browse the leaderboard with what you just learned — every stat in this guide is public on
              every trader profile.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <ButtonLink href="/traders">Browse traders</ButtonLink>
              <ButtonLink href="/signup" variant="secondary">Create free account</ButtonLink>
            </div>
          </div>

          <div className="mt-14">
            <h2 className="font-display text-lg font-semibold">Keep reading</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {others.map((a) => (
                <Link key={a.slug} href={`/learn/${a.slug}`} className="panel panel-hover p-5">
                  <div className="text-xs text-ink-3">{a.minutes} min</div>
                  <div className="mt-2 text-sm font-medium leading-snug text-ink">{a.title}</div>
                </Link>
              ))}
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
