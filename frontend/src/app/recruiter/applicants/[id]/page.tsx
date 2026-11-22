"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";

interface ApplicantProfile {
  id: string;
  status: string;
  applied_at: string;
  user: {
    id?: string;
    name: string;
    headline: string;
    bio: string;
    location: string;
    skills: string[];
    experience: {
      role: string;
      company: string;
      start_date: string;
      end_date: string;
      description: string;
    }[];
    education: {
      school: string;
      degree: string;
      start_year: string;
      end_year: string;
    }[];
    cv_url: string | null;
  };
}

export default function ApplicantProfilePage() {
  const params = useParams();
  const appId = params.id;

  const [data, setData] = useState<ApplicantProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile() {
    try {
      const res = await api.get(`/recruiter/applicants/${appId}`);
      setData(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(action: "accept" | "reject") {
    try {
      await api.post(`/recruiter/applications/${appId}/${action}`);
      fetchProfile();
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading)
    return (
      <div className="p-8 text-gray-400 text-center animate-pulse">
        Loading profile...
      </div>
    );

  if (!data) return <div className="p-8">Not found</div>;

  const user = data.user;

  return (
    <div className="p-8 space-y-10">
      {/* HEADER */}
      <div className="bg-white p-8 rounded-2xl shadow space-y-3">
        <h1 className="text-3xl font-bold">{user.name}</h1>
        <p className="text-gray-600 text-lg">{user.headline}</p>

        <p className="text-gray-500">{user.location}</p>

        <div className="flex gap-3 mt-4">
          {data.status === "pending" && (
            <>
              <button
                onClick={() => updateStatus("accept")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg"
              >
                Accept
              </button>
              <button
                onClick={() => updateStatus("reject")}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Reject
              </button>
            </>
          )}

          {user.id ? (
            <Link href={`/messages/${user.id}`} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">
              Message Applicant
            </Link>
          ) : null}
        </div>

        <p className="mt-2 text-sm text-gray-500">
          Applied: {new Date(data.applied_at).toLocaleDateString()}
        </p>

        <span
          className={`inline-block mt-2 px-3 py-1 text-sm rounded-full ${
            data.status === "accepted"
              ? "bg-green-100 text-green-700"
              : data.status === "rejected"
              ? "bg-red-100 text-red-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {data.status}
        </span>
      </div>

      {/* BIO */}
      <div className="bg-white p-8 rounded-2xl shadow">
        <h2 className="text-xl font-bold mb-3">About</h2>
        <p className="text-gray-700 leading-relaxed">{user.bio}</p>
      </div>

      {/* SKILLS */}
      <div className="bg-white p-8 rounded-2xl shadow">
        <h2 className="text-xl font-bold mb-3">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {user.skills?.map((s, i) => (
            <span
              key={i}
              className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* EXPERIENCE */}
      <div className="bg-white p-8 rounded-2xl shadow space-y-6">
        <h2 className="text-xl font-bold">Experience</h2>

        {user.experience?.map((exp, i) => (
          <div key={i} className="border-b pb-4">
            <h3 className="text-lg font-semibold">{exp.role}</h3>
            <p className="text-gray-600">{exp.company}</p>
            <p className="text-gray-500 text-sm">
              {exp.start_date} — {exp.end_date}
            </p>
            <p className="mt-2 text-gray-700">{exp.description}</p>
          </div>
        ))}
      </div>

      {/* EDUCATION */}
      <div className="bg-white p-8 rounded-2xl shadow space-y-6">
        <h2 className="text-xl font-bold">Education</h2>

        {user.education?.map((e, i) => (
          <div key={i} className="border-b pb-4">
            <h3 className="text-lg font-semibold">{e.school}</h3>
            <p className="text-gray-600">{e.degree}</p>
            <p className="text-gray-500 text-sm">
              {e.start_year} — {e.end_year}
            </p>
          </div>
        ))}
      </div>

      {/* CV */}
      {user.cv_url && (
        <div className="bg-white p-8 rounded-2xl shadow">
          <h2 className="text-xl font-bold mb-4">CV / Resume</h2>
          <a
            href={user.cv_url}
            target="_blank"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg"
          >
            View / Download CV
          </a>
        </div>
      )}
    </div>
  );
}
