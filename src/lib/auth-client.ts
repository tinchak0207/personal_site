/**
 * Auth client — talks to our Next.js API proxy, which forwards to new-api.
 * Never calls new-api directly from the browser.
 */

import {
  type NewApiLoginResponse,
  type NewApiUser,
  setStoredToken,
  clearStoredToken,
  getStoredUser,
} from "./new-api-client";

export interface AuthResult {
  ok: boolean;
  error?: string;
  user?: NewApiUser;
  token?: string;
}

// ─── Login ───────────────────────────────────────────────────────────────────

export async function login(username: string, password: string): Promise<AuthResult> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = (await res.json()) as NewApiLoginResponse;

    if (!res.ok || !data.success || !data.data) {
      return { ok: false, error: data.message || "登錄失敗，請重試" };
    }

    setStoredToken(data.data.token, data.data.user);
    return { ok: true, user: data.data.user, token: data.data.token };
  } catch {
    return { ok: false, error: "網絡錯誤，請檢查連接" };
  }
}

// ─── Register ────────────────────────────────────────────────────────────────

export async function register(
  username: string,
  password: string,
  email?: string,
  turnstileToken?: string,
): Promise<AuthResult> {
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, email, turnstileToken }),
    });

    const data = (await res.json()) as NewApiLoginResponse;

    if (!res.ok || !data.success || !data.data) {
      return { ok: false, error: data.message || "注冊失敗，請重試" };
    }

    setStoredToken(data.data.token, data.data.user);
    return { ok: true, user: data.data.user, token: data.data.token };
  } catch {
    return { ok: false, error: "網絡錯誤，請檢查連接" };
  }
}

// ─── Fetch current user (refresh quota) ─────────────────────────────────────

export async function fetchMe(token: string): Promise<AuthResult> {
  try {
    const storedUser = getStoredUser();
    const res = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(storedUser?.id ? { "x-user-id": String(storedUser.id) } : {}),
      },
    });

    if (res.status === 401) {
      clearStoredToken();
      return { ok: false, error: "session_expired" };
    }

    const data = await res.json() as { success: boolean; data?: NewApiUser; message?: string };
    if (!data.success || !data.data) {
      return { ok: false, error: data.message || "無法獲取用戶信息" };
    }

    return { ok: true, user: data.data };
  } catch {
    return { ok: false, error: "網絡錯誤" };
  }
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export function logout(): void {
  clearStoredToken();
}
