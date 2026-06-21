"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Role, UserAccount } from "@/lib/types";

export interface UserFormValues {
  name: string;
  email: string;
  role: Role;
  department: string;
  temporaryPassword: string;
}

export function UserForm({
  initialValues,
  onSubmit,
  submitLabel,
  disableEmail,
}: {
  initialValues: UserFormValues;
  onSubmit: (values: UserFormValues) => void;
  submitLabel: string;
  disableEmail?: boolean;
}) {
  const [values, setValues] = React.useState<UserFormValues>(initialValues);

  React.useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const update =
    (field: keyof UserFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nama</Label>
          <Input id="name" value={values.name} onChange={update("name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={values.email} onChange={update("email")} disabled={disableEmail} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Peran</Label>
          <Select id="role" value={values.role} onChange={update("role")}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Departemen</Label>
          <Input id="department" value={values.department} onChange={update("department")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password Sementara</Label>
        <Input
          id="password"
          type="password"
          value={values.temporaryPassword}
          onChange={update("temporaryPassword")}
          minLength={8}
          required={!disableEmail}
          autoComplete="new-password"
          placeholder={disableEmail ? "Kosongkan jika tidak ingin mengganti password" : "Minimal 8 karakter"}
        />
        <p className="text-xs text-muted-foreground">
          {disableEmail ? "Isi hanya jika ingin mengganti password akun ini." : "Gunakan minimal 8 karakter."}
        </p>
      </div>
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}

export function mapUserToFormValues(user: UserAccount): UserFormValues {
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    temporaryPassword: user.password,
  };
}
