import { AppShell } from "@/components/layout/app-shell";
import { requireServerRole } from "@/lib/server/page-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireServerRole("admin");

  return (
    <AppShell role="admin">{children}</AppShell>
  );
}
