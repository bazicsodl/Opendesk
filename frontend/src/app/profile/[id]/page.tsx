"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { Briefcase, MapPin, Calendar, Mail, Users, Heart, FileText, GraduationCap, Building2, Globe, Sparkles, Link as LinkIcon, BadgeCheck } from "lucide-react";
import PostList from "@/components/PostList";
import CoverImage from "@/components/CoverImage";
import { resolveMediaUrl } from "@/lib/media";

export default function ProfileView() {
  const params = useParams();
  const id = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userPosts, setUserPosts] = useState<any[]>([]);

  useEffect(() => {
    setIsLoading(true);
    apiFetch(`/profile/${id}`)
      .then(async (p) => {
        setProfile(p);
        const posts = await apiFetch(`/user/${id}/posts`).catch(() => []);
        const normalized = (Array.isArray(posts) ? posts : []).map((post: any) => ({
          ...post,
          authorName: p.name,
          authorImageUrl: p.imageUrl,
          createdAt: post.created_at || post.createdAt,
          commentsCount: post.commentsCount || 0,
        }));
        setUserPosts(normalized);
      })
      .catch(() => setProfile(null))
      .finally(() => setIsLoading(false));
  }, [id]);

  const targetId = useMemo(() => profile?.id || profile?.user_id, [profile]);

  if (isLoading) return <div className="max-w-4xl mx-auto py-8 px-4">Loading profile...</div>;
  if (!profile) return <div className="max-w-4xl mx-auto py-16 px-4 text-center text-gray-600">Profile not found.</div>;

  const cover =
    profile.coverImageUrl || profile.cover_image_url || profile.coverImageURL || profile.cover || "";
  const avatar = resolveMediaUrl(profile.imageUrl || profile.image_url || profile.imageURL) || "/default-avatar.svg";

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="relative">
          <CoverImage url={cover} height="h-36" />
          <div className="absolute left-6 bottom-0 translate-y-1/2">
            <img src={avatar} alt={profile.name || "User"} className="w-24 h-24 bg-white p-1 rounded-full object-cover border border-white shadow" />
          </div>
        </div>
        <div className="px-6 pb-6">
          <div className="mb-16" />

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{profile.name || "Anonymous User"}</h1>
          {profile.headline ? (
            <div className="flex items-center gap-2 text-lg text-gray-700 mb-3">
              <Briefcase className="w-5 h-5 text-gray-400" />
              {profile.headline}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
            {profile.location ? <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{profile.location}</div> : null}
            {profile.joinedDate ? <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />Joined {new Date(profile.joinedDate).toLocaleDateString()}</div> : null}
            {profile.email ? <div className="flex items-center gap-2"><Mail className="w-4 h-4" />{profile.email}</div> : null}
            {profile.school ? <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4" />{profile.school}{profile.degree ? ` - ${profile.degree}` : ""}</div> : null}
            {profile.company ? <div className="flex items-center gap-2"><Building2 className="w-4 h-4" />{profile.company}</div> : null}
            {profile.website ? <div className="flex items-center gap-2"><Globe className="w-4 h-4" />{profile.website}</div> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {profile.connection_status === "none" ? (
              <button
                onClick={() => apiFetch(`/connections/send/${targetId}`, { method: "POST" }).then(() => setProfile({ ...profile, connection_status: "pending" }))}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
              >
                Connect
              </button>
            ) : null}
            {profile.connection_status === "pending" ? <button className="px-4 py-2 bg-gray-400 text-white rounded-lg" disabled>Request Sent</button> : null}
            {profile.connection_status === "incoming" ? (
              <div className="flex gap-3">
                <button
                  onClick={() => apiFetch(`/connections/accept/${profile.connection_id}`, { method: "POST" }).then(() => setProfile({ ...profile, connection_status: "accepted" }))}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg"
                >
                  Accept
                </button>
                <button
                  onClick={() => apiFetch(`/connections/reject/${profile.connection_id}`, { method: "POST" }).then(() => setProfile({ ...profile, connection_status: "none" }))}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg"
                >
                  Reject
                </button>
              </div>
            ) : null}
            {profile.connection_status === "accepted" ? <button className="px-4 py-2 bg-green-600 text-white rounded-lg">Connected</button> : null}
            {typeof profile.connections_count === "number" ? <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm">{profile.connections_count} connections</div> : null}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Connections</p><p className="mt-1 flex items-center gap-2 text-xl font-semibold text-slate-900"><Users className="h-5 w-5 text-emerald-700" />{Number(profile.connections_count || 0)}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Total Likes</p><p className="mt-1 flex items-center gap-2 text-xl font-semibold text-slate-900"><Heart className="h-5 w-5 text-rose-600" />{Number(profile.likes_count || 0)}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Posts</p><p className="mt-1 flex items-center gap-2 text-xl font-semibold text-slate-900"><FileText className="h-5 w-5 text-slate-700" />{Number(profile.posts_count || 0)}</p></div>
      </div>

      {profile.bio ? (
        <div className="bg-white p-6 border rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{profile.bio}</p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="bg-white p-6 border rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 inline-flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-emerald-700" />
            Experience
          </h3>
          {profile.experience || profile.currentRole || profile.company ? (
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Current</p>
              <p className="mt-1 font-semibold text-slate-900">{profile.currentRole || "Professional"}</p>
              <p className="text-sm text-slate-600">{profile.company || "Company not specified"}</p>
              {profile.experience ? (
                <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{profile.experience}</p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No experience details shared yet.</p>
          )}
        </section>

        <section className="bg-white p-6 border rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 inline-flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-700" />
            Education
          </h3>
          {profile.school || profile.degree || profile.educationDetails || profile.education_details ? (
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">{profile.school || "Institution not specified"}</p>
              <p className="text-sm text-slate-600">{profile.degree || "Degree not specified"}</p>
              {profile.educationDetails || profile.education_details ? (
                <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{profile.educationDetails || profile.education_details}</p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No education details shared yet.</p>
          )}
        </section>
      </div>

      <section className="bg-white p-6 border rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 inline-flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-700" />
          Featured
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500 inline-flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-emerald-700" />
              Professional headline
            </p>
            <p className="mt-1 text-slate-900 font-medium">{profile.headline || "No headline provided"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500 inline-flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-emerald-700" />
              Portfolio / Website
            </p>
            {profile.website ? (
              <a href={profile.website} target="_blank" rel="noreferrer" className="mt-1 inline-block text-emerald-700 hover:underline">
                {profile.website}
              </a>
            ) : (
              <p className="mt-1 text-slate-600">No external link added.</p>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 p-4 md:col-span-2">
            <p className="text-sm text-slate-500 inline-flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-emerald-700" />
              Featured links
            </p>
            {(profile.featuredLinks || profile.featured_links)?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {(profile.featuredLinks || profile.featured_links).map((link: string, idx: number) => (
                  <a key={`${link}-${idx}`} href={link} target="_blank" rel="noreferrer" className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-800 hover:underline">
                    {link}
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-slate-600">No featured links added.</p>
            )}
          </div>
        </div>
      </section>

      {profile.skills?.length > 0 ? (
        <div className="bg-white p-6 border rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill: string, index: number) => (
              <span key={index} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm">{skill}</span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Posts</h3>
        <PostList posts={userPosts} />
      </div>
    </div>
  );
}
