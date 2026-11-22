"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlusCircle, Image, Video, FileText } from "lucide-react";
import { apiFetch } from "@/lib/api";

function mediaTypeFromFile(file: File): "image" | "video" | "document" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "document";
}

export default function CreatePostBox({ me }: { me: any }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || busy) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const uploaded = await apiFetch("/upload", { method: "POST", body: form });
      if (!uploaded?.url) throw new Error("Upload failed");

      await apiFetch("/posts", {
        method: "POST",
        body: JSON.stringify({
          content: "",
          media_url: uploaded.url,
          media_type: mediaTypeFromFile(file),
          media_name: file.name,
        }),
      });

      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Unable to create post from selected file.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="premium-card p-4 sm:p-6">
      <input
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="relative">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full theme-gradient-brand p-0.5 theme-shadow-brand">
            <img
              src={me?.imageUrl || "/default-avatar.svg"}
              className="w-full h-full rounded-full object-cover border-2 border-white"
              alt="Profile"
            />
          </div>
        </div>

        <Link
          href="/posts/new"
          className="flex-1 px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 theme-border-brand-hover transition-all duration-300 bg-white/80 backdrop-blur-sm font-medium"
        >
          Share an update with your network...
        </Link>

        <Link
          href="/posts/new"
          className="w-11 h-11 sm:w-12 sm:h-12 theme-gradient-brand rounded-xl flex items-center justify-center theme-gradient-brand-hover transition-all duration-300 hover:shadow-lg theme-shadow-brand-hover hover:-translate-y-0.5"
        >
          <PlusCircle className="w-6 h-6 text-white" />
        </Link>
      </div>

      <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 premium-divider grid grid-cols-3 gap-2 sm:gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 px-2 sm:px-4 py-2.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all duration-300"
          disabled={busy}
        >
          <Image className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-medium text-sm sm:text-base">Photo</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 px-2 sm:px-4 py-2.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all duration-300"
          disabled={busy}
        >
          <Video className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-medium text-sm sm:text-base">Video</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 px-2 sm:px-4 py-2.5 text-slate-600 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-all duration-300"
          disabled={busy}
        >
          <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-medium text-sm sm:text-base">Document</span>
        </button>
      </div>
    </div>
  );
}
