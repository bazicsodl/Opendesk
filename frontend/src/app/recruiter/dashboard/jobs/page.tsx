"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

export default function RecruiterJobsList() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/recruiter/jobs")
      .then((res) => setJobs(Array.isArray(res) ? res : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-4">Loading jobs...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Jobs</h1>
        <Link href="/recruiter/dashboard/jobs/new" className="px-4 py-2 bg-emerald-700 text-white rounded-lg">
          + Post New Job
        </Link>
      </div>

      {jobs.length === 0 ? <p className="text-slate-500">You have not posted any jobs yet.</p> : null}

      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white p-5 rounded-xl shadow border border-slate-200 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{job.title}</h2>
              <p className="text-slate-600">{job.company} · {job.location}</p>

              <div className="flex gap-2 mt-3 flex-wrap">
                {job.skills?.map((s: any, i: number) => (
                  <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-sm">
                    {s?.skill || s}
                  </span>
                ))}
              </div>

              <div className="flex gap-6 mt-4 text-sm text-slate-500">
                <span>{job.views || 0} views</span>
                <span>{job.applicants_count || 0} applicants</span>
              </div>

              <div className="flex gap-3 mt-5">
                <Link href={`/recruiter/dashboard/jobs/${job.id}`} className="px-3 py-1 bg-emerald-700 text-white rounded">View</Link>
                <Link href={`/recruiter/dashboard/jobs/${job.id}/edit`} className="px-3 py-1 bg-slate-700 text-white rounded">Edit</Link>
                <button
                  onClick={async () => {
                    if (!confirm("Delete this job?")) return;
                    await apiFetch(`/recruiter/jobs/${job.id}`, {}, "DELETE");
                    setJobs(jobs.filter((j) => j.id !== job.id));
                  }}
                  className="px-3 py-1 bg-rose-600 text-white rounded"
                >
                  Delete
                </button>
                <Link href={`/recruiter/dashboard/jobs/${job.id}/applicants`} className="px-3 py-1 bg-emerald-600 text-white rounded">
                  Applicants
                </Link>
              </div>
            </div>

            <div className="text-right">
              <p className="font-semibold text-slate-900">
                N{job.salary_min?.toLocaleString()} - N{job.salary_max?.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
