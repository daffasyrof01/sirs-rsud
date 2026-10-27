import assert from "node:assert/strict";
import test from "node:test";

import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";

test("account management is restricted to superadmin", async (t) => {
  // Keep local credentials and database hooks out of the in-memory tests.
  Object.assign(process.env, {
    DATABASE_URL: "postgresql://test:test@127.0.0.1:1/sipedras_test",
    BETTER_AUTH_URL: "http://localhost:3000",
    BETTER_AUTH_SECRET: "test-only-secret-for-account-permission-checks",
    NEXT_PUBLIC_EMAIL_OTP_ENABLED: "false",
  });
  (globalThis as { __sirsEnvLoaded?: boolean }).__sirsEnvLoaded = true;

  const { auth } = await import("@/lib/auth");
  const { pool } = await import("@/db/client");
  t.after(() => pool.end());

  const database = { user: [], account: [], session: [], verification: [] };
  const testAuth = betterAuth({
    ...auth.options,
    database: memoryAdapter(database),
    databaseHooks: {},
    rateLimit: { enabled: false },
    logger: { level: "error" },
  });
  const password = "Test-account-password-42";
  const target = await testAuth.api.createUser({
    body: { name: "Target Staff", email: "target@example.test", password, role: "staff" },
  });

  async function sessionCookie(role: "staff" | "admin" | "superadmin") {
    await testAuth.api.createUser({
      body: { name: role, email: `${role}@example.test`, password, role },
    });
    const response = await testAuth.api.signInEmail({
      body: { email: `${role}@example.test`, password },
      asResponse: true,
    });
    assert.equal(response.status, 200);
    const cookies = response.headers.getSetCookie();
    assert.ok(cookies.length > 0);
    return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
  }

  const newPassword = "New-test-password-43";
  const actions = [
    { path: "/admin/set-role", body: { userId: target.user.id, role: "superadmin" } },
    { path: "/admin/set-user-password", body: { userId: target.user.id, newPassword } },
  ];

  for (const role of ["staff", "admin", "superadmin"] as const) {
    await t.test(`${role} account permissions`, async () => {
      const cookie = await sessionCookie(role);
      for (const action of actions) {
        const response = await testAuth.handler(new Request(`http://localhost:3000/api/auth${action.path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", origin: "http://localhost:3000", cookie },
          body: JSON.stringify(action.body),
        }));
        assert.equal(response.status, role === "superadmin" ? 200 : 403, `${role}: ${action.path}`);
      }
    });
  }

  await t.test("superadmin password reset allows login with the new password", async () => {
    const response = await testAuth.api.signInEmail({
      body: { email: "target@example.test", password: newPassword },
      asResponse: true,
    });
    assert.equal(response.status, 200);
    const oldPasswordResponse = await testAuth.api.signInEmail({
      body: { email: "target@example.test", password },
      asResponse: true,
    });
    assert.equal(oldPasswordResponse.status, 401);
  });

  await t.test("public sign-up is disabled", async () => {
    const response = await testAuth.handler(new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", origin: "http://localhost:3000" },
      body: JSON.stringify({ name: "Unregistered", email: "new@example.test", password }),
    }));
    assert.equal(response.status, 400);
  });
});

test("self-service password reset does not report a successful email", async () => {
  const { POST } = await import("@/app/api/forgot-password/route");
  const response = await POST(new Request("http://localhost:3000/api/forgot-password", {
    method: "POST",
    headers: { origin: "http://localhost:3000", "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "staff@example.test" }),
  }));
  assert.equal(response.status, 501);
  const body = await response.json();
  assert.match(body.message, /Hubungi Super Admin/);
  assert.notEqual(body.success, true);
});
