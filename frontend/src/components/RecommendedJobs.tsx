"use client";

import Link from "next/link";
import { Briefcase, MapPin, TrendingUp } from "lucide-react";
import { computeJobMatch } from "@/lib/signals";

export default function RecommendedJobs({ jobs, profile }: { jobs: any[]; profile?: any }) {
  const rankedJobs = [...(Array.isArray(jobs) ? jobs : [])]
    .map((job) => {
      const match = computeJobMatch(job, profile);
      return { ...job, matchScore: match.score, matchReasons: match.reasons };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return (
    <div className="premium-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <div className="premium-icon-badge">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-gradient">Recommended Jobs</span>
        </h3>
        <span className="premium-chip">{rankedJobs.length} new</span>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {rankedJobs.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600">
            No recommendations yet. Complete your profile to improve matching.
          </div>
        ) : null}

        {rankedJobs.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="block border border-gray-200 rounded-xl p-4 theme-border-brand-hover transition-all duration-300 hover:shadow-md group bg-white/80"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 group-hover:text-emerald-800 transition-colors">
                  {job.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">{job.company}</p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <div className="flex items-center gap-1 text-xs text-emerald-800">
                    <MapPin className="w-3 h-3" />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-amber-700">
                    <Briefcase className="w-3 h-3" />
                    {job.type || "Full-time"}
                  </div>
                  <span className="text-xs rounded-full theme-soft-pill px-2 py-1">
                    Match {job.matchScore}%
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Why: {job.matchReasons.join(" • ")}
                </p>
              </div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg theme-gradient-brand-soft flex items-center justify-center transition-colors">
                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-800" />
              </div>
            </div>
            {job.salary && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-sm font-medium text-gradient">{job.salary}</span>
              </div>
            )}
          </Link>
        ))}
      </div>

      <Link
        href="/jobs"
        className="block mt-6 px-4 py-3 text-center theme-gradient-brand-soft theme-text-strong rounded-xl transition-all duration-300 hover:shadow-inner font-medium"
      >
        View all jobs
      </Link>
    </div>
  );
}
