import type { Metadata } from "next";
import { requireAdmin } from "@/server/adminAuth";
import AdminGate from "@/components/admin/AdminGate";
import AdminConsole from "@/components/admin/AdminConsole";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const authed = await requireAdmin();
  return <main className="min-h-screen">{authed ? <AdminConsole /> : <AdminGate />}</main>;
}
