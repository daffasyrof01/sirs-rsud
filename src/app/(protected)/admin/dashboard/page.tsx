"use client";

import * as React from "react";
import { AlertTriangle, Clock3, FileBarChart2, MapPinned } from "lucide-react";

import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";
import { LineChartCard } from "@/components/charts/line-chart-card";
import { PieChartCard } from "@/components/charts/pie-chart-card";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { PriorityBadge, StatusBadge } from "@/components/reports/report-badges";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import {
  filterReportsByDepartments,
  getAverageHandlingTime,
  getCategoryBreakdown,
  getDepartmentBreakdown,
  getReportSummary,
  getReportTrend,
  listReports,
} from "@/lib/services/report-service";
import { listRegisteredDepartments } from "@/lib/services/department-service";
import { formatDate } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { session } = useAuth();
  const [reports, setReports] = React.useState<
    Awaited<ReturnType<typeof listReports>>
  >([]);
  const [registeredDepartments, setRegisteredDepartments] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!session) return;
    Promise.all([listReports(), listRegisteredDepartments()])
      .then(([data, departments]) => {
        setReports(data);
        setRegisteredDepartments(departments);
      })
      .catch(() => {
        setReports([]);
        setRegisteredDepartments([]);
      });
  }, [session]);

  const urgentReports = reports.filter(
    (report) => report.priority === "high" || report.priority === "emergency",
  );
  const registeredDepartmentReports = filterReportsByDepartments(reports, registeredDepartments);
  const departmentBreakdown = getDepartmentBreakdown(registeredDepartmentReports);
  const summary = getReportSummary(reports);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Admin"
        description="Ringkasan makro seluruh laporan kerusakan, prioritas tinggi, dan performa tindak lanjut."
      />

      <EmailVerificationBanner />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Laporan Masuk"
          value={summary.total}
          detail="Semua laporan aktif dan historis"
          icon={<FileBarChart2 className="h-5 w-5" />}
        />
        <MetricCard
          label="Pending"
          value={summary.pending}
          detail="Menunggu triase admin"
          icon={<Clock3 className="h-5 w-5" />}
        />
        <MetricCard
          label="Dalam Proses"
          value={summary.inProgress}
          detail="Sedang dikerjakan tim teknis"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <MetricCard
          label="Selesai"
          value={summary.resolved}
          detail={`${summary.resolvedThisMonth} selesai bulan ini • rata-rata ${getAverageHandlingTime(reports)}`}
          icon={<MapPinned className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PieChartCard
          title="Laporan per kategori"
          description="Distribusi laporan berdasarkan jenis kerusakan dari departemen user yang terdaftar."
          data={getCategoryBreakdown(registeredDepartmentReports)}
        />
        <LineChartCard
          title="Tren laporan bulanan"
          description="Pantau volume laporan sepanjang periode data yang tersedia."
          data={getReportTrend(reports)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Laporan yang membutuhkan tindakan segera</CardTitle>
            <CardDescription>
              Prioritas tinggi dan darurat yang perlu dipantau ketat.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {urgentReports.length > 0 ? (
              urgentReports.slice(0, 5).map((report) => (
                <div
                  key={report.id}
                  className="rounded-2xl border border-border/70 bg-muted/30 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold leading-6">{report.title}</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {report.reporterName} | {report.locationLabel}
                      </p>
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
              <p className="text-sm text-muted-foreground">
                Tidak ada laporan prioritas tinggi saat ini.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan departemen</CardTitle>
            <CardDescription>
              Heatmap sederhana berdasarkan jumlah laporan per departemen yang terdaftar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {departmentBreakdown.length > 0 ? (
              departmentBreakdown.map((item) => (
                <div key={item.department} className="space-y-2">
                  <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className="break-words">{item.department}</span>
                    <span className="font-medium">{item.total} laporan</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-chart-1 to-chart-2"
                      style={{ width: `${Math.min(100, item.total * 18)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Belum ada data lokasi untuk divisualisasikan.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
