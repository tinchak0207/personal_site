/**
 * new-api gateway client
 * All calls go through Next.js server-side proxy — never expose GATEWAY_KEY to browser.
 */

export interface NewApiUser {
  id: number;
  username: string;
  display_name: string;
  email: string;
  quota: number;       // remaining quota in new-api units
  used_quota: number;
}

export interface NewApiLoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: NewApiUser;
  };
}

export interface NewApiImageRequest {
  prompt: string;
  model: string;
  n?: number;
  size?: string;
}

export interface NewApiImageResponse {
  created?: number;
  data?: Array<{ b64_json?: string; url?: string }>;
  error?: { message?: string; code?: string };
}

// ─── Token storage (client-side only) ───────────────────────────────────────

const TOKEN_KEY = "napi_token";
const USER_KEY  = "napi_user";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string, user: NewApiUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const pair = document.cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(prefix));
  return pair ? decodeURIComponent(pair.slice(prefix.length)) : null;
}

export function syncStoredAuthFromCookie(): boolean {
  if (typeof window === "undefined") return false;
  const token = getCookieValue(TOKEN_KEY);
  const rawUser = getCookieValue(USER_KEY);
  if (!token || !rawUser) return false;
  try {
    const user = JSON.parse(rawUser) as NewApiUser;
    setStoredToken(token, user);
    const url = new URL(window.location.href);
    if (url.searchParams.get("auth") === "github") {
      url.searchParams.delete("auth");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
    return true;
  } catch {
    return false;
  }
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  if (typeof document !== "undefined") {
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
    document.cookie = `${USER_KEY}=; path=/; max-age=0`;
  }
}

export function getStoredUser(): NewApiUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as NewApiUser; } catch { return null; }
}

// ─── Quota helpers ───────────────────────────────────────────────────────────

/** new-api quota unit → approximate coins (1 coin ≈ 500,000 quota units) */
export const QUOTA_PER_COIN = 500_000;

export function quotaToCoins(quota: number): number {
  return Math.floor(quota / QUOTA_PER_COIN);
}

export function hasEnoughQuota(user: NewApiUser): boolean {
  return user.quota >= QUOTA_PER_COIN;
}

// ─── Types for new-api responses ─────────────────────────────────────────────

export interface LogItem {
  id: number;
  created_at: number;       // unix timestamp (seconds)
  type: number;             // 2 = image generation
  model_name: string;
  quota: number;            // consumed quota units
  prompt_tokens?: number;
  completion_tokens?: number;
  channel_id?: number;
  token_name?: string;
  username?: string;
  content?: string;
}

export interface LogStat {
  quota: number;            // total consumed quota
  rpm: number;              // requests per minute
  tpm: number;              // tokens per minute
}

export interface QuotaDate {
  date: string;             // YYYY-MM-DD
  quota: number;
}

export interface CheckinStatus {
  can_checkin: boolean;
  quota?: number;           // quota awarded on last checkin
  last_checkin_time?: number;
}

export interface NewApiModel {
  id: string;
  object: string;
  owned_by?: string;
}

export interface StoredHistoryEntry {
  id: string;
  userId: number;
  prompt: string;
  generatedAt: number;
  results: Array<{
    provider: string;
    modelId: string;
    image?: string | null;
    imageUrl?: string | null;
  }>;
}

// ─── Client-side API helpers (all go through /api/* proxy) ───────────────────

function bearerHeader(token: string) {
  const user = getStoredUser();
  return {
    Authorization: `Bearer ${token}`,
    ...(user?.id ? { "x-user-id": String(user.id) } : {}),
  };
}

/** Fetch paginated usage logs */
export async function fetchUsageLogs(
  token: string,
  page = 1,
  pageSize = 20,
  modelName?: string,
): Promise<{ success: boolean; data?: LogItem[]; message?: string }> {
  const qs = new URLSearchParams({ p: String(page), page_size: String(pageSize) });
  if (modelName) qs.set("model_name", modelName);
  const res = await fetch(`/api/log/self?${qs}`, { headers: bearerHeader(token) });
  return res.json() as Promise<{ success: boolean; data?: LogItem[]; message?: string }>;
}

