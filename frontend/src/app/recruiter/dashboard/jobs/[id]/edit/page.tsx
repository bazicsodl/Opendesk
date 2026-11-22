"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type JobForm = {
  title: string;
  company: string;
  location: string;
  employment_type: string;
  remote_type: string;
  salary_min: string;
  salary_max: string;
  description: string;
};

const employmentTypes = ["full-time", "part-time", "contract", "internship"];
const remoteTypes = ["remote", "hybrid", "onsite"];

export default function EditRecruiterJobPage() {
  const router = useRouter();
  const params = useParams();
  const id = useMemo(() => String(params.id || ""), [params.id]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillsInput, setSkillsInput] = useState("");
  const [form, setForm] = useState<JobForm>({
    title: "",
    company: "",
    location: "",
    employment_type: "",
    remote_type: "",
    salary_min: "",
    salary_max: "",
    description: "",
  });

  useEffect(() => {
    if (!id) return;
    apiFetch(`/recruiter/jobs/${id}`)
      .then((job) => {
        const skills = (job.skills ?? []).map((s: any) => s?.skill || s).filter(Boolean).join(", ");
        setSkillsInput(skills);
        setForm({
          title: job.title || "",
          company: job.company || "",
          location: job.location || "",
          employment_type: job.employment_type || "",
          remote_type: job.remote_type || "",
          salary_min: String(job.salary_min ?? ""),
          salary_max: String(job.salary_max ?? ""),
          description: job.description || "",
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  function updateField<K extends keyof JobForm>(field: K, value: JobForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id || saving) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        salary_min: Number(form.salary_min || 0),
        salary_max: Number(form.salary_max || 0),
        skills: skillsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      await apiFetch(`/jobs/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      router.push(`/recruiter/dashboard/jobs/${id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to update job.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading job...</div>;

  return (
    <form onSubmit={onSave} className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="mb-5 text-2xl font-bold text-slate-900">Edit Job</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Job title</span>
          <input value={form.title} onChange={(e) => updateField("title", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Company</span>
          <input value={form.company} onChange={(e) => updateField("company", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">Location</span>
        <input value={form.location} onChange={(e) => updateField("location", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
      </label>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Employment type</span>
          <select value={form.employment_type} onChange={(e) => updateField("employment_type", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Select</option>
            {employmentTypes.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Remote type</span>
          <select value={form.remote_type} onChange={(e) => updateField("remote_type", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Select</option>
            {remoteTypes.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Min salary</span>
          <input type="number" value={form.salary_min} onChange={(e) => updateField("salary_min", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Max salary</span>
          <input type="number" value={form.salary_max} onChange={(e) => updateField("salary_max", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">Skills (comma-separated)</span>
        <input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
      </label>

      <label className="mt-4 flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">Description</span>
        <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={8} className="rounded-lg border border-slate-300 px-3 py-2" />
      </label>

      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-50">
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}

