"use client";

import Link from "next/link";

import { PriorityBadge, StatusBadge } from "@/components/reports/report-badges";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatDate } from "@/lib/utils";
import type { Report, Role } from "@/lib/types";

interface ReportTableProps {
  reports: Report[];
  role: Role;
  onStatusChange?: (report: Report, status: Report["status"]) => Promise<void> | void;
  onDelete?: (report: Report) => void;
  pendingStatusByReportId?: Partial<Record<string, Report["status"]>>;
}

export function ReportTable({ reports, role, onStatusChange, onDelete, pendingStatusByReportId }: ReportTableProps) {
  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-48 items-center justify-center text-center text-muted-foreground">
          Belum ada data laporan yang sesuai filter.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4 md:hidden">
        {reports.map((report) => {
          const pendingStatus = pendingStatusByReportId?.[report.id];
          const isUpdatingStatus = Boolean(pendingStatus);
          const canMarkInProgress = report.status !== "in_progress" && report.status !== "resolved";
          const canMarkResolved = report.status !== "resolved";

          return (
            <Card key={report.id}>
              <CardContent className="space-y-4 p-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={report.status} />
                    <PriorityBadge priority={report.priority} />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{report.reportNumber}</p>
                    <p className="mt-1 text-base font-semibold leading-6">{report.title}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {role !== "staff" ? <MobileInfo label="Pelapor" value={report.reporterName} /> : null}
                  <MobileInfo label="Lokasi" value={report.locationLabel} />
                  {role !== "staff" ? <MobileInfo label="Assigned To" value={report.assignedTo?.name ?? "-"} /> : null}
                  <MobileInfo label="Tanggal" value={formatDate(report.createdAt)} />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Link
                    href={`/${role}/reports/${report.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
                  >
                    Detail
                  </Link>
                  {role !== "staff" && onStatusChange && canMarkInProgress ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={isUpdatingStatus}
                      onClick={() => void onStatusChange(report, "in_progress")}
                    >
                      {pendingStatus === "in_progress" ? "Memproses..." : "Proses"}
                    </Button>
                  ) : null}
                  {role !== "staff" && onStatusChange && canMarkResolved ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={isUpdatingStatus}
                      onClick={() => void onStatusChange(report, "resolved")}
                    >
                      {pendingStatus === "resolved" ? "Menyimpan..." : "Selesai"}
                    </Button>
                  ) : null}
                  {role === "superadmin" && onDelete ? (
                    <Button size="sm" variant="destructive" className="w-full" onClick={() => onDelete(report)}>
                      Hapus
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="hidden md:block">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Laporan</TableHead>
                {role !== "staff" ? <TableHead>Pelapor</TableHead> : null}
                <TableHead>Judul</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Prioritas</TableHead>
                <TableHead>Status</TableHead>
                {role !== "staff" ? <TableHead>Assigned To</TableHead> : null}
                <TableHead>Tanggal</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => {
                const pendingStatus = pendingStatusByReportId?.[report.id];
                const isUpdatingStatus = Boolean(pendingStatus);
                const canMarkInProgress = report.status !== "in_progress" && report.status !== "resolved";
                const canMarkResolved = report.status !== "resolved";

                return (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.reportNumber}</TableCell>
                    {role !== "staff" ? <TableCell>{report.reporterName}</TableCell> : null}
                    <TableCell className="min-w-[220px]">{report.title}</TableCell>
                    <TableCell className="min-w-[220px]">{report.locationLabel}</TableCell>
                    <TableCell>
                      <PriorityBadge priority={report.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={report.status} />
                    </TableCell>
                    {role !== "staff" ? <TableCell>{report.assignedTo?.name ?? "-"}</TableCell> : null}
                    <TableCell>{formatDate(report.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/${role}/reports/${report.id}`}
                          className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"
                        >
                          Detail
                        </Link>
                        {role !== "staff" && onStatusChange ? (
                          <>
                            {canMarkInProgress ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isUpdatingStatus}
                                onClick={() => void onStatusChange(report, "in_progress")}
                              >
                                {pendingStatus === "in_progress" ? "Memproses..." : "Proses"}
                              </Button>
                            ) : null}
                            {canMarkResolved ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isUpdatingStatus}
                                onClick={() => void onStatusChange(report, "resolved")}
                              >
                                {pendingStatus === "resolved" ? "Menyimpan..." : "Selesai"}
                              </Button>
                            ) : null}
                          </>
                        ) : null}
                        {role === "superadmin" && onDelete ? (
                          <Button size="sm" variant="destructive" onClick={() => onDelete(report)}>
                            Hapus
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

function MobileInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium leading-6">{value}</p>
    </div>
  );
}
