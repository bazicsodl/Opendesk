import { API_BASE } from "./api";

export function resolveMediaUrl(input?: string | null): string {
  const raw = (input || "").trim();
  if (!raw || raw.toLowerCase() === "null" || raw.toLowerCase() === "undefined") {
    return "";
  }

  const cleaned =
    raw.startsWith('"') && raw.endsWith('"')
      ? raw.slice(1, -1).trim()
      : raw;
  const normalized = cleaned
    .replace(/\\"/g, '"')
    .replace(/\\\//g, "/")
    .replace(/^"+|"+$/g, "")
    .trim();

  if (!normalized) return "";
  if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith("data:") || normalized.startsWith("blob:")) {
    return normalized;
  }

  if (normalized.startsWith("/")) return `${API_BASE}${normalized}`;
  return `${API_BASE}/${normalized}`;
}
