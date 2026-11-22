"use client";

import Link from "next/link";
import { MapPin, Edit2, School, Building2 } from "lucide-react";
import CoverImage from "@/components/CoverImage";
import { resolveMediaUrl } from "@/lib/media";

export default function ProfileCard({ me, profile }: { me: any; profile: any }) {
  if (!profile) return null;

  const cover =
    profile?.coverImageUrl ||
    profile?.cover_image_url ||
    profile?.coverImageURL ||
    profile?.cover ||
    me?.coverImageUrl ||
    me?.cover_image_url ||
    me?.coverImageURL ||
    "";
  const avatar = resolveMediaUrl(
    me?.imageUrl || me?.image_url || me?.imageURL || profile?.imageUrl || profile?.image_url,
  ) || "/default-avatar.svg";

  return (
    <div className="premium-card overflow-hidden">
      <div className="relative">
        <CoverImage url={cover} height="h-28" />
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2">
          <div className="relative w-24 h-24 profile-ring">
            <img src={avatar} className="w-full h-full object-cover rounded-full" alt="Profile" />
            <Link href="/profile/me/edit" className="absolute bottom-0 right-0 w-8 h-8 theme-gradient-brand rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <Edit2 className="w-4 h-4 text-white" />
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6 pt-16">
        <div className="flex flex-col items-center">
          <div className="text-center mt-4">
            <h2 className="font-bold text-lg text-slate-900">{profile.name || "You"}</h2>
            <p className="text-gradient font-semibold">{profile.headline || "Professional"}</p>
            <p className="text-gray-600 text-sm mt-2 max-w-xs line-clamp-3">{profile.bio || "Add a short bio to improve recommendations."}</p>

            <div className="mt-3 space-y-1 text-sm text-slate-600">
              {profile.location ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  {profile.location}
                </div>
              ) : null}
              {profile.school ? (
                <div className="flex items-center justify-center gap-1">
                  <School className="w-4 h-4 text-slate-500" />
                  <span>{profile.school}</span>
                </div>
              ) : null}
              {profile.company ? (
                <div className="flex items-center justify-center gap-1">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span>{profile.company}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
