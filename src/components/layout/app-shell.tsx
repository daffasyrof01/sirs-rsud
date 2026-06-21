"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, FileText, LayoutDashboard, LogOut, Menu, Trash2, Users, X } from "lucide-react";

import { HelpChatbot } from "@/components/chatbot/help-chatbot";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_CONFIG } from "@/lib/constants/app";
import { deleteAllNotifications, deleteNotification, listNotifications, markAllNotificationsRead } from "@/lib/services/notification-service";
import { cn, formatDate } from "@/lib/utils";
import type { NotificationItem, Role } from "@/lib/types";

const NAV_ITEMS: Record<Role, Array<{ href: string; label: string; icon: typeof LayoutDashboard }>> = {
  staff: [
    { href: "/staff/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/staff/reports", label: "Riwayat Laporan", icon: FileText },
    { href: "/staff/reports/new", label: "Buat Laporan", icon: FileText },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/reports", label: "Laporan Kerusakan", icon: FileText },
  ],
  superadmin: [
    { href: "/superadmin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/superadmin/reports", label: "Laporan Kerusakan", icon: FileText },
    { href: "/superadmin/users", label: "Manajemen Pengguna", icon: Users },
  ],
};

const SHOW_HELP_CHATBOT = false;

export function AppShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const { session, logout } = useAuth();
  const config = ROLE_CONFIG[role];
  const Icon = config.icon;

  const loadNotifications = React.useCallback(() => {
    if (!session) {
      setNotifications([]);
      return Promise.resolve();
    }

    return listNotifications()
      .then((items) => {
        setNotifications(items);
      })
      .catch(() => {
        setNotifications([]);
      });
  }, [session]);

  React.useEffect(() => {
    loadNotifications();
  }, [loadNotifications, pathname]);

  const notificationCount = notifications.filter((item) => !item.read).length;
  const activeNavHref = NAV_ITEMS[role]
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((first, second) => second.href.length - first.href.length)[0]?.href;

  const handleLogout = async () => {
    await logout();
    router.push(`/login/${role}`);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    await loadNotifications();
  };

  const handleDeleteNotification = async (id: string) => {
    await deleteNotification(id);
    await loadNotifications();
  };

  const handleDeleteAllNotifications = async () => {
    await deleteAllNotifications();
    await loadNotifications();
  };

  const sidebar = (
    <div className="flex h-full flex-col justify-between gap-6 rounded-r-3xl border-r border-sidebar-border bg-sidebar px-4 py-6 md:rounded-none">
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className={cn("rounded-2xl bg-gradient-to-br p-3 text-white shadow-panel", config.accent)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">SIPEDRAS</p>
            <p className="text-sm text-muted-foreground">{config.label}</p>
          </div>
        </div>
        <nav className="space-y-2">
          {NAV_ITEMS[role].map((item) => {
            const ItemIcon = item.icon;
            const active = item.href === activeNavHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  buttonVariants({ variant: active ? "secondary" : "ghost" }),
                  "w-full justify-start rounded-2xl px-4",
                )}
              >
                <ItemIcon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
        <div className="mb-3 flex items-center gap-3">
          <Avatar name={session?.name ?? config.label} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{session?.name ?? config.label}</p>
            <p className="truncate text-xs text-muted-foreground">{session?.department ?? "Portal rumah sakit"}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Keluar
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen md:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-sidebar-border bg-sidebar md:block">{sidebar}</aside>
        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 px-4 py-4 backdrop-blur md:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="md:hidden" onClick={() => setOpen(true)}>
                  <Menu className="h-4 w-4" />
                </Button>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Portal {config.label}</p>
                  <h2 className="text-lg font-semibold">Operasional Rumah Sakit</h2>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="rounded-full px-3" onClick={() => setNotificationsOpen(true)}>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span className="hidden md:inline">Notifikasi</span>
                  <Badge variant={notificationCount > 0 ? "warning" : "outline"}>{notificationCount}</Badge>
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm md:hidden">
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-sm">
            {sidebar}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Notifikasi</DialogTitle>
            <DialogDescription>Pembaruan terbaru terkait laporan dan aktivitas akun Anda.</DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-3 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.title}</p>
                        {!item.read ? <Badge variant="warning">Baru</Badge> : null}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{item.message}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Hapus notifikasi"
                        onClick={() => handleDeleteNotification(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
                Belum ada notifikasi untuk akun ini.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="destructive" onClick={handleDeleteAllNotifications} disabled={notifications.length === 0}>
              Hapus Semua
            </Button>
            <Button variant="outline" onClick={() => setNotificationsOpen(false)}>
              Tutup
            </Button>
            <Button onClick={handleMarkAllRead} disabled={notificationCount === 0}>
              Tandai Semua Dibaca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {SHOW_HELP_CHATBOT ? <HelpChatbot role={role} /> : null}
    </div>
  );
}
