"use client";

import Link from "next/link";
import { Briefcase, Building2, MapPin } from "lucide-react";

export default function JobCard({ job }: { job: any }) {
  const skills = job.skills ?? job.Skills ?? [];

  return (
    <article className="premium-card p-4 sm:p-5">
      <div className="flex justify-between items-start gap-3">
        <div>
          <Link href={`/jobs/${job.id}`} className="text-base sm:text-lg font-semibold text-slate-900 hover:text-emerald-800 transition-colors">
            {job.title}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              {job.company}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              {job.location}
            </span>
          </div>
        </div>
        <div className="text-right space-y-1">
          <p className="premium-chip">{job.employment_type ?? job.employmentType ?? "Role"}</p>
          <p className="text-xs text-slate-500">{job.remote_type ?? job.remoteType ?? ""}</p>
        </div>
      </div>

      <p className="text-sm text-slate-700 mt-3 line-clamp-3 leading-6">
        {job.description ?? job.description?.slice(0, 240)}
      </p>

      <div className="flex gap-2 flex-wrap mt-4 pt-4 premium-divider">
        {skills.map((s: any, i: number) => (
          <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-50 to-amber-50 text-emerald-800 border border-emerald-100">
            {s.skill ?? s}
          </span>
        ))}
        {!skills.length && (
          <span className="text-xs text-slate-500 inline-flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5" />
            Skills not listed
          </span>
        )}
      </div>
    </article>
  );
}
