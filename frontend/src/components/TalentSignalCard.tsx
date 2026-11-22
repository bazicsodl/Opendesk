"use client";

import Link from "next/link";
import { ShieldCheck, TrendingUp, Sparkles } from "lucide-react";
import { computeProfileStrength } from "@/lib/signals";

export default function TalentSignalCard({ profile }: { profile: any }) {
  const strength = computeProfileStrength(profile);
  const nextActions = strength.missing.slice(0, 3);

  if (strength.score >= 100) return null;

  return (
    <section className="premium-card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 inline-flex items-center gap-2">
          <span className="premium-icon-badge">
            <ShieldCheck className="h-4 w-4 text-white" />
          </span>
          Talent Signal
        </h3>
        <span className="premium-chip">{strength.tier}</span>
      </div>

      <div className="mt-4">
        <div className="flex items-end justify-between">
          <p className="text-sm text-slate-600">Profile Strength</p>
          <p className="text-lg font-bold text-gradient">{strength.score}%</p>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full theme-gradient-brand"
            style={{ width: `${strength.score}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {strength.completedItems}/{strength.totalItems} key trust signals completed
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium text-slate-800 inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-700" />
          High-impact next moves
        </p>
        {nextActions.length === 0 ? (
          <p className="text-sm text-slate-600">You are fully optimized. Publish posts to keep momentum.</p>
        ) : (
          nextActions.map((item) => (
            <p key={item} className="text-sm text-slate-600">- {item}</p>
          ))
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href="/profile/me/edit" className="rounded-lg theme-gradient-brand text-white px-3 py-2 text-sm text-center font-medium">
          Improve Profile
        </Link>
        <Link href="/settings" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-center text-slate-700 font-medium hover:bg-slate-50">
          Settings
        </Link>
      </div>

      <div className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-700" />
        Better signals improve ranking in search and recommendations.
      </div>
    </section>
  );
}
