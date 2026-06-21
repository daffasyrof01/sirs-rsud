"use client";

import * as React from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/services/auth-service";

export function ForgotPasswordCard() {
  const [identifier, setIdentifier] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await requestPasswordReset(identifier);
      toast.success(result.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Permintaan reset gagal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_14%_16%,rgba(20,184,166,0.22),transparent_32%),radial-gradient(circle_at_86%_20%,rgba(59,130,246,0.22),transparent_30%),linear-gradient(145deg,hsl(var(--background)),hsl(var(--muted)))] px-6 py-10">
      <div className="pointer-events-none absolute left-[-8rem] top-[-7rem] h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-10rem] right-[-8rem] h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <Card className="w-full max-w-xl border-white/20 bg-card/90 shadow-2xl shadow-sky-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
          <CardHeader>
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <MailCheck className="h-6 w-6" />
              </div>
              <ThemeToggle />
            </div>
            <CardTitle>Lupa Password</CardTitle>
            <CardDescription>
              Masukkan email atau username akun Anda. Permintaan reset akan diteruskan sesuai kebijakan sistem yang aktif.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email atau Username</Label>
                <Input id="email" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Mengirim..." : "Kirim Tautan Reset"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                <Link href="/" className="text-primary hover:underline">
                  Kembali ke beranda
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
