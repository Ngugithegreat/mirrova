import type { Metadata } from "next";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Portfolio from "@/components/dashboard/Portfolio";

export const metadata: Metadata = { title: "Portfolio" };

export default function DashboardPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[80vh] pt-[72px]">
        <Portfolio />
      </main>
      <Footer />
    </>
  );
}
