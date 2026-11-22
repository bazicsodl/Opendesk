"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, UserRoundPlus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { clearAuth, getToken } from "@/lib/auth";

export default function ConnectionsPage() {
  const router = useRouter();
  const [pending, setPending] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!getToken()) {
      clearAuth();
      router.replace("/auth/login");
      return;
    }
    void loadData();
  }, [router]);

  async function loadData() {
    await Promise.all([loadPending(), loadFriends()]);
  }

  async function loadPending() {
    try {
      const pend = await apiFetch("/connections/pending");
      const array = Array.isArray(pend) ? pend : [];
      const hydrated = await Promise.all(
        array.map(async (conn: any) => {
          try {
            const senderProfile = await apiFetch(`/profile/${conn.sender_id}`);
            return { ...conn, user: senderProfile };
          } catch {
            return { ...conn, user: null };
          }
        }),
      );
      setPending(hydrated);
    } catch {
      if (!getToken()) {
        clearAuth();
        router.replace("/auth/login");
      }
      setPending([]);
    }
  }

  async function loadFriends() {
    try {
      const list = await apiFetch("/connections/me");
      const array = Array.isArray(list) ? list : [];
      const myId = getMyId();
      const profiles = await Promise.all(
        array.map(async (conn: any) => {
          const other = conn.sender_id === myId ? conn.receiver_id : conn.sender_id;
          try {
            return await apiFetch(`/profile/${other}`);
          } catch {
            return { id: other, name: "Unknown", headline: "" };
          }
        }),
      );
      setFriends(profiles);
    } catch {
      if (!getToken()) {
        clearAuth();
        router.replace("/auth/login");
      }
      setFriends([]);
    }
  }

  async function acceptConnection(id: string) {
    setLoadingIds((s) => ({ ...s, [id]: true }));
    await apiFetch(`/connections/accept/${id}`, { method: "POST" });
    await loadData();
    setLoadingIds((s) => ({ ...s, [id]: false }));
  }

  async function rejectConnection(id: string) {
    setLoadingIds((s) => ({ ...s, [id]: true }));
    await apiFetch(`/connections/reject/${id}`, { method: "POST" });
    await loadData();
    setLoadingIds((s) => ({ ...s, [id]: false }));
  }

  function getMyId() {
    const token = getToken();
    if (!token) return "";
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.user_id || payload.id || payload.sub || "";
    } catch {
      return "";
    }
  }

  return (
    <div className="page-shell space-y-5">
      <section className="panel p-5">
        <h1 className="page-title flex items-center gap-2">
          <Users className="h-6 w-6 text-emerald-700" />
          Professional Network
        </h1>
        <p className="page-subtitle">Grow trusted relationships and keep your pipeline warm.</p>
      </section>

      <section className="panel p-5">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Pending Requests</h2>
        {pending.length === 0 ? <p className="text-slate-500">No pending requests.</p> : null}
        <div className="space-y-3">
          {pending.map((p) => {
            const user = p.user || {};
            return (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div>
                  <p className="font-semibold text-slate-900">{user.displayName || user.name || "Unknown User"}</p>
                  <p className="text-sm text-slate-600">{user.headline || user.email || ""}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptConnection(p.id)}
                    disabled={loadingIds[p.id]}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {loadingIds[p.id] ? "..." : "Accept"}
                  </button>
                  <button
                    onClick={() => rejectConnection(p.id)}
                    disabled={loadingIds[p.id]}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-50"
                  >
                    {loadingIds[p.id] ? "..." : "Decline"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Your Connections</h2>
        {friends.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            <UserRoundPlus className="mx-auto mb-2 h-6 w-6" />
            No connections yet.
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {friends.map((u, idx) => (
            <Link key={u.id ?? `friend-${idx}`} href={`/profile/${u.id}`} className="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:shadow-sm">
              <div className="flex items-center gap-3">
                <img src={u.imageUrl || u.image_url || u.avatar || "/default-avatar.svg"} className="h-11 w-11 rounded-full object-cover" alt="avatar" />
                <div>
                  <p className="font-semibold text-slate-900">{u.displayName || u.name}</p>
                  <p className="text-sm text-slate-600">{u.headline || u.email}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

