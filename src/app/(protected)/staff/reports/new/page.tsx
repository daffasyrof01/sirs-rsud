"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldErrors, type Resolver } from "react-hook-form";
import { z } from "zod";
import Image from "next/image";
import { AlertTriangle, Camera, CheckCircle2, ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { REPORT_CATEGORY_OPTIONS, REPORT_PRIORITY_OPTIONS } from "@/lib/constants/app";
import { useAuth } from "@/hooks/use-auth";
import { clearDraft, createReport, getDraft, saveDraft } from "@/lib/services/report-service";
import type { DraftReportForm, ReportAttachment } from "@/lib/types";
import { toLocalDateTimeInputValue } from "@/lib/utils";

const reportSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter."),
  category: z.enum(["listrik", "plumbing", "struktural", "peralatan_medis", "hvac", "it_jaringan", "lainnya"]),
  location: z.string().min(5, "Masukkan lokasi kerusakan secara spesifik."),
  priority: z.enum(["low", "medium", "high", "emergency"]),
  description: z.string().min(10, "Deskripsi minimal 10 karakter."),
  occurredAt: z.string().min(1, "Pilih tanggal dan waktu kejadian."),
});

type ReportFormValues = z.infer<typeof reportSchema>;

const reportFormResolver: Resolver<ReportFormValues> = async (values) => {
  const parsed = reportSchema.safeParse(values);

  if (parsed.success) {
    return {
      values: parsed.data,
      errors: {},
    };
  }

  const errors = {} as FieldErrors<ReportFormValues>;

  for (const issue of parsed.error.issues) {
    const [field] = issue.path;
    if (typeof field !== "string" || field in errors) continue;

    errors[field as keyof ReportFormValues] = {
      type: issue.code,
      message: issue.message,
    };
  }

  return {
    values: {},
    errors,
  };
};

