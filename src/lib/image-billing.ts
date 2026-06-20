import { getGatewayBaseUrl } from "@/lib/new-api-auth-server";
import { QUOTA_PER_COIN } from "@/lib/new-api-client";
import { EnvLike, shouldBypassAuthForLocalTest } from "@/lib/sub2api";

export const IMAGE_GENERATION_QUOTA = QUOTA_PER_COIN;

type FetchLike = typeof fetch;

type GatewayResult<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type ImageBillingUser = {
  id: number;
  username: string;
  quota: number;
  used_quota: number;
};

export type ImageAuthResult =
  | { ok: true; user: ImageBillingUser; bypassBilling: boolean }
  | { ok: false; status: number; message: string };

// token → 认证结果的模块级微缓存：30 秒 TTL、上限 500 条，命中则免去对网关的 GET /api/user/self。
// 只缓存成功结果；存取均做浅拷贝，避免调用方修改 quota 污染缓存。
const AUTH_CACHE_TTL_MS = 30_000;
const AUTH_CACHE_MAX_ENTRIES = 500;
const authMicroCache = new Map<string, { expiresAt: number; user: ImageBillingUser }>();

async function readGatewayResult<T>(response: Response): Promise<GatewayResult<T>> {
  const text = await response.text();
  if (!text) return { success: false, message: `Gateway returned ${response.status}` };

  try {
    return JSON.parse(text) as GatewayResult<T>;
  } catch {
    return { success: false, message: text.slice(0, 300) };
  }
}

function bearer(value: string): string {
  const token = value.replace(/^Bearer\s+/i, "").trim();
  return `Bearer ${token}`;
}

function adminBillingConfig(env: EnvLike) {
  const token =
    env.GATEWAY_ADMIN_ACCESS_TOKEN ??
    env.GATEWAY_ADMIN_TOKEN ??
    env.NEW_API_ADMIN_ACCESS_TOKEN ??
    "";
  const userId = env.GATEWAY_ADMIN_USER_ID ?? env.NEW_API_ADMIN_USER_ID ?? "";

  if (!token.trim() || !userId.trim()) {
    throw new Error("Missing New API admin billing credentials.");
  }

  return { token: bearer(token), userId: userId.trim() };
}

export async function authenticateImageUser(
  headers: Headers,
  env: EnvLike = process.env,
  fetcher: FetchLike = fetch,
): Promise<ImageAuthResult> {
  if (shouldBypassAuthForLocalTest(env)) {
    return {
      ok: true,
      bypassBilling: true,
      user: { id: 0, username: "local-test", quota: Number.MAX_SAFE_INTEGER, used_quota: 0 },
    };
  }

  const auth = headers.get("authorization") ?? "";
  const userId = headers.get("x-user-id") ?? headers.get("New-Api-User") ?? "";

  if (!auth || !userId) {
    return { ok: false, status: 401, message: "请先登录再生成图片。" };
  }

  const cacheKey = `${auth}|${userId}`;
  const cached = authMicroCache.get(cacheKey);
  if (cached) {
    if (cached.expiresAt > Date.now() && cached.user.quota >= IMAGE_GENERATION_QUOTA) {
      return { ok: true, user: { ...cached.user }, bypassBilling: false };
    }
    authMicroCache.delete(cacheKey);
  }

  const response = await fetcher(`${getGatewayBaseUrl()}/api/user/self`, {
    headers: {
      Authorization: auth,
      "New-Api-User": userId,
    },
    cache: "no-store",
  });
  const result = await readGatewayResult<ImageBillingUser>(response);

  if (!response.ok || !result.success || !result.data?.id) {
    return { ok: false, status: 401, message: result.message ?? "登录已过期，请重新登录。" };
  }

  if (result.data.quota < IMAGE_GENERATION_QUOTA) {
    return { ok: false, status: 402, message: "余额不足，请先充值。" };
  }

  if (authMicroCache.size >= AUTH_CACHE_MAX_ENTRIES) {
    const oldestKey = authMicroCache.keys().next().value;
    if (oldestKey !== undefined) authMicroCache.delete(oldestKey);
  }
  authMicroCache.set(cacheKey, {
    expiresAt: Date.now() + AUTH_CACHE_TTL_MS,
    user: { ...result.data },
  });

  return { ok: true, user: result.data, bypassBilling: false };
}

async function adjustImageQuota(
  userId: number,
  mode: "add" | "subtract",
  env: EnvLike = process.env,
  fetcher: FetchLike = fetch,
) {
  const admin = adminBillingConfig(env);
  const response = await fetcher(`${getGatewayBaseUrl()}/api/user/manage`, {
    method: "POST",
    headers: {
      Authorization: admin.token,
      "Content-Type": "application/json",
      "New-Api-User": admin.userId,
    },
    body: JSON.stringify({
      id: userId,
      action: "add_quota",
      mode,
      value: IMAGE_GENERATION_QUOTA,
    }),
    cache: "no-store",
  });
  const result = await readGatewayResult<unknown>(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message ?? `New API quota ${mode} failed.`);
  }
}

async function fetchManagedImageUser(
  userId: number,
  env: EnvLike = process.env,
  fetcher: FetchLike = fetch,
): Promise<ImageBillingUser> {
  const admin = adminBillingConfig(env);
  const response = await fetcher(`${getGatewayBaseUrl()}/api/user/${userId}`, {
    headers: {
      Authorization: admin.token,
      "New-Api-User": admin.userId,
    },
    cache: "no-store",
  });
  const result = await readGatewayResult<ImageBillingUser>(response);

  if (!response.ok || !result.success || !result.data?.id) {
    throw new Error(result.message ?? "Failed to verify reserved image quota.");
  }

  return result.data;
}

export async function reserveImageQuota(
  userId: number,
  knownQuota?: number,
  env?: EnvLike,
  fetcher?: FetchLike,
) {
  await adjustImageQuota(userId, "subtract", env, fetcher);

  // 已知余额充足（≥ 2 次生成额度）时跳过复核，省一次网关请求；低余额才复核，防止扣穿。
  if (knownQuota !== undefined && knownQuota >= 2 * IMAGE_GENERATION_QUOTA) {
    return;
  }

  try {
    const user = await fetchManagedImageUser(userId, env, fetcher);
    if (user.quota < 0) {
      throw new Error("余额不足，请先充值。");
    }
  } catch (error) {
    await adjustImageQuota(userId, "add", env, fetcher);
    throw error;
  }
}

export function refundImageQuota(userId: number, env?: EnvLike, fetcher?: FetchLike) {
  return adjustImageQuota(userId, "add", env, fetcher);
}
