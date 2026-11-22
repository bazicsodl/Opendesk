"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

type MyProfile = {
  headline?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  imageUrl?: string;
  image_url?: string;
  coverImageUrl?: string;
  cover_image_url?: string;
  coverImageURL?: string;
};

export default function UploadCoverPicture() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fileName = useMemo(() => file?.name ?? "No file selected", [file]);

  async function onUpload() {
    if (!file || loading) return;
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const form = new FormData();
      form.append("file", file);
      const upload = (await apiFetch("/upload", { method: "POST", body: form })) as { url?: string };
      if (!upload?.url) throw new Error("Upload failed: missing URL");

      const me = (await apiFetch("/profile/me")) as MyProfile;
      await apiFetch("/profile", {
        method: "POST",
        body: JSON.stringify({
          headline: me?.headline || "",
          bio: me?.bio || "",
          location: me?.location || "",
          skills: me?.skills || [],
          image_url: me?.imageUrl || me?.image_url || "",
          imageUrl: me?.imageUrl || me?.image_url || "",
          cover_image_url: upload.url,
          coverImageUrl: upload.url,
        }),
      });

      const fresh = (await apiFetch(`/profile/me?t=${Date.now()}`)) as MyProfile;
      const savedCover = (
        fresh?.coverImageUrl ||
        fresh?.cover_image_url ||
        fresh?.coverImageURL ||
        ""
      ).trim();
      if (!savedCover) throw new Error("Cover saved response missing coverImageUrl");

      setMessage("Cover photo updated.");
      setFile(null);
      window.dispatchEvent(
        new CustomEvent("profile-updated", {
          detail: {
            coverImageUrl: savedCover,
            imageUrl: fresh?.imageUrl || fresh?.image_url || "",
          },
        }),
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update cover photo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold text-slate-900">Cover photo</h2>
      <p className="mb-4 text-sm text-slate-600">Upload a branded background for your profile header.</p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
        />
        <button
          type="button"
          disabled={!file || loading}
          onClick={onUpload}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-500">{fileName}</p>
      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </section>
  );
}
