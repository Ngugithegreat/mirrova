import type { Metadata } from "next";
import RealWallet from "@/components/dashboard/RealWallet";

export const metadata: Metadata = { title: "Real wallet" };

export default function WalletPage() {
  return <RealWallet />;
}
