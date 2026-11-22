import { getToken } from "./auth";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:8000";


export async function apiFetch(path: string, opts?: RequestInit): Promise<any>;
export async function apiFetch(path: string, body: unknown): Promise<any>;
export async function apiFetch(path: string, body: unknown, method: string): Promise<any>;
export async function apiFetch(path: string, optsOrBody?: RequestInit | unknown, legacyMethod?: string) {
  const isRequestInitObject =
    typeof optsOrBody === "object" &&
    optsOrBody !== null &&
    ("method" in (optsOrBody as Record<string, unknown>) ||
      "headers" in (optsOrBody as Record<string, unknown>) ||
      "body" in (optsOrBody as Record<string, unknown>) ||
      "cache" in (optsOrBody as Record<string, unknown>) ||
      "credentials" in (optsOrBody as Record<string, unknown>));

  const opts: RequestInit =
    legacyMethod !== undefined
      ? {
          method: legacyMethod,
          body:
            optsOrBody instanceof FormData || typeof optsOrBody === "string"
              ? (optsOrBody as BodyInit)
              : JSON.stringify(optsOrBody ?? {}),
        }
      : arguments.length === 1
        ? {}
        : isRequestInitObject
          ? ((optsOrBody as RequestInit) ?? {})
          : {
              method: "POST",
              body:
                optsOrBody instanceof FormData || typeof optsOrBody === "string"
                  ? (optsOrBody as BodyInit)
                  : JSON.stringify(optsOrBody ?? {}),
            };

  const token = typeof window !== "undefined" ? getToken() : null;
  const headers: Record<string, string> = { ...(opts.headers as any) };
  if (!headers["Content-Type"] && !(opts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token && !headers["Authorization"]) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${txt}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

type ApiConfig = {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | null | undefined>;
};

type ApiResponse<T = any> = {
  data: T;
};

function withParams(path: string, params?: ApiConfig["params"]) {
  if (!params) return path;
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    query.set(key, String(value));
  });
  const qs = query.toString();
  return qs ? `${path}${path.includes("?") ? "&" : "?"}${qs}` : path;
}

async function request<T = any>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  config: ApiConfig = {},
): Promise<ApiResponse<T>> {
  const payload =
    body instanceof FormData || typeof body === "string" || body === undefined
      ? body
      : JSON.stringify(body);

  const data = await apiFetch(withParams(path, config.params), {
    method,
    body: payload as BodyInit | undefined,
    headers: config.headers,
  });

  return { data: data as T };
}

export const api = {
  get: <T = any>(path: string, config?: ApiConfig) => request<T>("GET", path, undefined, config),
  post: <T = any>(path: string, body?: unknown, config?: ApiConfig) => request<T>("POST", path, body, config),
  put: <T = any>(path: string, body?: unknown, config?: ApiConfig) => request<T>("PUT", path, body, config),
  patch: <T = any>(path: string, body?: unknown, config?: ApiConfig) => request<T>("PATCH", path, body, config),
  delete: <T = any>(path: string, config?: ApiConfig) => request<T>("DELETE", path, undefined, config),
};
