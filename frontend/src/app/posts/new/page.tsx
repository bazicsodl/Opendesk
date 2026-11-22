"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { FileText, Image, Send, Video, X } from "lucide-react";

type MediaType = "image" | "video" | "document";

function detectType(file: File): MediaType {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "document";
}

export default function NewPost() {
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const mediaType = useMemo(() => (file ? detectType(file) : null), [file]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if ((!content.trim() && !file) || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let mediaUrl = "";
      let mediaName = "";
      let type: MediaType = "image";

      if (file) {
        const form = new FormData();
        form.append("file", file);
        const upload = await apiFetch("/upload", { method: "POST", body: form });
        mediaUrl = upload?.url || "";
        mediaName = file.name;
        type = detectType(file);
      }

      await apiFetch("/posts", {
        method: "POST",
        body: JSON.stringify({
          content: content.trim(),
          media_url: mediaUrl,
          media_type: type,
          media_name: mediaName,
        }),
      });

      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    if (selected.type.startsWith("image/") || selected.type.startsWith("video/")) {
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview(null);
    }
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Post</h1>
      <p className="text-slate-600 mb-6">Share updates, videos, and documents with your network.</p>

      <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What would you like to share?"
          className="w-full min-h-[140px] rounded-lg border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          maxLength={2500}
        />

        {file ? (
          <div className="mt-4 rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-700">
                <strong>Attached:</strong> {file.name}
              </div>
              <button type="button" onClick={clearFile} className="rounded p-1 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            {preview && mediaType === "image" ? <img src={preview} alt="preview" className="mt-3 max-h-96 w-full rounded-lg object-cover" /> : null}
            {preview && mediaType === "video" ? <video src={preview} controls className="mt-3 max-h-96 w-full rounded-lg bg-black" /> : null}
            {mediaType === "document" ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
                <FileText className="h-4 w-4" /> Document ready to post
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer rounded-lg p-2 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700">
              <input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
              <Image className="h-5 w-5" />
            </label>
            <label className="cursor-pointer rounded-lg p-2 text-slate-600 hover:bg-amber-50 hover:text-amber-700">
              <input type="file" className="hidden" accept="video/*" onChange={onFileChange} />
              <Video className="h-5 w-5" />
            </label>
            <label className="cursor-pointer rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              <input type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" onChange={onFileChange} />
              <FileText className="h-5 w-5" />
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && !file)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-white disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
