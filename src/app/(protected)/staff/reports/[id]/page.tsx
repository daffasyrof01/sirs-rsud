"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { ReportDetail } from "@/components/reports/report-detail";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getReportById } from "@/lib/services/report-service";

export default function StaffReportDetailPage() {
  const params = useParams<{ id: string }>();
  const { session } = useAuth();
  const [report, setReport] = React.useState<Awaited<ReturnType<typeof getReportById>> | null>(null);

  React.useEffect(() => {
    if (!session) return;
    getReportById(params.id)
      .then((data) => setReport(data))
      .catch(() => setReport(null));
  }, [params.id, session]);

  if (!report) {
    return (
      <div className="space-y-6">
        <PageHeader title="Detail Laporan" description="Data laporan tidak ditemukan." />
        <Link href="/staff/reports">
          <Button variant="outline">Kembali ke Riwayat</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detail Laporan"
        description="Informasi lengkap laporan kerusakan dan riwayat pembaruannya."
        action={
          <Link href="/staff/reports" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">Kembali ke Riwayat</Button>
          </Link>
        }
      />
      <ReportDetail report={report} />
    </div>
  );
}
