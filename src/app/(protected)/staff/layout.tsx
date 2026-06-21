import { AppShell } from "@/components/layout/app-shell";
import { requireServerRole } from "@/lib/server/page-auth";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  await requireServerRole("staff");

  return (
    <AppShell role="staff">{children}</AppShell>
  );
}
