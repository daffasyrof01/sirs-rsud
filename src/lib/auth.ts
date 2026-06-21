import "@/lib/env";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { toNextJsHandler } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { admin } from "better-auth/plugins/admin";
import { defaultRoles } from "better-auth/plugins/admin/access";
import { username } from "better-auth/plugins/username";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { user } from "@/db/auth-schema";
import { EMAIL_OTP_ENABLED } from "@/lib/constants/features";
import { sendOtpEmail } from "@/lib/server/email";
import { recordLoginSuccessAudit } from "@/lib/server/audit-log";

const betterAuthSecret = process.env.BETTER_AUTH_SECRET ?? "dev-only-secret-change-this-in-production";

if (process.env.NODE_ENV === "production" && betterAuthSecret === "dev-only-secret-change-this-in-production") {
  throw new Error("BETTER_AUTH_SECRET wajib diisi dengan secret kuat untuk production.");
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: betterAuthSecret,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          await db
            .update(user)
            .set({
              lastLoginAt: new Date(),
            })
            .where(eq(user.id, session.userId));

          await recordLoginSuccessAudit(session.userId);
        },
      },
    },
  },
  user: {
    additionalFields: {
      department: {
        type: "string",
        required: false,
      },
      lastLoginAt: {
        type: "date",
        required: false,
      },
    },
  },
  plugins: [
    username(),
    ...(EMAIL_OTP_ENABLED
      ? [
          emailOTP({
            overrideDefaultEmailVerification: true,
            otpLength: 6,
            expiresIn: 10 * 60,
            allowedAttempts: 5,
            async sendVerificationOTP({ email, otp, type }) {
              await sendOtpEmail({
                to: email,
                otp,
                type,
              });
            },
          }),
        ]
      : []),
    admin({
      defaultRole: "staff",
      adminRoles: ["admin", "superadmin"],
      roles: {
        staff: defaultRoles.user,
        admin: defaultRoles.admin,
        superadmin: defaultRoles.admin,
      },
      bannedUserMessage: "Akun Anda sedang nonaktif. Hubungi Super Admin.",
    }),
  ],
});

export const authHandler = toNextJsHandler(auth);
