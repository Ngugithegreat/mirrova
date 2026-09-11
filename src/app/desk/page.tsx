import type { Metadata } from "next";
import Navbar from "@/components/site/Navbar";
import AppFooter from "@/components/site/AppFooter";
import Desk from "@/components/desk/Desk";

export const metadata: Metadata = { title: "The Desk — practice trading" };

export default function DeskPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[80vh] pt-[76px]">
        <Desk />
      </main>
      <AppFooter />
    </>
  );
}
