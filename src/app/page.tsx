import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants/app";
import { redirectAuthenticatedUser } from "@/lib/server/page-auth";

export default async function HomePage() {
  await redirectAuthenticatedUser();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.22),transparent_34%),radial-gradient(circle_at_85%_12%,rgba(59,130,246,0.22),transparent_32%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)))] px-6 py-10 text-foreground">
      <div className="pointer-events-none absolute left-[-8rem] top-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-10rem] right-[-6rem] h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col justify-center gap-10">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-card/80 px-8 py-14 shadow-2xl shadow-sky-950/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/72">
          <div className="absolute inset-0 bg-soft-grid bg-[size:36px_36px] opacity-35" />
          <div className="relative space-y-8 text-center">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm font-medium text-primary shadow-sm">
              {APP_NAME} • SMART
            </div>
            <div className="space-y-4">
              <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
                {APP_TAGLINE}
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Pilih portal sesuai peran untuk masuk ke sistem pelaporan,
                monitoring, dan manajemen pengguna.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/login/staff"
                className={buttonVariants({ size: "lg", className: "shadow-lg shadow-primary/20" })}
              >
                Staff
              </Link>
              <Link
                href="/login/admin"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                Admin
              </Link>
              <Link
                href="/login/superadmin"
                className={buttonVariants({ size: "lg", variant: "secondary" })}
              >
                Super Admin
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
