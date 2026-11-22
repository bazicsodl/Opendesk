"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function SuggestedPeoplePage() {
  const [people, setPeople] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/users/suggested?limit=30")
      .then((res) => setPeople(Array.isArray(res) ? res : []))
      .catch(() => setPeople([]));
  }, []);

  async function connect(userId: string) {
    setBusyId(userId);
    try {
      await apiFetch(`/connections/send/${userId}`, { method: "POST" });
      setPeople((prev) => prev.filter((p) => p.id !== userId));
    } catch (err) {
      console.error(err);
      alert("Could not send connection request.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page-shell space-y-4">
      <section className="panel p-5">
        <h1 className="page-title">Suggested Accounts</h1>
        <p className="page-subtitle">Ranked from skills, preferences, interactions, and mutual network.</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {people.map((u) => (
          <article key={u.id} className="panel p-4">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/profile/${u.id}`} className="flex items-center gap-3">
                <img src={u.image_url || "/default-avatar.svg"} alt={u.name || "User"} className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <h3 className="font-semibold text-slate-900">{u.name}</h3>
                  <p className="text-sm text-slate-600">{u.headline || u.company || "Professional"}</p>
                </div>
              </Link>
              <button
                onClick={() => connect(u.id)}
                disabled={busyId === u.id}
                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {busyId === u.id ? "Sending..." : "Connect"}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {u.mutual_count ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">{u.mutual_count} mutual connections</span> : null}
              {(u.reasons || []).slice(0, 2).map((r: string, i: number) => (
                <span key={`${u.id}-r-${i}`} className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                  {r}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
