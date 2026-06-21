"use client";

import * as React from "react";
import { CheckCircle2, MailWarning, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { EMAIL_OTP_ENABLED } from "@/lib/constants/features";

export function EmailVerificationBanner() {
  const { session, refreshSession } = useAuth();
  const [otp, setOtp] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [hasSent, setHasSent] = React.useState(false);

  if (!EMAIL_OTP_ENABLED || !session || session.emailVerified || (session.role !== "admin" && session.role !== "superadmin")) {
    return null;
  }

  const sendCode = async () => {
    setSending(true);
    try {
      const response = await fetch("/api/email-verification/send", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{}",
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Gagal mengirim kode verifikasi.");
      }
      setHasSent(true);
      toast.success("Kode verifikasi sudah dikirim ke email Anda.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengirim kode verifikasi.");
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async () => {
    if (!otp.trim()) {
      toast.error("Masukkan kode OTP terlebih dahulu.");
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch("/api/email-verification/verify", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otp }),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Gagal memverifikasi email.");
      }

      setOtp("");
      setHasSent(false);
      toast.success("Email berhasil diverifikasi.");
      await refreshSession();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memverifikasi email.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card className="border-amber-500/30 bg-amber-500/10">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <MailWarning className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-[0.18em]">Verifikasi email</span>
        </div>
        <CardTitle>Email admin belum diverifikasi</CardTitle>
        <CardDescription>
          Akun {session.email} perlu diverifikasi sebelum dipakai penuh. Kirim kode OTP ke email lalu masukkan di bawah.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={sendCode} disabled={sending} variant="default">
            {sending ? (
              <>
                <RefreshCcw className="h-4 w-4 animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <MailWarning className="h-4 w-4" />
                {hasSent ? "Kirim ulang OTP" : "Kirim OTP"}
              </>
            )}
          </Button>
          <Button type="button" onClick={verifyCode} disabled={verifying || !otp.trim()} variant="secondary">
            {verifying ? (
              <>
                <RefreshCcw className="h-4 w-4 animate-spin" />
                Memverifikasi...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Verifikasi kode
              </>
            )}
          </Button>
        </div>

        <div className="max-w-md space-y-2">
          <Input
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Masukkan kode OTP 6 digit"
            maxLength={6}
          />
          <p className="text-xs text-muted-foreground">
            Jika email tidak masuk, cek folder spam atau klik kirim ulang.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
