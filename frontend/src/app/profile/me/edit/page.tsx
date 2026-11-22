"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { clearAuth, getToken } from "@/lib/auth";

export default function EditMyProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [school, setSchool] = useState("");
  const [degree, setDegree] = useState("");
  const [company, setCompany] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [experience, setExperience] = useState("");
  const [educationDetails, setEducationDetails] = useState("");
  const [featuredLinksText, setFeaturedLinksText] = useState("");
  const [website, setWebsite] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      clearAuth();
      router.replace("/auth/login");
      setLoading(false);
      return;
    }

    apiFetch("/profile/me")
      .then((data) => {
        setHeadline(data.headline || "");
        setBio(data.bio || "");
        setLocation(data.location || "");
        setSkills((data.skills || []).join(", "));
        setSchool(data.school || "");
        setDegree(data.degree || "");
        setCompany(data.company || "");
        setCurrentRole(data.currentRole || "");
        setExperience(data.experience || "");
        setEducationDetails(data.educationDetails || data.education_details || "");
        setFeaturedLinksText((data.featuredLinks || data.featured_links || []).join(", "));
        setWebsite(data.website || "");
        setImageUrl(data.imageUrl || data.image_url || "");
        setCoverImageUrl(data.coverImageUrl || data.cover_image_url || "");
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        if (message.startsWith("401")) {
          clearAuth();
          router.replace("/auth/login");
          return;
        }
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function upload(file: File) {
    const token = getToken();
    if (!token) {
      clearAuth();
      router.replace("/auth/login");
      throw new Error("Unauthorized");
    }
    const formData = new FormData();
    formData.append("file", file);
    const data = await apiFetch("/upload", { method: "POST", body: formData });
    return data.url as string;
  }

  async function save() {
    try {
      const token = getToken();
      if (!token) {
        clearAuth();
        router.replace("/auth/login");
        return;
      }
      await apiFetch("/profile", {
        method: "POST",
        body: JSON.stringify({
          headline,
          bio,
          location,
          school,
          degree,
          company,
          current_role: currentRole,
          currentRole,
          experience,
          education_details: educationDetails,
          educationDetails,
          featured_links: featuredLinksText.split(",").map((s) => s.trim()).filter(Boolean),
          featuredLinks: featuredLinksText.split(",").map((s) => s.trim()).filter(Boolean),
          website,
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          image_url: imageUrl,
          imageUrl,
          cover_image_url: coverImageUrl,
          coverImageUrl: coverImageUrl,
        }),
      });
      router.push("/profile/me");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith("401")) {
        clearAuth();
        router.replace("/auth/login");
        return;
      }
      console.error(err);
      alert("Failed to update profile");
    }
  }

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
      <div className="bg-white p-5 shadow rounded-xl space-y-4">
        {coverImageUrl ? <img src={coverImageUrl} className="w-full h-44 rounded-lg object-cover" alt="Cover preview" /> : null}
        <label className="block">
          <span className="font-semibold">Cover Image</span>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setCoverImageUrl(await upload(file));
            }}
            className="w-full p-2 border rounded mt-1"
          />
        </label>

        {imageUrl ? <img src={imageUrl} className="w-28 h-28 rounded-full object-cover" alt="Profile preview" /> : null}
        <label className="block">
          <span className="font-semibold">Profile Image</span>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setImageUrl(await upload(file));
            }}
            className="w-full p-2 border rounded mt-1"
          />
        </label>

        <label className="block">
          <span className="font-semibold">Headline</span>
          <input value={headline} onChange={(e) => setHeadline(e.target.value)} className="w-full p-2 border rounded mt-1" />
        </label>

        <label className="block">
          <span className="font-semibold">Bio</span>
          <textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} className="w-full p-2 border rounded mt-1" />
        </label>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="font-semibold">Location</span>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full p-2 border rounded mt-1" />
          </label>
          <label className="block">
            <span className="font-semibold">Current Role</span>
            <input value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} className="w-full p-2 border rounded mt-1" />
          </label>
          <label className="block sm:col-span-2">
            <span className="font-semibold">Experience Summary</span>
            <textarea rows={4} value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="Summarize your work experience, impact, and projects." />
          </label>
          <label className="block sm:col-span-2">
            <span className="font-semibold">Education Details</span>
            <textarea rows={3} value={educationDetails} onChange={(e) => setEducationDetails(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="Programs, honors, certifications, or notable coursework." />
          </label>
          <label className="block">
            <span className="font-semibold">Company</span>
            <input value={company} onChange={(e) => setCompany(e.target.value)} className="w-full p-2 border rounded mt-1" />
          </label>
          <label className="block">
            <span className="font-semibold">School</span>
            <input value={school} onChange={(e) => setSchool(e.target.value)} className="w-full p-2 border rounded mt-1" />
          </label>
          <label className="block">
            <span className="font-semibold">Degree</span>
            <input value={degree} onChange={(e) => setDegree(e.target.value)} className="w-full p-2 border rounded mt-1" />
          </label>
          <label className="block">
            <span className="font-semibold">Website</span>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full p-2 border rounded mt-1" />
          </label>
          <label className="block sm:col-span-2">
            <span className="font-semibold">Featured Links (comma separated)</span>
            <input value={featuredLinksText} onChange={(e) => setFeaturedLinksText(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="https://portfolio.com, https://github.com/username" />
          </label>
        </div>

        <label className="block">
          <span className="font-semibold">Skills (comma separated)</span>
          <input value={skills} onChange={(e) => setSkills(e.target.value)} className="w-full p-2 border rounded mt-1" />
        </label>

        <button onClick={save} className="w-full bg-emerald-700 text-white py-2 rounded-lg mt-2">
          Save Changes
        </button>
      </div>
    </div>
  );
}
