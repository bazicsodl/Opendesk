"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { apiFetch } from "@/lib/api";

export default function ApplyModal({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const [resumeUrl, setResumeUrl] = useState("");
  const [cover, setCover] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function uploadResume(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiFetch("/upload", { method: "POST", body: form });
      if (!res?.url) throw new Error("Resume upload failed");
      setResumeUrl(res.url);
    } finally {
      setUploading(false);
    }
  }

  const submit = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await api.post(`/jobs/${jobId}/apply`, {
        resume_url: resumeUrl,
        cover_letter: cover,
      });
      await api.post(`/jobs/${jobId}/track`, { event: "apply" }).catch(() => {});
      setMessage("Application submitted.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to apply";
      setMessage(msg.includes("409") ? "You already applied to this job." : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-3">Apply for this job</h2>

        <label className="block text-sm">Resume URL</label>
        <input value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} className="w-full border rounded px-3 py-2 mb-2" placeholder="https://..." />
        <div className="mb-3">
          <label className="text-xs text-slate-500">Or upload resume (PDF/DOC)</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => e.target.files?.[0] && uploadResume(e.target.files[0]).catch((er) => setMessage(er instanceof Error ? er.message : "Upload failed"))}
            className="w-full border rounded px-3 py-2"
          />
          {uploading ? <p className="text-xs text-slate-500 mt-1">Uploading...</p> : null}
        </div>

        <label className="block text-sm">Cover letter</label>
        <textarea value={cover} onChange={(e) => setCover(e.target.value)} className="w-full border rounded px-3 py-2 mb-3" rows={4} />

        {message ? <p className="text-sm mb-2">{message}</p> : null}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-1 rounded bg-gray-100">
            Close
          </button>
          <button onClick={submit} disabled={loading || uploading} className="px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-50">
            {loading ? "Sending..." : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}
