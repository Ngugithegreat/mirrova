import type { Metadata } from "next";
import LegalPage from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="September 2026"
      intro="This policy explains what personal data Mirrova collects, why we collect it, how it is protected, and the rights you have over it."
      sections={[
        {
          heading: "Data we collect",
          body: [
            "Account data: name, email address, and — when identity verification is enabled — verification documents and the data they contain. Usage data: pages visited, features used, device and log information. Financial data: deposits, withdrawals, copy relationships and transaction history necessary to operate your account.",
          ],
        },
        {
          heading: "How we use it",
          body: [
            "We use your data to operate the platform (executing copy relationships, processing payments, showing your portfolio), to meet legal obligations such as identity verification and fraud prevention, to secure the service, and to communicate with you about your account. We do not sell personal data.",
          ],
        },
        {
          heading: "What other users see",
          body: [
            "Copiers are private: no other user can see your identity, balance, or what you copy. Pro Traders are public by design — their name, track record and positions are displayed to all visitors as part of the service they opted into.",
          ],
        },
        {
          heading: "Storage and security",
          body: [
            "Data is encrypted in transit (TLS 1.3) and at rest (AES-256). Access is role-restricted and logged. Verification documents are stored in isolated, access-controlled storage and never exposed to other users.",
          ],
        },
        {
          heading: "Retention",
          body: [
            "We keep account and transaction records for as long as your account is active and thereafter as required by applicable financial-services regulations, after which data is deleted or irreversibly anonymised.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "Subject to applicable law, you may request access to, correction of, or deletion of your personal data, object to certain processing, and receive a portable copy of data you provided. Contact support to exercise any of these rights.",
          ],
        },
        {
          heading: "Cookies",
          body: [
            "We use strictly necessary cookies for authentication and security, and — only with consent where required — analytics cookies to understand aggregate usage. The platform preview stores practice-account state locally on your device only.",
          ],
        },
      ]}
    />
  );
}
