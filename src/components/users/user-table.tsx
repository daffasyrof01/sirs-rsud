import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatDate } from "@/lib/utils";
import type { UserAccount } from "@/lib/types";

export function UserTable({
  users,
  onToggleStatus,
  onDelete,
  onResetPassword,
}: {
  users: UserAccount[];
  onToggleStatus: (user: UserAccount) => void;
  onDelete: (user: UserAccount) => void;
  onResetPassword: (user: UserAccount) => void;
}) {
  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-48 items-center justify-center text-center text-muted-foreground">
          Belum ada data pengguna yang sesuai filter.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4 md:hidden">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">{user.name}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Badge variant={user.status === "active" ? "success" : "warning"}>
                  {user.status === "active" ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <MobileInfo label="Peran" value={user.role === "superadmin" ? "Super Admin" : user.role === "admin" ? "Admin" : "Staff"} />
                <MobileInfo label="Departemen" value={user.department} />
                <MobileInfo label="ID" value={user.id.slice(0, 10)} mono />
                <MobileInfo label="Dibuat" value={formatDate(user.createdAt)} />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Link href={`/superadmin/users/${user.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}>
                  Detail
                </Link>
                <Button size="sm" variant="outline" className="w-full" onClick={() => onToggleStatus(user)}>
                  {user.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                </Button>
                <Button size="sm" variant="outline" className="w-full" onClick={() => onResetPassword(user)}>
                  Reset Password
                </Button>
                <Button size="sm" variant="destructive" className="w-full" onClick={() => onDelete(user)}>
                  Hapus
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="hidden md:block">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Departemen</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-xs">{user.id.slice(0, 10)}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell>{user.department}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === "active" ? "success" : "warning"}>
                      {user.status === "active" ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/superadmin/users/${user.id}`}
                        className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"
                      >
                        Detail
                      </Link>
                      <Button size="sm" variant="outline" onClick={() => onToggleStatus(user)}>
                        {user.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onResetPassword(user)}>
                        Reset
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => onDelete(user)}>
                        Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

function MobileInfo({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-sm font-medium leading-6", mono ? "font-mono" : undefined)}>{value}</p>
    </div>
  );
}
