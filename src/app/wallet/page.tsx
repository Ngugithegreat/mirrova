import type { Metadata } from "next";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import RealWallet from "@/components/dashboard/RealWallet";

export const metadata: Metadata = { title: "Real wallet" };

export default function WalletPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[80vh] pt-[72px]">
        <RealWallet />
      </main>
      <Footer />
    </>
  );
}
