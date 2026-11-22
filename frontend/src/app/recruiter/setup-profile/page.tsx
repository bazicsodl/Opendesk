"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function SetupRecruiterProfile() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");

  async function handleSubmit(e: any) {
    e.preventDefault();

    try {
      const res = await api.post("/recruiter/create", {
        company_name: companyName,
        industry: industry,
        location: location,
        website: "",
        logo: "",
      });

      router.push("/recruiter/dashboard");
    } catch (err: any) {
      alert(err.response?.data?.error || "Profile setup failed");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <h1 className="text-3xl font-bold mb-6">Set Up Your Company Profile</h1>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          className="w-full p-2 border rounded"
          placeholder="Company Name"
          onChange={(e) => setCompanyName(e.target.value)}
        />

        <input
          className="w-full p-2 border rounded"
          placeholder="Industry"
          onChange={(e) => setIndustry(e.target.value)}
        />

        <input
          className="w-full p-2 border rounded"
          placeholder="Location"
          onChange={(e) => setLocation(e.target.value)}
        />

        <button className="w-full bg-green-600 text-white p-2 rounded">
          Save Profile
        </button>
      </form>
    </div>
  );
}
