import Image from "next/image";

import { PriorityBadge, StatusBadge } from "@/components/reports/report-badges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import type { Report } from "@/lib/types";

export function ReportDetail({ report }: { report: Report }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="break-words text-xl leading-8 sm:text-2xl">{report.title}</CardTitle>
            <CardDescription>{report.reportNumber}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <StatusBadge status={report.status} />
              <PriorityBadge priority={report.priority} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoBlock label="Pelapor" value={report.reporterName} />
              <InfoBlock label="Departemen" value={report.reporterDepartment} />
              <InfoBlock label="Lokasi" value={report.locationLabel} />
              <InfoBlock label="Tanggal kejadian" value={formatDate(report.occurredAt)} />
              <InfoBlock label="Assigned To" value={report.assignedTo?.name ?? "-"} />
              <InfoBlock label="Catatan Penugasan" value={report.assignedTo?.note ?? "-"} />
              <InfoBlock label="Spare Part" value={report.sparePart || "-"} />
              <InfoBlock label="Diperbarui" value={formatDate(report.updatedAt)} />
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-semibold">Deskripsi Lengkap</p>
              <p className="break-words text-sm leading-7 text-muted-foreground">{report.description}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Foto Bukti</CardTitle>
            <CardDescription>Lampiran kerusakan yang diunggah staff.</CardDescription>
          </CardHeader>
          <CardContent>
            {report.attachments.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {report.attachments.map((attachment) => (
                  <div key={attachment.id} className="overflow-hidden rounded-2xl border border-border/70 bg-muted/30">
                    <Image
                      src={attachment.previewUrl}
                      alt={attachment.name}
                      width={800}
                      height={600}
                      className="h-44 w-full object-cover sm:h-56"
                    />
                    <div className="p-4">
                      <p className="break-words font-medium">{attachment.name}</p>
                      <p className="text-sm text-muted-foreground">{attachment.sizeLabel}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Tidak ada lampiran foto pada laporan ini.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Catatan Tindak Lanjut</CardTitle>
            <CardDescription>Komentar terbaru dari tim pengelola laporan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.comments.length > 0 ? (
              report.comments.map((comment) => (
                <div key={comment.id} className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium">{comment.authorName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                  </div>
                  <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">{comment.message}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada catatan tambahan.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log Status</CardTitle>
            <CardDescription>Riwayat perubahan status laporan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.statusLog.map((log) => (
              <div key={log.id} className="rounded-2xl border border-border/70 bg-background p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={log.status} />
                  <p className="text-sm font-medium">{log.actorName}</p>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">{log.actorRole}</span>
                </div>
                <p className="mt-3 break-words text-sm leading-6 text-muted-foreground">{log.note}</p>
                <p className="mt-2 text-xs text-muted-foreground">{formatDate(log.createdAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 break-words font-medium leading-6">{value}</p>
    </div>
  );
}
