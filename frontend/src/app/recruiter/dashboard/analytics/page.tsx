"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type Metric = {
  views: number;
  clicks: number;
  applications: number;
  ctr_percent: number;
  conversion_percent: number;
};

type Job = {
  id: string;
  title: string;
  company: string;
};

export default function RecruiterAnalyticsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [metrics, setMetrics] = useState<Record<string, Metric>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const myJobs = (await apiFetch("/recruiter/jobs")) as Job[];
        if (!active) return;
        setJobs(myJobs || []);

        const entries = await Promise.all(
          (myJobs || []).map(async (job) => {
            try {
              const m = (await apiFetch(`/jobs/${job.id}/metrics`)) as Metric;
              return [job.id, m] as const;
            } catch {
              return [
                job.id,
                { views: 0, clicks: 0, applications: 0, ctr_percent: 0, conversion_percent: 0 } as Metric,
              ] as const;
            }
          }),
        );

        if (!active) return;
        setMetrics(Object.fromEntries(entries));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const totals = useMemo(() => {
    return Object.values(metrics).reduce(
      (acc, cur) => ({
        views: acc.views + (cur.views || 0),
        clicks: acc.clicks + (cur.clicks || 0),
        applications: acc.applications + (cur.applications || 0),
      }),
      { views: 0, clicks: 0, applications: 0 },
    );
  }, [metrics]);

  if (loading) return <div className="p-6">Loading analytics...</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Recruiting Analytics</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Views</p>
          <p className="text-2xl font-semibold text-slate-900">{totals.views}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Clicks</p>
          <p className="text-2xl font-semibold text-slate-900">{totals.clicks}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Applications</p>
          <p className="text-2xl font-semibold text-slate-900">{totals.applications}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">Job performance</div>
        <div className="divide-y divide-slate-100">
          {jobs.length === 0 ? (
            <div className="px-4 py-8 text-sm text-slate-500">No jobs posted yet.</div>
          ) : (
            jobs.map((job) => {
              const m = metrics[job.id] || {
                views: 0,
                clicks: 0,
                applications: 0,
                ctr_percent: 0,
                conversion_percent: 0,
              };
              return (
                <div key={job.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:items-center">
                  <div>
                    <p className="font-medium text-slate-900">{job.title}</p>
                    <p className="text-sm text-slate-500">{job.company}</p>
                  </div>
                  <p className="text-sm text-slate-700">Views: {m.views}</p>
                  <p className="text-sm text-slate-700">Clicks: {m.clicks}</p>
                  <p className="text-sm text-slate-700">Applications: {m.applications}</p>
                  <Link href={`/recruiter/dashboard/jobs/${job.id}`} className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
                    Open job
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

