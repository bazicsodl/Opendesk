"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { resolveMediaUrl } from "@/lib/media";

export default function SuggestedPeopleCard({ users }: { users: any[] }) {
  return (
    <div className="premium-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <div className="premium-icon-badge">
            <Users className="w-5 h-5 text-white" />
          </div>
          <span className="text-gradient">Suggested Accounts</span>
        </h3>
      </div>

      <div className="space-y-3">
        {users.slice(0, 4).map((u) => (
          <Link
            key={u.id}
            href={`/profile/${u.id}`}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/80 p-3 theme-border-brand-hover"
          >
            <div className="flex items-center gap-3">
              <img src={resolveMediaUrl(u.image_url || u.imageUrl || u.avatar) || "/default-avatar.svg"} alt={u.name || "User"} className="h-10 w-10 rounded-full object-cover" />
              <div>
                <p className="font-medium text-slate-900">{u.name}</p>
                <p className="text-xs text-slate-600">{u.headline || u.company || "Professional"}</p>
              </div>
            </div>
            {u.mutual_count ? <span className="text-xs rounded-full theme-soft-pill px-2 py-1">{u.mutual_count} mutual</span> : null}
          </Link>
        ))}
      </div>

      <Link
        href="/people/suggested"
        className="block mt-5 px-4 py-3 text-center theme-gradient-brand-soft theme-text-strong rounded-xl transition-all duration-300 hover:shadow-inner font-medium"
      >
        View more people
      </Link>
    </div>
  );
}
