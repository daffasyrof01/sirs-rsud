"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { ReportTable } from "@/components/reports/report-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { REPORT_CATEGORY_OPTIONS, REPORT_PRIORITY_OPTIONS, REPORT_STATUS_OPTIONS } from "@/lib/constants/app";
import { useAuth } from "@/hooks/use-auth";
import { exportReports, listReports, updateReportStatus } from "@/lib/services/report-service";
import type { Report, ReportFilterState } from "@/lib/types";

export default function AdminReportsPage() {
  const { session } = useAuth();
  const [reports, setReports] = React.useState<Awaited<ReturnType<typeof listReports>>>([]);
  const [filters, setFilters] = React.useState<ReportFilterState>({
    search: "",
    status: "all",
    priority: "all",
    category: "all",
    location: "",
    dateFrom: "",
    dateTo: "",
  });
  const [pendingStatusByReportId, setPendingStatusByReportId] = React.useState<
    Partial<Record<string, Report["status"]>>
  >({});

  const loadReports = React.useCallback(async () => {
    if (!session) return;
    try {
      const data = await listReports({ session, filters });
      setReports(data);
    } catch {
      setReports([]);
    }
  }, [filters, session]);

  React.useEffect(() => {
    void loadReports();
  }, [loadReports]);

  if (!session) return null;

  const updateFilter =
    (field: keyof ReportFilterState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFilters((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const handleStatusChange = async (report: Report, status: "in_progress" | "resolved") => {
    if (pendingStatusByReportId[report.id] || report.status === status) return;

    const now = new Date().toISOString();
    const note = status === "in_progress" ? "Status diubah menjadi diproses oleh admin." : "Laporan dinyatakan selesai.";

    setPendingStatusByReportId((current) => ({
      ...current,
      [report.id]: status,
    }));

    setReports((current) =>
      current.flatMap((item) => {
        if (item.id !== report.id) return [item];
        if (filters.status !== "all" && filters.status !== status) return [];

        return [
          {
            ...item,
            status,
            updatedAt: now,
          },
        ];
      }),
    );

    try {
      await updateReportStatus({
        reportId: report.id,
        status,
        actor: session,
        note,
      });
      await loadReports();
      toast.success("Status laporan berhasil diperbarui.");
    } catch (error) {
      await loadReports();
      toast.error(error instanceof Error ? error.message : "Status laporan gagal diperbarui.");
    } finally {
      setPendingStatusByReportId((current) => {
        const next = { ...current };
        delete next[report.id];
        return next;
      });
    }
  };

  const handleExport = async (format: "excel" | "pdf" | "csv") => {
    if (reports.length === 0) {
      toast.error("Belum ada data laporan yang bisa diekspor.");
      return;
    }

    try {
      await exportReports({ reports, format });
      toast.success("File laporan disiapkan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ekspor laporan gagal.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Kerusakan"
        description="Kelola seluruh laporan dari staff, ubah status, dan ekspor data sesuai kebutuhan operasional."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => handleExport("excel")}>
              <Download className="h-4 w-4" />
              Ekspor Excel
            </Button>
            <Button variant="outline" onClick={() => handleExport("pdf")}>
              <Download className="h-4 w-4" />
              Ekspor PDF
            </Button>
            <Button variant="outline" onClick={() => handleExport("csv")}>
              <Download className="h-4 w-4" />
              Ekspor CSV
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-7">
          <div className="space-y-2">
            <Label htmlFor="report-search">Pencarian</Label>
            <Input id="report-search" placeholder="Cari laporan / pelapor" value={filters.search} onChange={updateFilter("search")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-status">Status</Label>
            <Select id="report-status" value={filters.status} onChange={updateFilter("status")}>
              <option value="all">Semua status</option>
              {REPORT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-priority">Prioritas</Label>
            <Select id="report-priority" value={filters.priority} onChange={updateFilter("priority")}>
              <option value="all">Semua prioritas</option>
              {REPORT_PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-category">Kategori</Label>
            <Select id="report-category" value={filters.category} onChange={updateFilter("category")}>
              <option value="all">Semua kategori</option>
              {REPORT_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-location">Lokasi</Label>
            <Input id="report-location" placeholder="Filter lokasi" value={filters.location} onChange={updateFilter("location")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date-from">Dari tanggal</Label>
            <Input id="date-from" type="date" value={filters.dateFrom} onChange={updateFilter("dateFrom")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date-to">Sampai tanggal</Label>
            <Input id="date-to" type="date" value={filters.dateTo} onChange={updateFilter("dateTo")} />
          </div>
        </CardContent>
      </Card>

      <ReportTable
        reports={reports}
        role="admin"
        pendingStatusByReportId={pendingStatusByReportId}
        onStatusChange={(report, status) => {
          if (status === "in_progress" || status === "resolved") {
            return handleStatusChange(report, status);
          }
        }}
      />
    </div>
  );
}
