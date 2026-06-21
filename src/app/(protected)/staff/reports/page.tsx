"use client";

import * as React from "react";
import Link from "next/link";
import { Download, PlusCircle } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { ReportTable } from "@/components/reports/report-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { REPORT_CATEGORY_OPTIONS, REPORT_PRIORITY_OPTIONS, REPORT_STATUS_OPTIONS } from "@/lib/constants/app";
import { useAuth } from "@/hooks/use-auth";
import { exportReports, getReportSummary, listReports } from "@/lib/services/report-service";
import type { ReportFilterState } from "@/lib/types";

const PAGE_SIZE = 5;

export default function StaffReportsPage() {
  const { session } = useAuth();
  const [page, setPage] = React.useState(1);
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

  React.useEffect(() => {
    if (!session) return;
    listReports({ session, filters })
      .then((data) => setReports(data))
      .catch(() => setReports([]));
  }, [filters, session]);

  if (!session) return null;

  const summary = getReportSummary(reports);
  const totalPages = Math.max(1, Math.ceil(reports.length / PAGE_SIZE));
  const paginated = reports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const updateFilter =
    (field: keyof ReportFilterState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setPage(1);
      setFilters((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const handleExport = async (format: "excel" | "pdf") => {
    if (reports.length === 0) {
      toast.error("Belum ada data laporan yang bisa diekspor.");
      return;
    }

    try {
      await exportReports({ reports, format });
      toast.success(format === "excel" ? "File Excel laporan disiapkan." : "File PDF laporan disiapkan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ekspor laporan gagal.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Laporan"
        description="Portal staff hanya menampilkan laporan yang Anda buat sendiri. Admin dan Super Admin melihat seluruh laporan sistem."
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
            <Link href="/staff/reports/new">
              <Button>
                <PlusCircle className="h-4 w-4" />
                Buat Laporan
              </Button>
            </Link>
          </div>
        }
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Badge variant="info">Ruang lingkup personal</Badge>
              <p className="text-sm text-muted-foreground">
                Jika jumlah laporan di portal staff berbeda dengan portal admin atau super admin, itu normal karena Anda hanya melihat laporan milik akun ini.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryTile label="Total" value={summary.total} />
              <SummaryTile label="Pending" value={summary.pending} />
              <SummaryTile label="Diproses" value={summary.inProgress} />
              <SummaryTile label="Selesai" value={summary.resolved} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-5">
          <Input placeholder="Cari nomor laporan / judul" value={filters.search} onChange={updateFilter("search")} />
          <Select value={filters.status} onChange={updateFilter("status")}>
            <option value="all">Semua status</option>
            {REPORT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select value={filters.priority} onChange={updateFilter("priority")}>
            <option value="all">Semua prioritas</option>
            {REPORT_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select value={filters.category} onChange={updateFilter("category")}>
            <option value="all">Semua kategori</option>
            {REPORT_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Input placeholder="Filter lokasi" value={filters.location} onChange={updateFilter("location")} />
        </CardContent>
      </Card>

      <ReportTable reports={paginated} role="staff" />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Menampilkan {paginated.length} dari {reports.length} laporan
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
            Sebelumnya
          </Button>
          <span className="text-sm text-muted-foreground">
            Halaman {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-center">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
