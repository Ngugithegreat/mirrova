import type { Metadata } from "next";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import AuthForm from "@/components/auth/AuthForm";
import Auroras from "@/components/motion/Auroras";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="relative flex min-h-[86vh] items-center overflow-hidden px-5 pb-16 pt-[120px]">
        <Auroras />
        <div className="relative mx-auto w-full">
        <AuthForm mode="login" />
        </div>
      </main>
      <Footer />
    </>
  );
}
