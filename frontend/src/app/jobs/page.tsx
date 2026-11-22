"use client";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, Sparkles, Clock3 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import JobCard from "@/components/JobCard";

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [view, setView] = useState<"latest" | "recommended">("recommended");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const path = view === "recommended" ? "/jobs/recommended" : "/jobs";
    apiFetch(path)
      .then((res) => setJobs(Array.isArray(res) ? res : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [view]);

  return (
    <div className="page-shell space-y-5">
      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <BriefcaseBusiness className="h-6 w-6 text-emerald-700" />
              Jobs Marketplace
            </h1>
            <p className="page-subtitle">Discover high-signal opportunities tailored to your profile.</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setView("recommended")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${view === "recommended" ? "bg-slate-900 text-white" : "text-slate-600"}`}
            >
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Recommended
              </span>
            </button>
            <button
              onClick={() => setView("latest")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${view === "latest" ? "bg-slate-900 text-white" : "text-slate-600"}`}
            >
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                Latest
              </span>
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {loading ? <div className="panel p-5 text-slate-600">Loading opportunities...</div> : null}
        {!loading && jobs.length === 0 ? (
          <div className="panel p-8 text-center text-slate-600">No jobs found for this view yet.</div>
        ) : null}
        {jobs.map((job: any) => (
          <JobCard key={job.id} job={job} />
        ))}
      </section>
    </div>
  );
}

