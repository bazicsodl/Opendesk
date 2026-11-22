"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import UploadProfilePicture from "@/components/UploadProfilePicture";
import UploadCoverPicture from "@/components/UploadCoverPicture";
import SendVerificationButton from "@/components/SendVerificationButton";
import { ThemeAccent, ThemeMode, applyTheme, getSavedThemeAccent, getSavedThemeMode, setThemeAccent, setThemeMode } from "@/lib/theme";

export default function SettingsPage() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [accent, setAccent] = useState<ThemeAccent>("emerald");

  useEffect(() => {
    const savedMode = getSavedThemeMode();
    const savedAccent = getSavedThemeAccent();
    setMode(savedMode);
    setAccent(savedAccent);
    applyTheme(savedMode, savedAccent);
  }, []);

  function onModeChange(next: ThemeMode) {
    setMode(next);
    setThemeMode(next);
  }

  function onAccentChange(next: ThemeAccent) {
    setAccent(next);
    setThemeAccent(next);
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5">
      <section className="panel p-5">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-slate-600">Manage account preferences, theme and profile assets.</p>
      </section>

      <section className="panel p-5 space-y-4">
        <h2 className="text-lg font-semibold">Appearance</h2>

        <div>
          <p className="text-sm font-medium mb-2">Dark Mode</p>
          <div className="flex flex-wrap gap-2">
            {(["light", "dark", "system"] as ThemeMode[]).map((item) => (
              <button
                key={item}
                onClick={() => onModeChange(item)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${mode === item ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-300"}`}
              >
                {item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Theme Color</p>
          <div className="flex flex-wrap gap-2">
            {(["emerald", "ocean", "sunset"] as ThemeAccent[]).map((item) => (
              <button
                key={item}
                onClick={() => onAccentChange(item)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${accent === item ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-300"}`}
              >
                {item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel p-5 space-y-3">
        <h2 className="text-lg font-semibold">Profile Assets</h2>
        <UploadProfilePicture />
        <UploadCoverPicture />
      </section>

      <section className="panel p-5">
        <p className="mb-2 font-medium">Email verification</p>
        <SendVerificationButton />
      </section>

      <section className="panel p-5">
        <h2 className="text-lg font-semibold mb-2">Quick Links</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/profile/me/edit" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Edit profile</Link>
          <Link href="/jobs/preferences" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Job preferences</Link>
          <Link href="/connections" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Connections</Link>
        </div>
      </section>
    </div>
  );
}

