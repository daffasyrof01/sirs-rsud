"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { ReportDetail } from "@/components/reports/report-detail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import {
  assignReport,
  getReportById,
  updateReportSparePart,
  updateReportStatus,
} from "@/lib/services/report-service";
import type { ReportStatus } from "@/lib/types";

export default function AdminReportDetailPage() {
  const params = useParams<{ id: string }>();
  const { session } = useAuth();
  const [assignName, setAssignName] = React.useState("Tim Teknisi Internal");
  const [assignmentNote, setAssignmentNote] = React.useState("");
  const [sparePart, setSparePart] = React.useState("");
  const [report, setReport] = React.useState<Awaited<ReturnType<typeof getReportById>> | null>(null);
  const [pendingStatus, setPendingStatus] = React.useState<Extract<ReportStatus, "in_progress" | "resolved"> | null>(null);
  const [statusFeedback, setStatusFeedback] = React.useState<string | null>(null);

  const reload = React.useCallback(() => {
    return getReportById(params.id)
      .then((data) => {
        setReport(data);
      })
      .catch(() => {
        setReport(null);
      });
  }, [params.id]);

  const handleStatusChange = React.useCallback(
    async ({
      status,
      note,
      successMessage,
    }: {
      status: Extract<ReportStatus, "in_progress" | "resolved">;
      note: string;
      successMessage: string;
    }) => {
      if (!session || !report || pendingStatus) return;

      if (report.status === status) {
        setStatusFeedback(successMessage);
        return;
      }

      setPendingStatus(status);
      setStatusFeedback(null);

      try {
        const updatedReport = await updateReportStatus({
          reportId: report.id,
          status,
          note,
        });
        setReport(updatedReport);
        setStatusFeedback(successMessage);
        toast.success(successMessage);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Status laporan gagal diperbarui.");
      } finally {
        setPendingStatus(null);
      }
    },
    [pendingStatus, report, session],
  );

  React.useEffect(() => {
    reload();
  }, [reload]);

  React.useEffect(() => {
    if (!report) return;

    setAssignName(report.assignedTo?.name ?? "Tim Teknisi Internal");
    setAssignmentNote(report.assignedTo?.note ?? "");
    setSparePart(report.sparePart ?? "");
  }, [report]);

  if (!session) return null;

  if (!report) {
    return (
      <div className="space-y-6">
        <PageHeader title="Detail Laporan" description="Laporan tidak ditemukan." />
        <Link href="/admin/reports">
          <Button variant="outline">Kembali ke daftar</Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title="Detail Laporan Admin"
        description="Tinjau detail, tugaskan ke teknisi, isi catatan penugasan, kelola spare part, dan ubah status laporan."
        action={
          <Link href="/admin/reports" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">Kembali ke daftar</Button>
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ReportDetail report={report} />
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ubah Status</CardTitle>
              <CardDescription>Update progres penanganan laporan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {statusFeedback ? (
                <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-success">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{statusFeedback}</p>
                </div>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                disabled={Boolean(pendingStatus) || report.status === "in_progress" || report.status === "resolved"}
                onClick={() => {
                  void handleStatusChange({
                    status: "in_progress",
                    note: "Status diubah menjadi diproses oleh admin.",
                    successMessage: "Status laporan berhasil diperbarui ke Diproses.",
                  });
                }}
              >
                {pendingStatus === "in_progress" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Tandai Diproses"
                )}
              </Button>
              <Button
                className="w-full sm:w-auto"
                disabled={Boolean(pendingStatus) || report.status === "resolved"}
                onClick={() => {
                  void handleStatusChange({
                    status: "resolved",
                    note: "Pekerjaan selesai dan laporan ditutup.",
                    successMessage: "Laporan berhasil ditandai Selesai.",
                  });
                }}
              >
                {pendingStatus === "resolved" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Tandai Selesai"
                )}
              </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Penugasan Teknisi</CardTitle>
              <CardDescription>Tentukan petugas atau vendor yang bertanggung jawab.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[1.25fr_0.95fr]">
                <div className="space-y-2">
                  <Label htmlFor="assign-name">Assigned To</Label>
                  <Input id="assign-name" value={assignName} onChange={(event) => setAssignName(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assign-note">Tambah Catatan</Label>
                  <Textarea
                    id="assign-note"
                    value={assignmentNote}
                    onChange={(event) => setAssignmentNote(event.target.value)}
                    placeholder="Tambahkan catatan singkat untuk penugasan..."
                    className="min-h-24 resize-none"
                  />
                </div>
              </div>
              <Button
                className="w-full sm:w-auto"
                onClick={async () => {
                  await assignReport({
                    reportId: report.id,
                    assigneeName: assignName,
                    note: assignmentNote,
                  });
                  await reload();
                  toast.success("Penugasan berhasil diperbarui.");
                }}
              >
                Simpan Penugasan
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spare Part</CardTitle>
              <CardDescription>Isi spare part yang dipakai untuk menyelesaikan laporan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={sparePart}
                onChange={(event) => setSparePart(event.target.value)}
                placeholder="Tulis spare part yang digunakan..."
                className="min-h-32"
              />
              <Button
                className="w-full sm:w-auto"
                onClick={async () => {
                  await updateReportSparePart({
                    reportId: report.id,
                    sparePart,
                  });
                  await reload();
                  toast.success("Spare part berhasil diperbarui.");
                }}
              >
                Simpan Spare Part
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
