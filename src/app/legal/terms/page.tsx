import type { Metadata } from "next";
import LegalPage from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="September 2026"
      intro="These Terms govern your use of the Asport Traders platform, website and related services. By creating an account or using the platform you agree to be bound by them. Please read them together with our Privacy Policy and Risk Disclosure."
      sections={[
        {
          heading: "The service",
          body: [
            "Asport Traders provides a copy trading platform that allows users ('Copiers') to automatically replicate the trading activity of listed strategists ('Pro Traders') in their own accounts. Asport Traders does not provide investment advice, portfolio management or personal recommendations. The availability of a trader on the platform is not an endorsement of their strategy or a prediction of performance.",
          ],
        },
        {
          heading: "Eligibility and accounts",
          body: [
            "You must be at least 18 years old and legally able to enter into contracts in your jurisdiction. You are responsible for the accuracy of the information you provide, for safeguarding your credentials, and for all activity under your account. We may require identity verification before enabling deposits, withdrawals or live copying.",
          ],
        },
        {
          heading: "Copy trading relationships",
          body: [
            "When you copy a trader, you authorise the platform to replicate that trader's transactions in your account, proportionally to your allocation, until you pause or terminate the relationship. You retain full ownership of your account and funds at all times; Pro Traders have no access to, or visibility of, your balance.",
            "You are solely responsible for your allocation decisions, your copy stop-loss settings and your overall exposure. You may terminate any copy relationship at any time; termination closes mirrored positions at prevailing market prices.",
          ],
        },
        {
          heading: "Fees",
          body: [
            "Applicable fees — performance fees, spreads and any financing charges — are displayed before you enter a copy relationship and in the fee schedule on the Pricing page. Performance fees are calculated only on net profits above the relationship's high-water mark.",
          ],
        },
        {
          heading: "Risk acknowledgement",
          body: [
            "Trading and copy trading carry significant risk of loss. Past performance of any Pro Trader is not a reliable indicator of future results. You confirm that you understand the Risk Disclosure and that you will not commit funds whose loss you cannot afford.",
          ],
        },
        {
          heading: "Prohibited conduct",
          body: [
            "You may not use the platform for unlawful activity, market manipulation, money laundering, or to circumvent vetting or monitoring controls; attempt to reverse engineer or interfere with the service; or misrepresent your identity or track record. We may suspend or terminate accounts that breach these Terms.",
          ],
        },
        {
          heading: "Limitation of liability",
          body: [
            "To the maximum extent permitted by law, Asport Traders is not liable for trading losses arising from copied strategies, market conditions, or your configuration choices; nor for indirect or consequential damages. Nothing in these Terms excludes liability that cannot be excluded by law.",
          ],
        },
        {
          heading: "Changes and termination",
          body: [
            "We may amend these Terms with notice via the platform. Continued use after the effective date constitutes acceptance. You may close your account at any time after settling open positions and withdrawing your balance.",
          ],
        },
      ]}
    />
  );
}
