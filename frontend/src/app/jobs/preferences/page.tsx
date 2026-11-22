"use client";

import React, { useEffect, useState, useRef } from "react";
import { apiFetch } from "@/lib/api"; // <-- make sure path is correct

type Preference = {
  job_titles: string[];
  preferred_types: string[];
  work_modes: string[];
  locations: { label: string; lat?: number; lng?: number }[];
  salary_min: number;
  radius_km: number;
  alert_enabled: boolean;

  remote_only: boolean;
  location_lat: number | null;
  location_lng: number | null;
};

const DEFAULT: Preference = {
  job_titles: [],
  preferred_types: [],
  work_modes: [],
  locations: [],
  salary_min: 0,
  radius_km: 25,
  alert_enabled: true,
  remote_only: false,
  location_lat: null,
  location_lng: null,
};

export default function JobPreferencesPage() {
  const [pref, setPref] = useState<Preference>(DEFAULT);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [titleInput, setTitleInput] = useState("");

  // location search
  const [locQuery, setLocQuery] = useState("");
  const [locResults, setLocResults] = useState<{ label: string; lat: number; lon: number }[]>([]);
  const locTimer = useRef<number | null>(null);

  // -------------------------
  // LOAD EXISTING PREFERENCES
  // -------------------------
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await apiFetch("/jobs/preferences", { method: "GET" });

        if (!mounted) return;
        if (!data?.data) return;

        const server = data.data;

        const mapped: Preference = {
          job_titles: server.job_titles || [],
          preferred_types: server.preferred_types || [],
          work_modes: server.work_modes || [],
          locations: (server.locations || []).map((l: any) =>
            typeof l === "string" ? { label: l } : l
          ),
          salary_min: server.salary_min || 0,
          radius_km: server.radius_km || 25,
          alert_enabled: server.alert_enabled ?? true,

          // optional fields
          remote_only: server.remote_only ?? false,
          location_lat: server.location_lat ?? null,
          location_lng: server.location_lng ?? null,
        };

        setPref(mapped);
      } catch {
        // ignore if unauthenticated or empty
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // -------------------------
  // Location autocomplete
  // -------------------------
  useEffect(() => {
    if (!locQuery || locQuery.length < 2) {
      setLocResults([]);
      return;
    }

    if (locTimer.current) window.clearTimeout(locTimer.current);

    locTimer.current = window.setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          locQuery
        )}&addressdetails=1&limit=6`;

        const r = await fetch(url, { headers: { "User-Agent": "opendesk-client/1.0" } });
        const json = await r.json();

        const mapped = (json || []).map((it: any) => ({
          label: it.display_name,
          lat: Number(it.lat),
          lon: Number(it.lon),
        }));

        setLocResults(mapped);
      } catch {
        setLocResults([]);
      }
    }, 400);
  }, [locQuery]);

  // -------------------------
  // Helpers
  // -------------------------
  function pushTitle() {
    const v = titleInput.trim();
    if (!v) return;
    if (pref.job_titles.includes(v)) {
      setTitleInput("");
      return;
    }
    setPref({ ...pref, job_titles: [...pref.job_titles, v] });
    setTitleInput("");
  }

  function removeTitle(t: string) {
    setPref({ ...pref, job_titles: pref.job_titles.filter((x) => x !== t) });
  }

  function toggleArray(key: "preferred_types" | "work_modes", value: string) {
    const arr = pref[key].includes(value)
      ? pref[key].filter((x) => x !== value)
      : [...pref[key], value];
    setPref({ ...pref, [key]: arr });
  }

  function addLocationFromSearch(it: { label: string; lat: number; lon: number }) {
    if (pref.locations.find((l) => l.label === it.label)) return;

    setPref({
      ...pref,
      locations: [...pref.locations, { label: it.label, lat: it.lat, lng: it.lon }],
    });

    setLocQuery("");
    setLocResults([]);
  }

  function removeLocation(label: string) {
    setPref({ ...pref, locations: pref.locations.filter((l) => l.label !== label) });
  }

  // -------------------------
  // SAVE
  // -------------------------
  async function save() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        job_titles: pref.job_titles,
        preferred_types: pref.preferred_types,
        work_modes: pref.work_modes,
        locations: pref.locations.map((l) => ({
          label: l.label,
          lat: l.lat,
          lng: l.lng,
        })),
        salary_min: pref.salary_min,
        radius_km: pref.radius_km,
        alert_enabled: pref.alert_enabled,
      };

      const data = await apiFetch("/jobs/preferences", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      setMessage(data.message || "Preferences saved.");
    } catch (e: any) {
      setError(e.message || "Failed to save.");
    }

    setLoading(false);
  }

  // -------------------------
  // UI
  // -------------------------

  const jobTypeOptions = ["full-time", "part-time", "contract", "internship"];
  const workModeOptions = ["remote", "hybrid", "onsite"];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Job Preferences</h1>

      <div className="bg-white shadow rounded p-6 space-y-5">
        {/* Job Title Input */}
        <div>
          <label className="block text-sm font-medium mb-2">Preferred job titles</label>
          <div className="flex gap-2 items-center">
            <input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), pushTitle())}
              placeholder="e.g. Frontend Engineer"
              className="flex-1 border rounded px-3 py-2"
            />
            <button
              type="button"
              onClick={pushTitle}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md"
            >
              Add
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {pref.job_titles.map((t) => (
              <div key={t} className="px-3 py-1 rounded bg-gray-100 flex items-center gap-2">
                <span className="text-sm">{t}</span>
                <button onClick={() => removeTitle(t)} className="text-red-500 text-sm">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Job Types */}
        <div>
          <label className="block text-sm font-medium mb-2">Job types</label>
          <div className="flex gap-3 flex-wrap">
            {jobTypeOptions.map((opt) => (
              <label
                key={opt}
                className={`px-3 py-1 rounded border ${
                  pref.preferred_types.includes(opt)
                    ? "bg-emerald-50 border-emerald-400"
                    : "bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={pref.preferred_types.includes(opt)}
                  onChange={() => toggleArray("preferred_types", opt)}
                  className="mr-2"
                />
                <span className="capitalize">{opt.replace("-", " ")}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Work modes */}
        <div>
          <label className="block text-sm font-medium mb-2">Work mode</label>
          <div className="flex gap-3">
            {workModeOptions.map((opt) => (
              <label
                key={opt}
                className={`px-3 py-1 rounded border ${
                  pref.work_modes.includes(opt) ? "bg-emerald-50 border-emerald-400" : "bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={pref.work_modes.includes(opt)}
                  onChange={() => toggleArray("work_modes", opt)}
                  className="mr-2"
                />
                <span className="capitalize">{opt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div>
          <label className="block text-sm font-medium mb-2">Locations</label>
          <div className="flex gap-2">
            <input
              value={locQuery}
              onChange={(e) => setLocQuery(e.target.value)}
              placeholder="Search city"
              className="flex-1 border rounded px-3 py-2"
            />

            <button
              type="button"
              onClick={() => {
                if (!navigator.geolocation) return alert("Geolocation not supported");

                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    const label = `Current location (${pos.coords.latitude.toFixed(
                      2
                    )}, ${pos.coords.longitude.toFixed(2)})`;

                    if (pref.locations.find((l) => l.label === label)) return;

                    setPref({
                      ...pref,
                      locations: [
                        ...pref.locations,
                        {
                          label,
                          lat: pos.coords.latitude,
                          lng: pos.coords.longitude,
                        },
                      ],
                    });
                  },
                  () => alert("Could not fetch your location")
                );
              }}
              className="px-3 py-2 bg-gray-100 rounded"
            >
              Use my location
            </button>
          </div>

          {locResults.length > 0 && (
            <div className="mt-2 border rounded bg-white shadow max-h-48 overflow-auto">
              {locResults.map((r) => (
                <div
                  key={r.label}
                  className="p-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => addLocationFromSearch(r)}
                >
                  <div className="text-sm">{r.label}</div>
                  <div className="text-xs text-gray-500">
                    {r.lat.toFixed(4)}, {r.lon.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {pref.locations.map((l) => (
              <div key={l.label} className="px-3 py-1 rounded bg-gray-100 flex items-center gap-2">
                <span className="text-sm">{l.label}</span>
                <button
                  onClick={() => removeLocation(l.label)}
                  className="text-red-500 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Salary + Radius */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Minimum salary</label>
            <input
              type="number"
              min={0}
              value={pref.salary_min}
              onChange={(e) => setPref({ ...pref, salary_min: Number(e.target.value) })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Search radius: {pref.radius_km} km
            </label>
            <input
              type="range"
              min={1}
              max={200}
              value={pref.radius_km}
              onChange={(e) =>
                setPref({ ...pref, radius_km: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>
        </div>

        {/* Alerts */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Job alerts</div>
            <div className="text-xs text-gray-500">
              Receive email/push notifications for matching jobs
            </div>
          </div>

          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={pref.alert_enabled}
              onChange={(e) =>
                setPref({ ...pref, alert_enabled: e.target.checked })
              }
            />
            <span className="text-sm">Enabled</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md"
          >
            {loading ? "Saving..." : "Save preferences"}
          </button>

          <button
            onClick={() => {
              setPref(DEFAULT);
              setMessage(null);
              setError(null);
            }}
            className="px-4 py-2 border rounded-md"
          >
            Reset
          </button>

          {(message || error) && (
            <div className="ml-auto text-sm">
              {message && <div className="text-green-600">{message}</div>}
              {error && <div className="text-red-600">{error}</div>}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-xs text-gray-500">
        Tip: Add multiple job titles (e.g. "Frontend Engineer" and "React Developer").
      </div>
    </div>
  );
}
