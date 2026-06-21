"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserForm, mapUserToFormValues } from "@/components/users/user-form";
import { getUserById, setUserStatus, updateUser } from "@/lib/services/user-service";
import { formatDate } from "@/lib/utils";

export default function SuperAdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const [user, setUser] = React.useState<Awaited<ReturnType<typeof getUserById>>>(null);

  const reload = React.useCallback(() => {
    return getUserById(params.id)
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, [params.id]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader title="Detail Pengguna" description="Pengguna tidak ditemukan." />
        <Link href="/superadmin/users">
          <Button variant="outline">Kembali ke manajemen pengguna</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detail Pengguna"
        description="Edit data pengguna, lihat aktivitas login, dan kelola status akun."
        action={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={async () => {
                await setUserStatus(user.id, user.status === "active" ? "inactive" : "active");
                await reload();
                toast.success("Status akun berhasil diperbarui.");
              }}
            >
              {user.status === "active" ? "Nonaktifkan" : "Aktifkan"}
            </Button>
            <Link href="/superadmin/users">
              <Button variant="outline">Kembali</Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Pengguna</CardTitle>
            <CardDescription>Status akun dan histori login.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailTile label="Nama" value={user.name} />
            <DetailTile label="Email" value={user.email} />
            <DetailTile label="Peran" value={user.role} />
            <DetailTile label="Departemen" value={user.department} />
            <DetailTile label="Dibuat" value={formatDate(user.createdAt)} />
            <DetailTile label="Login terakhir" value={formatDate(user.lastLoginAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit Data Pengguna</CardTitle>
            <CardDescription>Email tetap terkunci sesuai ketentuan PRD.</CardDescription>
          </CardHeader>
          <CardContent>
            <UserForm
              initialValues={mapUserToFormValues(user)}
              disableEmail
              submitLabel="Simpan Perubahan"
              onSubmit={async (values) => {
                await updateUser(user.id, {
                  name: values.name,
                  role: values.role,
                  department: values.department,
                  temporaryPassword: values.temporaryPassword,
                });
                await reload();
                toast.success("Perubahan pengguna berhasil disimpan.");
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-medium capitalize">{value}</p>
    </div>
  );
}
