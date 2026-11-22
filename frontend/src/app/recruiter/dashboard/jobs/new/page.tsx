"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

const remoteTypes = ["remote", "hybrid", "onsite"];
const employmentTypes = ["full-time", "part-time", "contract", "internship"];

export default function CreateJobPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    remote_type: "",
    employment_type: "",
    salary_min: "",
    salary_max: "",
    description: "",
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch("/recruiter/me").catch(() => {
      router.push("/recruiter/setup-profile");
    });
  }, [router]);

  function updateField(field: string, value: string) {
    setForm({ ...form, [field]: value });
  }

  function addSkill() {
    if (skillInput.trim() !== "") {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  }

  async function submitJob() {
    setError("");
    if (!form.title || !form.company || !form.description) {
      setError("Title, company, and description are required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        company: form.company,
        location: form.location,
        remote_type: form.remote_type,
        employment_type: form.employment_type,
        description: form.description,
        salary_min: Number(form.salary_min || 0),
        salary_max: Number(form.salary_max || 0),
        skills,
      };

      await apiFetch("/jobs/", payload, "POST");
      router.push("/recruiter/dashboard/jobs");
    } catch (e: any) {
      const message = e instanceof Error ? e.message : "Error creating job";
      setError(message.includes("recruiter profile required") ? "Complete recruiter profile setup before posting jobs." : message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow border border-slate-200">
      <h1 className="text-2xl font-bold mb-6">Create New Job</h1>

      {/* Title */}
      <label className="block mb-4">
        <span className="font-medium">Job Title</span>
        <input
          className="w-full mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Senior Backend Developer"
        />
      </label>

      {/* Company */}
      <label className="block mb-4">
        <span className="font-medium">Company Name</span>
        <input
          className="w-full mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200"
          value={form.company}
          onChange={(e) => updateField("company", e.target.value)}
          placeholder="OpenDesk Inc."
        />
      </label>

      {/* Location */}
      <label className="block mb-4">
        <span className="font-medium">Location</span>
        <input
          className="w-full mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200"
          value={form.location}
          onChange={(e) => updateField("location", e.target.value)}
          placeholder="Lagos, Nigeria"
        />
      </label>

      {/* Job Type */}
      <label className="block mb-4">
        <span className="font-medium">Job Type</span>
        <select
          className="w-full mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200"
          value={form.remote_type}
          onChange={(e) => updateField("remote_type", e.target.value)}
        >
          <option value="">Select job type</option>
          {remoteTypes.map((t) => (
            <option key={t} value={t}>
              {t.toUpperCase()}
            </option>
          ))}
        </select>
      </label>

      {/* Employment Type */}
      <label className="block mb-4">
        <span className="font-medium">Employment Type</span>
        <select
          className="w-full mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200"
          value={form.employment_type}
          onChange={(e) => updateField("employment_type", e.target.value)}
        >
          <option value="">Choose employment type</option>
          {employmentTypes.map((lvl) => (
            <option key={lvl} value={lvl}>
              {lvl.toUpperCase()}
            </option>
          ))}
        </select>
      </label>

      {/* Salary */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <label>
          <span className="font-medium">Min Salary</span>
          <input
            type="number"
            className="w-full mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200"
            value={form.salary_min}
            onChange={(e) => updateField("salary_min", e.target.value)}
            placeholder="400000"
          />
        </label>

        <label>
          <span className="font-medium">Max Salary</span>
          <input
            type="number"
            className="w-full mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200"
            value={form.salary_max}
            onChange={(e) => updateField("salary_max", e.target.value)}
            placeholder="700000"
          />
        </label>
      </div>

      {/* Skills */}
      <label className="block mb-4">
        <span className="font-medium">Required Skills</span>

        <div className="flex gap-2 mt-2">
          <input
            className="flex-1 p-3 rounded-lg bg-slate-50 border border-slate-200"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            placeholder="React, Node.js, Go..."
          />
          <button
            type="button"
            onClick={addSkill}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
          >
            Add
          </button>
        </div>

        <div className="flex gap-2 mt-3 flex-wrap">
          {skills.map((s, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-sm"
            >
              {s}
            </span>
          ))}
        </div>
      </label>

      {/* Description */}
      <label className="block mb-6">
        <span className="font-medium">Job Description</span>
        <textarea
          className="w-full mt-2 p-3 h-40 rounded-lg bg-slate-50 border border-slate-200"
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Describe responsibilities, requirements, benefits..."
        />
      </label>

      {/* Submit button */}
      {error ? <p className="mb-3 text-sm text-rose-600">{error}</p> : null}
      <button onClick={submitJob} disabled={submitting} className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold disabled:opacity-60">
        {submitting ? "Posting..." : "Post Job"}
      </button>
    </div>
  );
}
