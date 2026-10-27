"use client";

import Link from "next/link";
import { KeyRound } from "lucide-react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ForgotPasswordCard() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_14%_16%,rgba(20,184,166,0.22),transparent_32%),radial-gradient(circle_at_86%_20%,rgba(59,130,246,0.22),transparent_30%),linear-gradient(145deg,hsl(var(--background)),hsl(var(--muted)))] px-6 py-10">
      <div className="pointer-events-none absolute left-[-8rem] top-[-7rem] h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-10rem] right-[-8rem] h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <Card className="w-full max-w-xl border-white/20 bg-card/90 shadow-2xl shadow-sky-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
          <CardHeader>
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <KeyRound className="h-6 w-6" />
              </div>
              <ThemeToggle />
            </div>
            <CardTitle>Lupa Password</CardTitle>
            <CardDescription>
              Hubungi Super Admin rumah sakit untuk mereset password akun Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Siapkan nama, unit kerja, serta username atau email yang terdaftar agar Super Admin dapat menemukan akun Anda.
                Password sementara diberikan langsung oleh Super Admin setelah permintaan Anda diverifikasi.
              </p>
              <Link href="/" className={buttonVariants({ className: "w-full" })}>
                Kembali ke halaman login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
