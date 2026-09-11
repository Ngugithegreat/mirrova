import type { Metadata } from "next";
import AppNavbar from "@/components/site/AppNavbar";
import AppFooter from "@/components/site/AppFooter";
import Portfolio from "@/components/dashboard/Portfolio";

export const metadata: Metadata = { title: "Portfolio" };

export default function DashboardPage() {
  return (
    <>
      <AppNavbar />
      <main className="min-h-[80vh] pt-[68px]">
        <Portfolio />
      </main>
      <AppFooter />
    </>
  );
}
