import type { Metadata } from "next";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-[86vh] items-center px-5 pb-16 pt-[120px]">
        <AuthForm mode="signup" />
      </main>
      <Footer />
    </>
  );
}
