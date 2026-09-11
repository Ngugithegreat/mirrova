import type { Metadata } from "next";
import Navbar from "@/components/site/Navbar";
import AppFooter from "@/components/site/AppFooter";
import RealWallet from "@/components/dashboard/RealWallet";

export const metadata: Metadata = { title: "Real wallet" };

export default function WalletPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[80vh] pt-[76px]">
        <RealWallet />
      </main>
      <AppFooter />
    </>
  );
}
