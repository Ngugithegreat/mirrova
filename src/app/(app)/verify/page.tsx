import type { Metadata } from "next";
import KycForm from "@/components/kyc/KycForm";

export const metadata: Metadata = { title: "Verify your identity" };

export default function VerifyPage() {
  return <KycForm />;
}
