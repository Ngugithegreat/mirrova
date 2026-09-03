import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Mirrova — Copy the world's sharpest traders",
    template: "%s · Mirrova",
  },
  description:
    "Mirrova is the professional copy trading platform. Browse vetted traders with fully transparent track records, copy their strategies in one click, and stay protected with institutional-grade risk controls.",
  openGraph: {
    title: "Mirrova — Copy the world's sharpest traders",
    description:
      "Browse vetted traders with transparent track records and mirror their strategies automatically, with risk controls built in.",
    siteName: "Mirrova",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mirrova — Copy the world's sharpest traders",
    description: "Professional copy trading with transparent track records and built-in risk controls.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
