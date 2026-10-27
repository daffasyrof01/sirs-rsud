"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { UserForm, type UserFormValues } from "@/components/users/user-form";
import { UserTable } from "@/components/users/user-table";
import { createUser, deleteUser, listUsers, resetUserPassword, setUserStatus } from "@/lib/services/user-service";
import type { UserAccount } from "@/lib/types";

export default function SuperAdminUsersPage() {
  const [users, setUsers] = React.useState<Awaited<ReturnType<typeof listUsers>>>([]);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<UserAccount | null>(null);
  const [refreshKey, refresh] = React.useState(0);

  React.useEffect(() => {
    listUsers()
      .then((data) => setUsers(data))
      .catch(() => setUsers([]));
  }, [refreshKey]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !search ||
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const initialValues: UserFormValues = {
    name: "",
    email: "",
    role: "staff",
    department: "",
    temporaryPassword: "",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Pengguna"
        description="Kelola akun pengguna, ubah status akun, dan reset password."
        action={
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setCreateOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Tambah Pengguna
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
          <Input placeholder="Cari nama atau email" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="all">Semua peran</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </Select>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Semua status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </Select>
        </CardContent>
      </Card>

      <UserTable
        users={filteredUsers}
        onToggleStatus={async (user) => {
          await setUserStatus(user.id, user.status === "active" ? "inactive" : "active");
          refresh((value) => value + 1);
          toast.success("Status akun berhasil diperbarui.");
        }}
        onDelete={(user) => setDeleteTarget(user)}
        onResetPassword={async (user) => {
          const temporaryPassword = await resetUserPassword(user.id);
          refresh((value) => value + 1);
          toast.success(`Password sementara ${user.name}: ${temporaryPassword}`);
        }}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>Buat akun baru untuk admin atau staff rumah sakit.</DialogDescription>
          </DialogHeader>
          <UserForm
            initialValues={initialValues}
            submitLabel="Simpan Pengguna"
            onSubmit={async (values) => {
              await createUser(values);
              refresh((value) => value + 1);
              setCreateOpen(false);
              toast.success("Pengguna baru berhasil ditambahkan.");
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => (!open ? setDeleteTarget(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus akun pengguna</DialogTitle>
            <DialogDescription>
              Aksi ini akan menghapus akun {deleteTarget?.name} secara permanen dari sistem.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteTarget) return;
                await deleteUser(deleteTarget.id);
                refresh((value) => value + 1);
                setDeleteTarget(null);
                toast.success("Akun pengguna dihapus permanen.");
              }}
            >
              Hapus Akun
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
