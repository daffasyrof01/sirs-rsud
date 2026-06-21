"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_CONFIG } from "@/lib/constants/app";
import { useAuth } from "@/hooks/use-auth";
import type { Role } from "@/lib/types";

export function LoginCard({ role }: { role: Role }) {
  const [identifier, setIdentifier] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const config = ROLE_CONFIG[role];
  const Icon = config.icon;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const result = await login({ identifier, password, role });
      toast.success(`Selamat datang di portal ${config.label}.`);
      router.push(result.redirectTo);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal masuk ke sistem.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_16%,rgba(20,184,166,0.24),transparent_30%),radial-gradient(circle_at_88%_18%,rgba(14,165,233,0.24),transparent_28%),linear-gradient(145deg,hsl(var(--background)),hsl(var(--muted)))] px-6 py-10">
      <div className="pointer-events-none absolute left-[-9rem] top-[-8rem] h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-12rem] right-[-8rem] h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/30 to-transparent dark:from-white/5" />
      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-card/80 p-8 shadow-2xl shadow-sky-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/72">
          <div className="absolute inset-0 bg-soft-grid bg-[size:34px_34px] opacity-35" />
          <div className="absolute right-[-3rem] top-[-3rem] h-40 w-40 rounded-full bg-primary/15 blur-2xl" />
          <div className="absolute bottom-6 left-8 h-16 w-16 rounded-full border border-primary/20" />
          <div className="relative space-y-6">
            <div className="flex items-center justify-between">
              <div className={`inline-flex rounded-2xl bg-gradient-to-br p-4 text-white shadow-panel ${config.accent}`}>
                <Icon className="h-7 w-7" />
              </div>
              <ThemeToggle />
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">{config.label}</p>
              <h1 className="text-balance text-4xl font-bold tracking-tight">Portal pelaporan kerusakan fasilitas rumah sakit</h1>
              <p className="max-w-xl text-muted-foreground">
                Masuk ke sistem pelaporan dengan autentikasi berbasis peran, dashboard interaktif, serta tema terang dan gelap.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-background/80 p-4 shadow-sm backdrop-blur dark:border-white/10">
              <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
              <h3 className="font-semibold">Akses berbasis peran</h3>
              <p className="mt-1 text-sm text-muted-foreground">Setiap portal hanya dapat diakses oleh peran yang sesuai.</p>
            </div>
          </div>
        </section>

        <Card className="border-white/20 bg-card/90 shadow-2xl shadow-sky-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle>Masuk ke portal {config.label}</CardTitle>
            <CardDescription>Masukkan email atau username dan password Anda untuk melanjutkan.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="identifier">Email atau Username</Label>
                <Input id="identifier" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Memproses..." : "Masuk ke Dashboard"}
              </Button>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <Link href="/forgot-password" className="text-primary hover:underline">
                  Lupa Password
                </Link>
                <Link href="/" className="hover:text-foreground">
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
