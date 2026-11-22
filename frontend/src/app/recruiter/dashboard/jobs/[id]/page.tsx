"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function RecruiterJobDetailsPage({ params }: any) {
  const { id } = params;
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [boost, setBoost] = useState(0);
  const [apps, setApps] = useState<any[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState("");
  const [thread, setThread] = useState<any[]>([]);
  const [draft, setDraft] = useState("");

  async function load() {
    const [jobRes, appRes] = await Promise.all([
      api.get(`/recruiter/jobs/${id}`),
      api.get(`/jobs/${id}/applications`).catch(() => ({ data: [] })),
    ]);
    setJob(jobRes.data);
    setBoost(Number(jobRes.data?.boost_score || 0));
    setApps(Array.isArray(appRes.data) ? appRes.data : []);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!selectedApplicant) return;
    api.get(`/jobs/${id}/messages/${selectedApplicant}`)
      .then((res) => setThread(Array.isArray(res.data) ? res.data : []))
      .catch(() => setThread([]));
  }, [id, selectedApplicant]);

  async function saveBoost() {
    await api.post(`/jobs/${id}/boost`, { boost });
    await load();
  }

  async function sendRecruiterMessage() {
    if (!selectedApplicant || !draft.trim()) return;
    await api.post(`/jobs/${id}/message`, { to_user_id: selectedApplicant, text: draft.trim() });
    setDraft("");
    const res = await api.get(`/jobs/${id}/messages/${selectedApplicant}`);
    setThread(Array.isArray(res.data) ? res.data : []);
  }

  if (loading) return <p className="p-6">Loading job details...</p>;
  if (!job) return <p className="p-6">Job not found.</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
          <div className="flex gap-3">
            <Link href={`/recruiter/dashboard/jobs/${id}/edit`} className="px-4 py-2 bg-emerald-700 text-white rounded-lg">Edit Job</Link>
            <button
              onClick={async () => {
                if (!confirm("Delete this job?")) return;
                await api.delete(`/recruiter/jobs/${id}`);
                router.push("/recruiter/dashboard/jobs");
              }}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg"
            >
              Delete
            </button>
          </div>
        </div>
        <p className="text-slate-600 text-lg mt-2">{job.company} · {job.location}</p>
        <p className="text-lg font-semibold text-slate-800 mt-2">N{job.salary_min?.toLocaleString()} - N{job.salary_max?.toLocaleString()}</p>
        <div className="flex gap-6 text-sm text-slate-500 mt-2">
          <span>Posted: {new Date(job.created_at).toDateString()}</span>
          <span>Employment: {job.employment_type}</span>
          <span>Remote: {job.remote_type}</span>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold mb-3 text-slate-900">Boost Visibility</h2>
        <input type="range" min={0} max={100} value={boost} onChange={(e) => setBoost(Number(e.target.value))} className="w-full" />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-slate-600">Boost Score: <b>{boost}</b></p>
          <button onClick={saveBoost} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white">Save Boost</button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold mb-3 text-slate-900">Applications ({apps.length})</h2>
        {apps.length === 0 ? <p className="text-sm text-slate-500">No applications yet.</p> : null}
        <div className="grid gap-2">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => setSelectedApplicant(app.applicant_id)}
              className={`rounded-lg border px-3 py-2 text-left ${selectedApplicant === app.applicant_id ? "border-emerald-700 bg-emerald-50" : "border-slate-200"}`}
            >
              <p className="font-medium text-slate-800">Applicant ID: {app.applicant_id}</p>
              <p className="text-xs text-slate-500">Status: {app.status}</p>
            </button>
          ))}
        </div>
      </section>

      {selectedApplicant ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold mb-3 text-slate-900">Message Applicant</h2>
          <div className="mb-3 max-h-56 overflow-y-auto space-y-2 rounded-lg border border-slate-200 p-3 bg-slate-50">
            {thread.map((m) => (
              <div key={m.id} className="text-sm text-slate-700">
                <span className="font-semibold">{m.from_user_id === selectedApplicant ? "Applicant" : "You"}:</span> {m.text}
              </div>
            ))}
            {thread.length === 0 ? <p className="text-sm text-slate-500">No messages yet.</p> : null}
          </div>
          <div className="flex gap-2">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message..." className="flex-1 rounded-lg border border-slate-200 px-3 py-2" />
            <button onClick={sendRecruiterMessage} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white">Send</button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
