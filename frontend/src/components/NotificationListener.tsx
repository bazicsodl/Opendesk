"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { connectNotifications, isConnected, onNotification } from "../lib/notifications-socket";
import { getToken } from "../lib/auth";

export default function NotificationListener() {
  function playNotifySound() {
    const audio = new Audio("/sounds/notify.mp3");
    audio.volume = 0.6;
    audio.play().catch(() => {});
  }

  function normalizeIncoming(n: any) {
    let parsed = n;
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        parsed = { text: parsed };
      }
    }

    if (typeof parsed?.data === "string") {
      try {
        parsed.data = JSON.parse(parsed.data);
      } catch {}
    }

    return {
      text: parsed?.text || parsed?.data?.text || parsed?.data?.message || parsed?.data?.snippet || "New notification",
    };
  }

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    if (!isConnected()) connectNotifications(token);

    const unsubscribe = onNotification((data) => {
      const n = normalizeIncoming(data);
      toast.success(n.text, { icon: "🔔", duration: 4000 });
      playNotifySound();
    });

    return () => unsubscribe();
  }, []);

  return null;
}
