"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, MapPin, Sparkles, Users, Heart, FileText, GraduationCap, Building2, Globe, Settings } from "lucide-react";
import { apiFetch } from "@/lib/api";
import PostList from "@/components/PostList";
import CoverImage from "@/components/CoverImage";
import { resolveMediaUrl } from "@/lib/media";
import TalentSignalCard from "@/components/TalentSignalCard";
import { clearAuth, getToken } from "@/lib/auth";

export default function MyProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);

  async function load() {
    const token = getToken();
    if (!token) {
      clearAuth();
      router.replace("/auth/login");
      return;
    }
    try {
      const data = await apiFetch(`/profile/me?t=${Date.now()}`);
      setMe(data);
      const myPosts = await apiFetch(`/user/${data.id}/posts?t=${Date.now()}`).catch(() => []);
      const normalized = (Array.isArray(myPosts) ? myPosts : []).map((p: any) => ({
        ...p,
        authorName: data.name,
        authorImageUrl: data.imageUrl,
        createdAt: p.created_at || p.createdAt,
        commentsCount: p.commentsCount || 0,
      }));
      setPosts(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith("401")) {
        clearAuth();
        router.replace("/auth/login");
      }
      throw err;
    }
  }

  useEffect(() => {
    load().catch(console.error);
    const onProfileUpdated = () => {
      load().catch(console.error);
    };
    window.addEventListener("profile-updated", onProfileUpdated);
    return () => window.removeEventListener("profile-updated", onProfileUpdated);
  }, [router]);

  if (!me) {
    return <div className="panel p-5 text-slate-600">Loading profile...</div>;
  }
  
  const cover = me.coverImageUrl || me.cover_image_url || me.coverImageURL || me.cover || "";
  const avatar = resolveMediaUrl(me.imageUrl || me.image_url || me.imageURL) || "/default-avatar.svg";

  return (
    <div className="page-shell space-y-5">
      <section className="panel overflow-hidden">
        <div className="relative">
          <CoverImage url={cover} height="h-36" />
          <div className="absolute left-6 bottom-0 translate-y-1/2">
            <img src={avatar} className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg" alt="profile" />
          </div>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4 pl-[7.5rem]">
              <div className="pb-1">
                <h1 className="text-2xl font-bold text-slate-900">{me.name}</h1>
                <p className="text-slate-500">{me.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/settings" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                <Settings className="h-4 w-4" /> Settings
              </Link>
              <Link href="/profile/me/edit" className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                <Edit3 className="h-4 w-4" /> Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="mb-2 text-xl font-semibold text-slate-900">{me.headline || "Professional headline"}</h2>
        <p className="whitespace-pre-line text-slate-700">{me.bio || "No bio added yet."}</p>
        <div className="mt-4 grid sm:grid-cols-2 gap-2 text-slate-600">
          <p className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{me.location || "Location not set"}</p>
          {me.company ? <p className="inline-flex items-center gap-2"><Building2 className="h-4 w-4" />{me.company}</p> : null}
          {me.school ? <p className="inline-flex items-center gap-2"><GraduationCap className="h-4 w-4" />{me.school}{me.degree ? ` - ${me.degree}` : ""}</p> : null}
          {me.website ? <p className="inline-flex items-center gap-2"><Globe className="h-4 w-4" />{me.website}</p> : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="panel p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Experience</h3>
          {me.experience ? (
            <p className="whitespace-pre-line text-slate-700">{me.experience}</p>
          ) : (
            <p className="text-slate-500">No experience summary added yet.</p>
          )}
        </div>
        <div className="panel p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Education Details</h3>
          {me.educationDetails || me.education_details ? (
            <p className="whitespace-pre-line text-slate-700">{me.educationDetails || me.education_details}</p>
          ) : (
            <p className="text-slate-500">No education details added yet.</p>
          )}
        </div>
      </section>

      <section className="panel p-5">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Featured Links</h3>
        {(me.featuredLinks || me.featured_links)?.length ? (
          <div className="flex flex-wrap gap-2">
            {(me.featuredLinks || me.featured_links).map((link: string, idx: number) => (
              <a key={`${link}-${idx}`} href={link} target="_blank" rel="noreferrer" className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 hover:underline">
                {link}
              </a>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">No featured links yet.</p>
        )}
      </section>

      <TalentSignalCard profile={me} />

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="panel p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Connections</p><p className="mt-1 flex items-center gap-2 text-xl font-semibold text-slate-900"><Users className="h-5 w-5 text-emerald-700" />{Number(me.connections_count || 0)}</p></div>
        <div className="panel p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Total Likes</p><p className="mt-1 flex items-center gap-2 text-xl font-semibold text-slate-900"><Heart className="h-5 w-5 text-rose-600" />{Number(me.likes_count || 0)}</p></div>
        <div className="panel p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Posts</p><p className="mt-1 flex items-center gap-2 text-xl font-semibold text-slate-900"><FileText className="h-5 w-5 text-slate-700" />{Number(me.posts_count || 0)}</p></div>
      </section>

      <section className="panel p-5">
        <h3 className="mb-3 inline-flex items-center gap-2 text-lg font-semibold text-slate-900"><Sparkles className="h-5 w-5 text-emerald-700" />Skills</h3>
        {me.skills?.length ? (
          <div className="flex flex-wrap gap-2">
            {me.skills.map((skill: string) => (
              <span key={skill} className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">{skill}</span>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">No skills added yet.</p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Your Recent Posts</h3>
        <PostList posts={posts} />
      </section>
    </div>
  );
}
