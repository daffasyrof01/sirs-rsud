import { AppShell } from "@/components/layout/app-shell";
import { requireServerRole } from "@/lib/server/page-auth";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  await requireServerRole("superadmin");

  return (
    <AppShell role="superadmin">{children}</AppShell>
  );
}
