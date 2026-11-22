"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { Save, User, Briefcase } from "lucide-react";

type ProfileState = {
  headline: string;
  bio: string;
  location: string;
  experience: string;
  education_details: string;
  featured_links: string[];
  skills: string[];
  image_url: string;
  cover_image_url: string;
};

export default function ProfileForm() {
  const [profile, setProfile] = useState<ProfileState>({
    headline: "",
    bio: "",
    location: "",
    experience: "",
    education_details: "",
    featured_links: [],
    skills: [],
    image_url: "",
    cover_image_url: "",
  });
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    apiFetch("/profile/me")
      .then((data) => {
        setProfile({
          headline: data.headline || "",
          bio: data.bio || "",
          location: data.location || "",
          experience: data.experience || "",
          education_details: data.educationDetails || data.education_details || "",
          featured_links: data.featuredLinks || data.featured_links || [],
          skills: data.skills || [],
          image_url: data.imageUrl || "",
          cover_image_url: data.coverImageUrl || "",
        });
        setCharCount((data.bio || "").length);
      })
      .catch(() => {});
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiFetch("/profile/", {
        method: "POST",
        body: JSON.stringify(profile),
        headers: { "Content-Type": "application/json" },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setIsSaving(false);
    }
  }

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setProfile({ ...profile, bio: value });
    setCharCount(value.length);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Edit Profile</h1>
        <p className="text-gray-600">Customize how others see you on the platform</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
              <p className="text-sm text-gray-600">This information will be visible to others</p>
            </div>
          </div>
        </div>

        <form onSubmit={save} className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Headline
              </label>
              <input
                value={profile.headline}
                onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="e.g., Senior Software Engineer at Tech Corp"
                maxLength={100}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Bio
                </label>
                <span className={`text-sm ${charCount > 500 ? "text-red-600" : "text-gray-500"}`}>{charCount}/500</span>
              </div>
              <textarea
                value={profile.bio}
                onChange={handleBioChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all min-h-[150px] resize-y"
                placeholder="Tell others about yourself, your experience, and your interests..."
                maxLength={500}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Experience Summary</label>
              <textarea
                value={profile.experience}
                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all min-h-[120px] resize-y"
                placeholder="Summarize your professional experience"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Education Details</label>
              <textarea
                value={profile.education_details}
                onChange={(e) => setProfile({ ...profile, education_details: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all min-h-[100px] resize-y"
                placeholder="Education, certifications, honors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Featured Links (comma separated)</label>
              <input
                value={profile.featured_links.join(", ")}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    featured_links: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="https://portfolio.site, https://github.com/username"
              />
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              {saved ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                  <Save className="w-4 h-4" />
                  Profile saved successfully!
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSaving}
                className="ml-auto flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
