"use client";

import * as React from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";

import { useAuth } from "@/hooks/use-auth";
import { listNotifications } from "@/lib/services/notification-service";
import type { NotificationItem } from "@/lib/types";

const CHANNEL_ID = "sirs-report-updates";
const POLL_INTERVAL_MS = 60_000;

function getSeenStorageKey(userId: string) {
  return `sirs-native-notifications-seen:${userId}`;
}

function getSeenIds(userId: string) {
  if (typeof window === "undefined") return new Set<string>();

  const raw = window.localStorage.getItem(getSeenStorageKey(userId));
  if (!raw) return new Set<string>();

  try {
    const ids = JSON.parse(raw) as string[];
    return new Set(ids.filter((id) => typeof id === "string"));
  } catch {
    return new Set<string>();
  }
}

function saveSeenIds(userId: string, ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getSeenStorageKey(userId), JSON.stringify([...ids].slice(-100)));
}

function toNotificationId(id: string) {
  let hash = 0;

  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }

  return Math.max(1, hash % 2_000_000_000);
}

async function ensureNativeNotificationsReady() {
  if (!Capacitor.isNativePlatform()) return false;

  const permission = await LocalNotifications.checkPermissions();
  const display = permission.display === "granted" ? permission : await LocalNotifications.requestPermissions();

  if (display.display !== "granted") return false;

  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: "Update laporan",
    description: "Pemberitahuan status dan laporan terbaru SIPEDRAS.",
    importance: 4,
    visibility: 1,
    vibration: true,
  });

  return true;
}

async function showNativeNotification(item: NotificationItem) {
  await LocalNotifications.schedule({
    notifications: [
      {
        id: toNotificationId(item.id),
        title: item.title,
        body: item.message,
        channelId: CHANNEL_ID,
        schedule: { at: new Date(Date.now() + 250) },
        extra: {
          notificationId: item.id,
        },
      },
    ],
  });
}

async function registerPushToken(token: string) {
  await fetch("/api/push-tokens", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      platform: Capacitor.getPlatform(),
    }),
  });
}

export function NativeNotificationProvider() {
  const { session } = useAuth();
  const readyRef = React.useRef(false);
  const initializedUserRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    void ensureNativeNotificationsReady()
      .then((isReady) => {
        readyRef.current = isReady;
      })
      .catch(() => {
        readyRef.current = false;
      });
  }, []);

  React.useEffect(() => {
    if (!session || !Capacitor.isNativePlatform()) return;

    let active = true;

    const setupPushNotifications = async () => {
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== "granted") return;

      await PushNotifications.addListener("registration", async (token) => {
        if (!active) return;
        await registerPushToken(token.value).catch(() => null);
      });

      await PushNotifications.addListener("registrationError", () => {
        return;
      });

      await PushNotifications.addListener("pushNotificationActionPerformed", () => {
        return;
      });

      await PushNotifications.register();
    };

    void setupPushNotifications().catch(() => null);

    return () => {
      active = false;
      void PushNotifications.removeAllListeners();
    };
  }, [session]);

  React.useEffect(() => {
    if (!session) {
      initializedUserRef.current = null;
      readyRef.current = false;
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const isReady = readyRef.current || (await ensureNativeNotificationsReady());
        readyRef.current = isReady;

        const items = await listNotifications();
        const seenIds = getSeenIds(session.id);
        const firstRunForUser = initializedUserRef.current !== session.id;

        if (firstRunForUser) {
          items.forEach((item) => seenIds.add(item.id));
          initializedUserRef.current = session.id;
          saveSeenIds(session.id, seenIds);
          return;
        }

        const nextUnread = items.filter((item) => !item.read && !seenIds.has(item.id));

        for (const item of nextUnread) {
          seenIds.add(item.id);
          if (isReady) {
            await showNativeNotification(item);
          }
        }

        items.forEach((item) => seenIds.add(item.id));
        saveSeenIds(session.id, seenIds);
      } catch {
        return;
      }
    };

    void poll();

    const interval = window.setInterval(() => {
      if (!cancelled) void poll();
    }, POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void poll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session]);

  return null;
}
