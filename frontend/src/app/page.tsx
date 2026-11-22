"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";
import ProfileCard from "../components/ProfileCard";
import RecommendedJobs from "../components/RecommendedJobs";
import PostList from "../components/PostList";
import CreatePostBox from "../components/CreatePostBox";
import SuggestedPeopleCard from "../components/SuggestedPeopleCard";
import TalentSignalCard from "../components/TalentSignalCard";
import SponsorCard from "../components/SponsorCard";
import { clearAuth, getToken } from "../lib/auth";

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [suggested, setSuggested] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const token = typeof window !== "undefined" ? getToken() : null;
    if (!token) {
      clearAuth();
      router.replace("/auth/login");
      setLoading(false);
      return;
    }

    try {
      const [feed, myProfile, recommendedJobs, people] = await Promise.all([
        apiFetch(`/feed?t=${Date.now()}`),
        apiFetch(`/profile/me?t=${Date.now()}`),
        apiFetch("/jobs/recommended"),
        apiFetch("/users/suggested?limit=8"),
      ]);

      setPosts(Array.isArray(feed) ? feed : []);
      setProfile(myProfile || null);
      setMe(myProfile || null);
      setJobs(Array.isArray(recommendedJobs) ? recommendedJobs : []);
      setSuggested(Array.isArray(people) ? people : []);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith("401")) {
        clearAuth();
        router.replace("/auth/login");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const onProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ coverImageUrl?: string; imageUrl?: string }>).detail;
      if (detail?.coverImageUrl || detail?.imageUrl) {
        setProfile((prev: any) =>
          prev
            ? {
                ...prev,
                ...(detail.coverImageUrl ? { coverImageUrl: detail.coverImageUrl } : {}),
                ...(detail.imageUrl ? { imageUrl: detail.imageUrl } : {}),
              }
            : prev,
        );
        setMe((prev: any) =>
          prev
            ? {
                ...prev,
                ...(detail.coverImageUrl ? { coverImageUrl: detail.coverImageUrl } : {}),
                ...(detail.imageUrl ? { imageUrl: detail.imageUrl } : {}),
              }
            : prev,
        );
      } else {
        load();
      }
      load();
    };
    window.addEventListener("profile-updated", onProfileUpdated as EventListener);
    return () => window.removeEventListener("profile-updated", onProfileUpdated as EventListener);
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-700 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-transparent animate-fadeIn">
      <div className="hidden lg:grid grid-cols-12 gap-6 px-6 py-8">
        <aside className="col-span-3 space-y-6 self-start sticky top-24 h-fit">
          <ProfileCard me={me} profile={profile} />
          <TalentSignalCard profile={profile} />
        </aside>

        <main className="col-span-6 space-y-6">
          <CreatePostBox me={me} />
          <PostList posts={posts} />
        </main>

        <aside className="col-span-3 space-y-6">
          <RecommendedJobs jobs={jobs} profile={profile} />
          <SponsorCard
            title="Hire Faster With Boosted Listings"
            description="Promote your role to top talent in your niche and get qualified applicants in hours."
            cta="Promote a Job"
            href="/recruiter/dashboard/jobs/new"
          />
          <SuggestedPeopleCard users={suggested} />
          <SponsorCard
            title="Get Interview-Ready Portfolio Review"
            description="Optimize your profile and work samples to rank higher in recruiter searches."
            cta="Upgrade Profile"
            href="/profile/me/edit"
          />
        </aside>
      </div>

      <div className="lg:hidden px-4 py-6 space-y-6">
        <ProfileCard me={me} profile={profile} />
        <TalentSignalCard profile={profile} />
        <CreatePostBox me={me} />
        <RecommendedJobs jobs={jobs.slice(0, 4)} profile={profile} />
        <SponsorCard
          title="Hire Faster With Boosted Listings"
          description="Promote your role to top talent in your niche and get qualified applicants in hours."
          cta="Promote a Job"
          href="/recruiter/dashboard/jobs/new"
        />
        <SuggestedPeopleCard users={suggested} />
        <PostList posts={posts} />
      </div>
    </div>
  );
}
