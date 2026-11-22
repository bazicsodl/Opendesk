// /lib/auth.ts
const TOKEN_COOKIE = "token";
const DEFAULT_TOKEN_DAYS = 7;
const USER_KEY = "opendesk_user";
const TOKEN_KEY = "opendesk_token";
const LEGACY_USER_KEY = "user";
const LEGACY_TOKEN_KEY = "token";

function setCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function saveAuth(user: any, token: string) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
  // Keep legacy keys for older pages that still read them directly.
  localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(user));
  localStorage.setItem(LEGACY_TOKEN_KEY, token);
  setCookie(TOKEN_COOKIE, token, DEFAULT_TOKEN_DAYS);
}

export function clearAuth() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  clearCookie(TOKEN_COOKIE);
}

export function getToken() {
  if (typeof window === "undefined") return null;
  // Prefer cookie token to avoid stale localStorage from other localhost apps.
  const cookieToken = getCookie(TOKEN_COOKIE);
  if (cookieToken) return cookieToken;
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
}

export function getUser() {
  const u = localStorage.getItem(USER_KEY) || localStorage.getItem(LEGACY_USER_KEY);
  if (!u) return null;

  try {
    return JSON.parse(u);
  } catch (e) {
    console.warn("Invalid user JSON in storage. Clearing it.");
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
    return null;
  }
}