/** Fetch usage stats (total quota consumed) */
export async function fetchUsageStat(
  token: string,
): Promise<{ success: boolean; data?: LogStat; message?: string }> {
  const res = await fetch(`/api/log/self/stat`, { headers: bearerHeader(token) });
  return res.json() as Promise<{ success: boolean; data?: LogStat; message?: string }>;
}

/** Fetch daily quota trend */
export async function fetchQuotaDates(
  token: string,
): Promise<{ success: boolean; data?: QuotaDate[]; message?: string }> {
  const res = await fetch(`/api/data/self`, { headers: bearerHeader(token) });
  return res.json() as Promise<{ success: boolean; data?: QuotaDate[]; message?: string }>;
}

/** Get checkin status */
export async function fetchCheckinStatus(
  token: string,
): Promise<{ success: boolean; data?: CheckinStatus; message?: string }> {
  const res = await fetch(`/api/checkin`, { headers: bearerHeader(token), cache: "no-store" });
  return res.json() as Promise<{ success: boolean; data?: CheckinStatus; message?: string }>;
}

/** Do daily checkin */
export async function doCheckin(
  token: string,
): Promise<{ success: boolean; data?: { quota: number }; message?: string }> {
  const res = await fetch(`/api/checkin`, {
    method: "POST",
    headers: { ...bearerHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  return res.json() as Promise<{ success: boolean; data?: { quota: number }; message?: string }>;
}

/** Redeem a top-up code */
export async function redeemTopupCode(
  token: string,
  key: string,
): Promise<{ success: boolean; data?: { quota: number }; message?: string }> {
  const res = await fetch(`/api/topup`, {
    method: "POST",
    headers: { ...bearerHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
  return res.json() as Promise<{ success: boolean; data?: { quota: number }; message?: string }>;
}

/** Fetch models available to this user */
export async function fetchUserModels(
  token: string,
): Promise<{ success: boolean; data?: NewApiModel[]; message?: string }> {
  const res = await fetch(`/api/user/models`, { headers: bearerHeader(token) });
  return res.json() as Promise<{ success: boolean; data?: NewApiModel[]; message?: string }>;
}

/** Fetch user's referral code */
export async function fetchAffCode(
  token: string,
): Promise<{ success: boolean; data?: string; message?: string }> {
  const res = await fetch(`/api/user/aff`, { headers: bearerHeader(token) });
  return res.json() as Promise<{ success: boolean; data?: string; message?: string }>;
}

export async function fetchStoredHistory(
  token: string,
): Promise<{ success: boolean; data?: StoredHistoryEntry[]; message?: string }> {
  const res = await fetch(`/api/history`, { headers: bearerHeader(token), cache: "no-store" });
  return res.json() as Promise<{ success: boolean; data?: StoredHistoryEntry[]; message?: string }>;
}

/** Fetch user's API token list */
export async function fetchTokens(
  token: string,
): Promise<{ success: boolean; data?: unknown[]; message?: string }> {
  const res = await fetch(`/api/token`, { headers: bearerHeader(token) });
  return res.json() as Promise<{ success: boolean; data?: unknown[]; message?: string }>;
}

/** Delete a user API token */
export async function deleteToken(
  token: string,
  tokenId: number,
): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`/api/token/${tokenId}`, {
    method: "DELETE",
    headers: bearerHeader(token),
  });
  return res.json() as Promise<{ success: boolean; message?: string }>;
}

/** Update user profile */
export async function updateSelf(
  token: string,
  patch: Partial<Pick<NewApiUser, "display_name" | "email">>,
): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`/api/user/self`, {
    method: "PUT",
    headers: { ...bearerHeader(token), "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return res.json() as Promise<{ success: boolean; message?: string }>;
}
