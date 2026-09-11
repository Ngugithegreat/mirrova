import type { Metadata } from "next";
import Portfolio from "@/components/dashboard/Portfolio";

export const metadata: Metadata = { title: "Overview" };

export default function DashboardPage() {
  return <Portfolio />;
}
