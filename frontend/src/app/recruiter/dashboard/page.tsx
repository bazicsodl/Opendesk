"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function DashboardHome() {
  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    apiFetch("/recruiter/me").then(setProfile).catch(() => {});
    apiFetch("/recruiter/jobs").then((r) => setJobs(Array.isArray(r) ? r : [])).catch(() => {});
  }, []);

  const stats = useMemo(() => {
    return jobs.reduce(
      (acc, j) => ({
        jobs: acc.jobs + 1,
        applicants: acc.applicants + Number(j.applicants_count || 0),
      }),
      { jobs: 0, applicants: 0 },
    );
  }, [jobs]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-wide text-emerald-700 font-semibold">Recruiter HQ</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{profile?.company_name || "Welcome back"}</h1>
        <p className="mt-2 text-slate-600">Manage postings, review candidates, and keep hiring momentum high.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Open Jobs</p>
          <p className="text-3xl font-semibold text-slate-900">{stats.jobs}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Applicants</p>
          <p className="text-3xl font-semibold text-slate-900">{stats.applicants}</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Jobs</h2>
          <Link href="/recruiter/dashboard/jobs/new" className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white">
            Post a Job
          </Link>
        </div>
        <div className="space-y-2">
          {jobs.slice(0, 5).map((job) => (
            <Link key={job.id} href={`/recruiter/dashboard/jobs/${job.id}`} className="block rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
              <p className="font-medium text-slate-900">{job.title}</p>
              <p className="text-sm text-slate-500">{job.applicants_count || 0} applicants</p>
            </Link>
          ))}
          {jobs.length === 0 ? <p className="text-sm text-slate-500">No jobs yet. Create your first posting.</p> : null}
        </div>
      </section>
    </div>
  );
}
