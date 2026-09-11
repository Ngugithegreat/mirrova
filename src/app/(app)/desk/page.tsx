import type { Metadata } from "next";
import Desk from "@/components/desk/Desk";

export const metadata: Metadata = { title: "The Desk — practice trading" };

export default function DeskPage() {
  return <Desk />;
}
