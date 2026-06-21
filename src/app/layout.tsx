import type { Metadata } from "next";

import { AuthProvider } from "@/components/providers/auth-provider";
import { NativeNotificationProvider } from "@/components/providers/native-notification-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AppToaster } from "@/components/ui/toaster";
import { getServerSessionUser } from "@/lib/server/page-auth";

import "./globals.css";

export const metadata: Metadata = {
  title: "SIPEDRAS",
  description: "Sistem Pelaporan Digital Respon Aset dan Sarana (SIPEDRAS)",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSessionUser();

  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider initialSession={session}>
            <NativeNotificationProvider />
            {children}
            <AppToaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
