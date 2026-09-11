import type { Metadata } from "next";
import Navbar from "@/components/site/Navbar";
import AppFooter from "@/components/site/AppFooter";
import KycForm from "@/components/kyc/KycForm";

export const metadata: Metadata = { title: "Verify your identity" };

export default function VerifyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[80vh] pt-[76px]">
        <KycForm />
      </main>
      <AppFooter />
    </>
  );
}
