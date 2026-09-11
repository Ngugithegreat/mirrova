import type { Metadata } from "next";
import Portfolio from "@/components/dashboard/Portfolio";

export const metadata: Metadata = { title: "Portfolio" };

export default function PortfolioPage() {
  return <Portfolio />;
}
