"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import ApplyModal from "@/components/ApplyModal";

export default function JobDetailPage() {
  const [job, setJob] = useState<any | null>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/jobs/${id}`)
      .then((res) => {
        setJob(res.data);
        return api.post(`/jobs/${id}/track`, { event: "view" });
      })
      .catch(() => setJob(null))
      .finally(() => setLoading(false));

    api.get(`/jobs/${id}/people-also-applied`)
      .then((res) => setRelated(Array.isArray(res.data) ? res.data : []))
      .catch(() => setRelated([]));
  }, [id]);

  if (loading) return <div className="panel p-6">Loading...</div>;
  if (!job) return <div className="panel p-6">Job not found.</div>;

  return (
    <div className="page-shell space-y-5">
      <section className="panel p-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
            <p className="text-sm text-slate-600">{job.company} · {job.location}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">{job.employment_type ?? job.employmentType}</p>
            <p className="text-sm text-slate-500">{job.remote_type ?? job.remoteType}</p>
          </div>
        </div>

        <div className="mt-6 prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: job.description || job.description_html || job.description }} />
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={async () => {
              await api.post(`/jobs/${job.id}/track`, { event: "click" }).catch(() => {});
              setShowApply(true);
            }}
            className="px-4 py-2 bg-emerald-700 text-white rounded"
          >
            Apply
          </button>
          <Link href="/jobs" className="px-4 py-2 bg-slate-100 rounded text-slate-700">
            Back to Jobs
          </Link>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-2 text-slate-900">Skills</h3>
          <div className="flex gap-2 flex-wrap">
            {(job.skills ?? job.Skills ?? []).map((s: any, i: number) => (
              <span key={i} className="text-xs px-2 py-1 bg-emerald-50 text-emerald-800 rounded-full">{s.skill ?? s}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="panel p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">People Also Applied To</h3>
        {related.length === 0 ? <p className="text-sm text-slate-500">No related jobs yet.</p> : null}
        <div className="grid gap-3">
          {related.slice(0, 6).map((r) => (
            <Link key={r.id} href={`/jobs/${r.id}`} className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <p className="font-medium text-slate-900">{r.title}</p>
              <p className="text-sm text-slate-500">{r.company}</p>
            </Link>
          ))}
        </div>
      </section>

      {showApply ? <ApplyModal jobId={job.id} onClose={() => setShowApply(false)} /> : null}
    </div>
  );
}
