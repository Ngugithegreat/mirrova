import type { Metadata } from "next";
import AppNavbar from "@/components/site/AppNavbar";
import AppFooter from "@/components/site/AppFooter";
import RealWallet from "@/components/dashboard/RealWallet";

export const metadata: Metadata = { title: "Real wallet" };

export default function WalletPage() {
  return (
    <>
      <AppNavbar />
      <main className="min-h-[80vh] pt-[68px]">
        <RealWallet />
      </main>
      <AppFooter />
    </>
  );
}
