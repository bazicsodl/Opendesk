"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api"; // axios instance
import { useParams } from "next/navigation";
import Link from "next/link";

interface Applicant {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  user: {
    name: string;
    headline: string;
    location: string;
    skills: string[];
  };
}

export default function ApplicantsListPage() {
  const params = useParams();
  const jobId = params.id;

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchApplicants() {
    try {
      const res = await api.get(`/recruiter/jobs/${jobId}/applicants`);
      setApplicants(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(appId: string, action: "accept" | "reject") {
    try {
      const status = action === "accept" ? "accepted" : "rejected";
      await api.put(`/jobs/applications/${appId}/review`, { status });
      fetchApplicants();
    } catch (err) {
      await api.post(`/recruiter/applications/${appId}/${action}`);
      fetchApplicants();
    }
  }

  useEffect(() => {
    fetchApplicants();
  }, []);

  if (loading)
    return (
      <div className="p-10 text-center text-gray-400 animate-pulse">
        Loading applicants...
      </div>
    );

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Applicants</h1>

      {applicants.length === 0 && (
        <div className="text-gray-500 text-center py-20">
          No applicants yet.
        </div>
      )}

      <div className="space-y-6">
        {applicants.map((app) => (
          <div
            key={app.id}
            className="border rounded-xl p-6 bg-white shadow-sm flex justify-between items-center"
          >
            <div>
              <h2 className="text-xl font-semibold">{app.user.name}</h2>
              <p className="text-gray-500">{app.user.headline}</p>

              <div className="flex flex-wrap gap-2 mt-3">
                {app.user.skills?.map((s: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {s}
                  </span>
                ))}
              </div>

              <p className="mt-3 text-sm text-gray-500">
                Applied: {new Date(app.created_at).toLocaleDateString()}
              </p>

              <p
                className={`mt-2 text-sm font-medium ${
                  app.status === "accepted"
                    ? "text-green-600"
                    : app.status === "rejected"
                    ? "text-red-600"
                    : "text-emerald-600"
                }`}
              >
                Status: {app.status}
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3">
              {app.status === "pending" && (
                <>
                  <button
                    onClick={() => updateStatus(app.id, "accept")}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => updateStatus(app.id, "reject")}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg"
                  >
                    Reject
                  </button>
                </>
              )}

              <Link href={`/recruiter/applicants/${app.id}`} className="px-4 py-2 bg-gray-200 rounded-lg">
                View Profile
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
