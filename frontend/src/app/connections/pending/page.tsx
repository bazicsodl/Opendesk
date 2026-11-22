"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

export default function Pending() {
  const [pending, setPending] = useState<any[]>([]);

  async function load() {
    try {
      const data = await apiFetch("/connections/pending");
      setPending(Array.isArray(data) ? data : []);
    } catch {
      setPending([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1>Pending Requests</h1>

      {pending.map((r) => (
        <div key={r.id} className="p-2 border rounded flex gap-2 items-center">
          <div>{r.sender_id}</div>

          <button
            onClick={async () => {
              await apiFetch(`/connections/accept/${r.id}`, { method: "POST" });
              await load();
            }}
          >
            Accept
          </button>

          <button
            onClick={async () => {
              await apiFetch(`/connections/reject/${r.id}`, { method: "POST" });
              await load();
            }}
          >
            Reject
          </button>
        </div>
      ))}
    </div>
  );
}
