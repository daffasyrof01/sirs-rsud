"use client";

import * as React from "react";
import { Activity, ClipboardList, Clock3, Database, ShieldCheck, Users } from "lucide-react";

import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";
import { LineChartCard } from "@/components/charts/line-chart-card";
import { PieChartCard } from "@/components/charts/pie-chart-card";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { listAuditLogs } from "@/lib/services/audit-service";
import { listRegisteredDepartments } from "@/lib/services/department-service";
import { filterReportsByDepartments, getCategoryBreakdown, getReportSummary, getReportTrend, listReports } from "@/lib/services/report-service";
import { listUsers } from "@/lib/services/user-service";
import type { AuditLogItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function SuperAdminDashboardPage() {
  const { session } = useAuth();
  const [reports, setReports] = React.useState<Awaited<ReturnType<typeof listReports>>>([]);
  const [users, setUsers] = React.useState<Awaited<ReturnType<typeof listUsers>>>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLogItem[]>([]);
  const [registeredDepartments, setRegisteredDepartments] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!session) return;

    Promise.all([listReports({ session }), listUsers(), listAuditLogs(8), listRegisteredDepartments()])
      .then(([reportData, userData, auditData, departmentData]) => {
        setReports(reportData);
        setUsers(userData);
        setAuditLogs(auditData);
        setRegisteredDepartments(departmentData);
      })
      .catch(() => {
        setReports([]);
        setUsers([]);
        setAuditLogs([]);
        setRegisteredDepartments([]);
      });
  }, [session]);

  if (!session) return null;

  const activeUsers = users.filter((user) => user.status === "active");
  const registeredDepartmentReports = filterReportsByDepartments(reports, registeredDepartments);
  const summary = getReportSummary(reports);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Super Admin"
        description="Pantau kesehatan sistem, aktivitas login, jejak audit, dan ringkasan pengguna aktif di seluruh platform."
      />

      <EmailVerificationBanner />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Laporan" value={summary.total} detail="Seluruh laporan lintas portal" icon={<ClipboardList className="h-5 w-5" />} />
        <MetricCard label="Pending" value={summary.pending} detail="Menunggu tindak lanjut admin" icon={<Clock3 className="h-5 w-5" />} />
        <MetricCard label="Diproses" value={summary.inProgress} detail="Sedang dikerjakan tim terkait" icon={<Activity className="h-5 w-5" />} />
        <MetricCard label="Selesai" value={summary.resolved} detail={`${summary.resolvedThisMonth} selesai bulan ini`} icon={<ShieldCheck className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pengguna Aktif" value={activeUsers.length} detail="Admin dan staff aktif" icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Admin Aktif" value={activeUsers.filter((user) => user.role === "admin").length} detail="Siap memonitor laporan" icon={<ShieldCheck className="h-5 w-5" />} />
        <MetricCard label="Staff Aktif" value={activeUsers.filter((user) => user.role === "staff").length} detail="Dapat membuat laporan baru" icon={<Activity className="h-5 w-5" />} />
        <MetricCard label="Audit Tercatat" value={auditLogs.length} detail="Event terbaru yang berhasil dicatat" icon={<Database className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PieChartCard
          title="Komposisi kategori laporan"
          description="Distribusi laporan dari departemen user yang terdaftar di sistem."
          data={getCategoryBreakdown(registeredDepartmentReports)}
        />
        <LineChartCard title="Aktivitas laporan sistem" description="Tren laporan di seluruh organisasi rumah sakit." data={getReportTrend(reports)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas login terbaru</CardTitle>
            <CardDescription>Daftar akun dengan aktivitas terbaru di platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {users.length > 0 ? (
              users.slice(0, 6).map((user) => (
                <div key={user.id} className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {user.role} | {user.department}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(user.lastLoginAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada aktivitas login yang tercatat.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktivitas sistem terbaru</CardTitle>
            <CardDescription>Jejak aksi penting pengguna dan sistem untuk kebutuhan audit internal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getAuditBadgeVariant(log.entityType)}>{getAuditLabel(log.entityType)}</Badge>
                        <span className="text-xs text-muted-foreground">{log.actorName}</span>
                      </div>
                      <p className="text-sm leading-6">{log.description}</p>
                      {log.targetLabel ? (
                        <p className="text-xs text-muted-foreground">Target: {log.targetLabel}</p>
                      ) : null}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada aktivitas sistem yang tercatat.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kesehatan sistem</CardTitle>
          <CardDescription>Widget status infrastruktur dan kesiapan operasional sistem.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <HealthTile label="Uptime aplikasi" value="99.5%" />
          <HealthTile label="Replikasi database" value="Normal" />
          <HealthTile label="Backup harian" value="Berhasil 02:00 WIB" />
          <HealthTile label="Audit log" value={auditLogs.length > 0 ? `${auditLogs.length} event terbaru tersedia` : "Belum ada event"} />
        </CardContent>
      </Card>
    </div>
  );
}

function HealthTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}

function getAuditBadgeVariant(entityType: AuditLogItem["entityType"]) {
  switch (entityType) {
    case "auth":
      return "info";
    case "report":
      return "warning";
    case "user":
      return "default";
    case "notification":
      return "secondary";
    case "system":
      return "destructive";
  }
}

function getAuditLabel(entityType: AuditLogItem["entityType"]) {
  switch (entityType) {
    case "auth":
      return "Auth";
    case "report":
      return "Laporan";
    case "user":
      return "Pengguna";
    case "notification":
      return "Notifikasi";
    case "system":
      return "Sistem";
  }
}