export default function StaffCreateReportPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [attachments, setAttachments] = React.useState<ReportAttachment[]>([]);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [submitPhase, setSubmitPhase] = React.useState<"idle" | "submitting" | "success">("idle");
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null);
  const galleryInputRef = React.useRef<HTMLInputElement | null>(null);
  const redirectTimeoutRef = React.useRef<number | null>(null);

  const form = useForm<ReportFormValues>({
    resolver: reportFormResolver,
    mode: "onChange",
    defaultValues: {
      title: "",
      category: "listrik",
      location: "",
      priority: "medium",
      description: "",
      occurredAt: toLocalDateTimeInputValue(),
    },
  });

  React.useEffect(() => {
    if (!session) return;
    const draft = getDraft(session.id);
    if (!draft) return;
    const legacyDraft = draft as DraftReportForm & { building?: string; roomDetail?: string };
    form.reset({
      title: draft.title,
      category: draft.category,
      location: draft.location ?? [legacyDraft.building, legacyDraft.roomDetail].filter(Boolean).join(", "),
      priority: draft.priority,
      description: draft.description,
      occurredAt: draft.occurredAt,
    });
    setAttachments(draft.attachments);
  }, [form, session]);

  React.useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  if (!session) return null;

  const currentValues = form.watch();

  const persistDraft = () => {
    const draft: DraftReportForm = {
      ...currentValues,
      attachments,
    };
    saveDraft(session.id, draft);
    toast.success("Draft laporan berhasil disimpan.");
  };

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const merged = [...attachments];
    if (merged.length + files.length > 5) {
      toast.error("Maksimal 5 foto untuk setiap laporan.");
      event.target.value = "";
      return;
    }

    const nextFiles = await Promise.all(
      files.map(
        (file) =>
          new Promise<ReportAttachment>((resolve, reject) => {
            if (file.size > 4 * 1024 * 1024) {
              reject(new Error(`File ${file.name} melebihi batas 4 MB.`));
              return;
            }
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                id: crypto.randomUUID(),
                name: file.name,
                sizeLabel: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                previewUrl: String(reader.result),
              });
            reader.onerror = () => reject(new Error(`Gagal membaca file ${file.name}.`));
            reader.readAsDataURL(file);
          }),
      ),
    ).catch((error: Error) => {
      toast.error(error.message);
      return null;
    });

    event.target.value = "";
    if (!nextFiles) return;
    setAttachments([...merged, ...nextFiles]);
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId));
    toast.success("Foto dihapus dari draft laporan.");
  };

  const submitForm = form.handleSubmit(() => setConfirmOpen(true));

  const confirmSubmit = async () => {
    if (submitPhase !== "idle") return;

    setSubmitPhase("submitting");

    try {
      const nextReport = await createReport({
        values: {
          ...form.getValues(),
          attachments,
        },
      });
      clearDraft(session.id);
      toast.success(`Laporan berhasil dikirim dengan nomor ${nextReport.reportNumber}.`);
      setSubmitPhase("success");
      redirectTimeoutRef.current = window.setTimeout(() => {
        setConfirmOpen(false);
        router.push(`/staff/reports/${nextReport.id}`);
      }, 900);
    } catch (error) {
      setSubmitPhase("idle");
      toast.error(error instanceof Error ? error.message : "Laporan gagal dikirim.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Laporan Baru"
        description="Isi detail kerusakan secara lengkap. Data pelapor terisi otomatis berdasarkan akun staff yang sedang login."
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Form Laporan Kerusakan</CardTitle>
            <CardDescription>Validasi berjalan real-time sebelum laporan dikirim.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={submitForm}>
              <div className="grid gap-5 md:grid-cols-2">
                <Field>
                  <Label htmlFor="title">Judul Kerusakan</Label>
                  <Input id="title" {...form.register("title")} />
                  <ErrorMessage message={form.formState.errors.title?.message} />
                </Field>
                <Field>
                  <Label htmlFor="category">Kategori</Label>
                  <Select id="category" {...form.register("category")}>
                    {REPORT_CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor="location">Lokasi Kerusakan</Label>
                  <Input id="location" placeholder="Contoh: Lantai 2, Ruang Operasi 3" {...form.register("location")} />
                  <ErrorMessage message={form.formState.errors.location?.message} />
                </Field>
                <Field>
                  <Label htmlFor="priority">Prioritas</Label>
                  <Select id="priority" {...form.register("priority")}>
                    {REPORT_PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor="occurredAt">Tanggal & Waktu Kejadian</Label>
                  <Input id="occurredAt" type="datetime-local" {...form.register("occurredAt")} />
                  <ErrorMessage message={form.formState.errors.occurredAt?.message} />
                </Field>
              </div>

              <Field>
                <Label htmlFor="description">Deskripsi Lengkap</Label>
                <Textarea id="description" {...form.register("description")} />
                <ErrorMessage message={form.formState.errors.description?.message} />
              </Field>

              <Field>
                <Label htmlFor="attachments">Upload Foto Bukti</Label>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                    Ambil Foto
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4" />
                    Pilih dari Galeri
                  </Button>
                </div>
                <Input
                  ref={cameraInputRef}
                  id="attachments"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={handleFiles}
                />
                <Input
                  ref={galleryInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/*"
                  multiple
                  className="sr-only"
                  onChange={handleFiles}
                />
                <p className="text-xs text-muted-foreground">
                  Ambil foto langsung dari kamera atau pilih dari galeri. Maks. 5 foto, JPG/PNG/WEBP, 4 MB per file.
                </p>
                {attachments.length > 0 ? (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="overflow-hidden rounded-2xl border border-border/70 bg-muted/30">
                        <div className="relative aspect-[4/3] bg-background/50">
                          <Image
                            src={attachment.previewUrl}
                            alt={attachment.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        </div>
                        <div className="flex items-start justify-between gap-3 p-3">
                          <div className="min-w-0 space-y-1">
                            <p className="truncate font-medium">{attachment.name}</p>
                            <p className="text-sm text-muted-foreground">{attachment.sizeLabel}</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeAttachment(attachment.id)}
                            aria-label={`Hapus foto ${attachment.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </Field>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={persistDraft}>
                  <Save className="h-4 w-4" />
                  Simpan Draft
                </Button>
                <Button type="submit">Kirim Laporan</Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    clearDraft(session.id);
                    form.reset();
                    setAttachments([]);
                    toast.success("Draft dibersihkan.");
                  }}
                >
                  Bersihkan Draft
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Pelapor</CardTitle>
              <CardDescription>Terisi otomatis dari akun staff yang aktif.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoTile label="Nama" value={session.name} />
              <InfoTile label="Departemen" value={session.department} />
              <InfoTile label="Login terakhir" value={session.lastLoginAt} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Panduan Pengisian</CardTitle>
              <CardDescription>Pastikan laporan mudah diproses oleh admin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-warning-foreground">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <p>Gunakan prioritas Darurat hanya untuk kerusakan yang berdampak langsung pada layanan pasien.</p>
                </div>
              </div>
              <p>Tambahkan detail lokasi yang spesifik agar tim teknis dapat langsung menuju titik kerusakan.</p>
              <p>Deskripsi minimal 10 karakter membantu admin memahami kerusakan lebih cepat.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (submitPhase === "idle") {
            setConfirmOpen(open);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {submitPhase === "success" ? "Laporan Terkirim" : "Konfirmasi Pengiriman Laporan"}
            </DialogTitle>
            <DialogDescription>
              {submitPhase === "success"
                ? "Laporan Anda berhasil masuk ke sistem dan akan segera diproses."
                : "Pastikan seluruh detail kerusakan sudah benar. Setelah dikirim, laporan akan masuk ke dashboard admin."}
            </DialogDescription>
          </DialogHeader>
          {submitPhase === "submitting" ? (
            <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memproses dan mengirim laporan...
            </div>
          ) : submitPhase === "success" ? (
            <div className="flex items-center gap-3 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              Laporan berhasil dikirim.
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={submitPhase !== "idle"}>
              Kembali
            </Button>
            <Button onClick={confirmSubmit} disabled={submitPhase !== "idle"}>
              {submitPhase === "submitting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : submitPhase === "success" ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Laporan Terkirim
                </>
              ) : (
                "Konfirmasi & Kirim"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}
