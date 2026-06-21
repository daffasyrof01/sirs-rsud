import { eq } from "drizzle-orm";
import { JWT } from "google-auth-library";

import { pushDeviceTokens } from "@/db/app-schema";
import { db } from "@/db/client";

const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

function getFirebasePrivateKey() {
  return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

function hasFirebaseConfig() {
  return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && getFirebasePrivateKey());
}

async function getFcmAccessToken() {
  const client = new JWT({
    email: process.env.FIREBASE_CLIENT_EMAIL,
    key: getFirebasePrivateKey(),
    scopes: [FCM_SCOPE],
  });

  const token = await client.getAccessToken();
  return token.token;
}

async function sendFcmMessage({
  token,
  title,
  body,
  data = {},
}: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  if (!hasFirebaseConfig()) return { sent: false, invalidToken: false };

  const accessToken = await getFcmAccessToken();
  if (!accessToken) return { sent: false, invalidToken: false };

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: {
            title,
            body,
          },
          data,
          android: {
            priority: "high",
            notification: {
              channelId: "sirs-report-updates",
            },
          },
        },
      }),
    },
  );

  if (response.ok) return { sent: true, invalidToken: false };

  const payload = (await response.json().catch(() => null)) as { error?: { status?: string; message?: string } } | null;
  const status = payload?.error?.status ?? "";
  const message = payload?.error?.message ?? "";
  const invalidToken =
    response.status === 404 ||
    status === "NOT_FOUND" ||
    status === "INVALID_ARGUMENT" ||
    message.toLowerCase().includes("registration token");

  return { sent: false, invalidToken };
}

export async function upsertPushDeviceToken({
  userId,
  token,
  platform = "android",
}: {
  userId: string;
  token: string;
  platform?: string;
}) {
  const now = new Date();

  await db
    .insert(pushDeviceTokens)
    .values({
      id: `push-token-${crypto.randomUUID()}`,
      userId,
      token,
      platform,
      createdAt: now,
      updatedAt: now,
      lastSeenAt: now,
    })
    .onConflictDoUpdate({
      target: pushDeviceTokens.token,
      set: {
        userId,
        platform,
        updatedAt: now,
        lastSeenAt: now,
      },
    });
}

export async function deletePushDeviceToken(token: string) {
  await db.delete(pushDeviceTokens).where(eq(pushDeviceTokens.token, token));
}

export async function sendPushNotificationToUser({
  userId,
  title,
  body,
  data,
}: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  if (!hasFirebaseConfig()) return;

  const rows = await db.select().from(pushDeviceTokens).where(eq(pushDeviceTokens.userId, userId));

  await Promise.allSettled(
    rows.map(async (row) => {
      const result = await sendFcmMessage({
        token: row.token,
        title,
        body,
        data,
      });

      if (result.invalidToken) {
        await deletePushDeviceToken(row.token);
      }
    }),
  );
}
