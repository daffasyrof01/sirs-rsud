"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { ReportDetail } from "@/components/reports/report-detail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { deleteReport, getReportById, updateReportStatus } from "@/lib/services/report-service";
import type { ReportStatus } from "@/lib/types";

export default function SuperAdminReportDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [report, setReport] = React.useState<Awaited<ReturnType<typeof getReportById>> | null>(null);
  const [pendingStatus, setPendingStatus] = React.useState<Extract<ReportStatus, "in_progress" | "resolved"> | null>(null);
  const [statusFeedback, setStatusFeedback] = React.useState<string | null>(null);

  const reload = React.useCallback(() => {
    return getReportById(params.id)
      .then((data) => setReport(data))
      .catch(() => setReport(null));
  }, [params.id]);

  React.useEffect(() => {
    if (!session) return;
    reload();
  }, [reload, session]);

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
          actor: session,
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

  if (!session) return null;

  if (!report) {
    return (
      <div className="space-y-6">
        <PageHeader title="Detail Laporan" description="Laporan tidak ditemukan." />
        <Link href="/superadmin/reports">
          <Button variant="outline">Kembali ke daftar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detail Laporan Super Admin"
        description="Akses penuh terhadap data laporan, lampiran, dan audit perubahan status."
        action={
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/superadmin/reports" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">Kembali</Button>
            </Link>
            <Button variant="destructive" className="w-full sm:w-auto" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" />
              Hapus Permanen
            </Button>
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Ubah Status</CardTitle>
          <CardDescription>Update progres laporan langsung dari halaman detail.</CardDescription>
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
                  note: "Super Admin memindahkan status ke Diproses.",
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
                  note: "Super Admin menutup laporan karena pekerjaan telah selesai.",
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
      <ReportDetail report={report} />

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi penghapusan</DialogTitle>
            <DialogDescription>Anda akan menghapus laporan {report.reportNumber} secara permanen.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await deleteReport(report.id);
                toast.success("Laporan telah dihapus permanen.");
                router.push("/superadmin/reports");
              }}
            >
              Hapus Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
