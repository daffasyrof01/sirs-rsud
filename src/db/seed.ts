import { eq } from "drizzle-orm";

import { user } from "@/db/auth-schema";
import { db } from "@/db/client";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

type BootstrapConfig = {
  name: string;
  email: string;
  password: string;
  username: string;
  department: string;
};

function readBootstrapConfig(): BootstrapConfig | null {
  const email = process.env.INITIAL_SUPERADMIN_EMAIL?.trim() ?? "";
  const password = process.env.INITIAL_SUPERADMIN_PASSWORD?.trim() ?? "";

  if (!email || !password) {
    return null;
  }

  if (password.length < 8) {
    throw new Error("INITIAL_SUPERADMIN_PASSWORD minimal 8 karakter.");
  }

  const name = process.env.INITIAL_SUPERADMIN_NAME?.trim() || "Super Admin";
  const requestedUsername =
    process.env.INITIAL_SUPERADMIN_USERNAME?.trim() || email.split("@")[0] || slugify(name) || "superadmin";
  const department = process.env.INITIAL_SUPERADMIN_DEPARTMENT?.trim() || "Manajemen Sistem";

  return {
    name,
    email,
    password,
    username: requestedUsername,
    department,
  };
}

async function ensureUniqueUsername(requestedUsername: string, currentUserId?: string) {
  const base = slugify(requestedUsername) || "superadmin";
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await db.query.user.findFirst({
      where: eq(user.username, candidate),
    });

    if (!existing || existing.id === currentUserId) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

async function ensureInitialSuperadmin(config: BootstrapConfig) {
  const existing = await db.query.user.findFirst({
    where: eq(user.email, config.email),
  });
  const username = await ensureUniqueUsername(config.username, existing?.id);

  if (!existing) {
    await auth.api.createUser({
      body: {
        email: config.email,
        password: config.password,
        name: config.name,
        role: "superadmin",
        data: {
          department: config.department,
          username,
          displayUsername: config.name,
        },
      },
    });

    console.log(`Bootstrap selesai. Super admin awal dibuat untuk ${config.email}.`);
    return;
  }

  await db
    .update(user)
    .set({
      name: config.name,
      role: "superadmin",
      department: config.department,
      username,
      displayUsername: config.name,
      banned: false,
      banReason: null,
    })
    .where(eq(user.id, existing.id));

  console.log(`Bootstrap selesai. Akun ${config.email} sudah ada dan disinkronkan sebagai super admin.`);
  console.log("Password akun yang sudah ada tidak diubah oleh bootstrap ini.");
}

async function main() {
  const config = readBootstrapConfig();

  if (!config) {
    console.log("Bootstrap dilewati. Isi INITIAL_SUPERADMIN_EMAIL dan INITIAL_SUPERADMIN_PASSWORD untuk membuat akun awal.");
    return;
  }

  await ensureInitialSuperadmin(config);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
