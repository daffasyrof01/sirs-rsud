"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CheckCircle2, ClipboardList, Clock3, PlusCircle } from "lucide-react";

import { LineChartCard } from "@/components/charts/line-chart-card";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { PriorityBadge, StatusBadge } from "@/components/reports/report-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { listNotifications } from "@/lib/services/notification-service";
import { getReportSummary, getReportTrend, listReports } from "@/lib/services/report-service";
import { formatDate } from "@/lib/utils";

export default function StaffDashboardPage() {
  const { session } = useAuth();
  const [reports, setReports] = React.useState<Awaited<ReturnType<typeof listReports>>>([]);
  const [notifications, setNotifications] = React.useState<Awaited<ReturnType<typeof listNotifications>>>([]);

  React.useEffect(() => {
    if (!session) return;
    Promise.all([listReports({ session }), listNotifications()])
      .then(([nextReports, nextNotifications]) => {
        setReports(nextReports);
        setNotifications(nextNotifications);
      })
      .catch(() => {
        setReports([]);
        setNotifications([]);
      });
  }, [session]);

  const summary = getReportSummary(reports);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Staff"
        description="Pantau laporan kerusakan yang Anda buat, status terbaru, dan notifikasi tindak lanjut."
        action={
          <Link href="/staff/reports/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <PlusCircle className="h-4 w-4" />
              Buat Laporan Baru
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Laporan" value={summary.total} detail="Semua laporan milik Anda" icon={<ClipboardList className="h-5 w-5" />} />
        <MetricCard label="Pending" value={summary.pending} detail="Menunggu tindak lanjut admin" icon={<Clock3 className="h-5 w-5" />} />
        <MetricCard label="Diproses" value={summary.inProgress} detail="Sedang dikerjakan tim terkait" icon={<Bell className="h-5 w-5" />} />
        <MetricCard label="Selesai" value={summary.resolved} detail={`${summary.rejected} laporan ditutup tanpa penyelesaian`} icon={<CheckCircle2 className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <LineChartCard
          title="Tren laporan bulanan"
          description="Volume laporan yang Anda buat berdasarkan data yang tersedia."
          data={getReportTrend(reports)}
        />

        <Card>
          <CardHeader>
            <CardTitle>Profil Staff</CardTitle>
            <CardDescription>Informasi akun yang sedang aktif.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <InfoTile label="Nama" value={session?.name ?? "-"} />
            <InfoTile label="Departemen" value={session?.department ?? "-"} />
            <InfoTile label="Login terakhir" value={session ? formatDate(session.lastLoginAt) : "-"} />
            <InfoTile label="Notifikasi belum dibaca" value={`${notifications.filter((item) => !item.read).length} item`} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Laporan terbaru</CardTitle>
            <CardDescription>5 laporan terbaru dengan status terkini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reports.length > 0 ? (
              reports.slice(0, 5).map((report) => (
                <div key={report.id} className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold leading-6">{report.title}</p>
                      <p className="text-sm leading-6 text-muted-foreground">{report.locationLabel}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <PriorityBadge priority={report.priority} />
                      <StatusBadge status={report.status} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <span>{report.reportNumber}</span>
                    <span>{formatDate(report.createdAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada laporan untuk ditampilkan.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifikasi status</CardTitle>
            <CardDescription>Pembaruan laporan yang belum dibaca dan riwayat terbaru.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/70 bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium leading-6">{item.title}</p>
                    {!item.read ? <span className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada notifikasi.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}
