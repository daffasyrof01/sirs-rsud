import { redirectAuthenticatedUser } from "@/lib/server/page-auth";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  await redirectAuthenticatedUser();
  return <>{children}</>;
}
