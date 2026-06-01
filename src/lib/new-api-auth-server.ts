type NewApiUserData = {
  id: number;
  username: string;
  display_name?: string;
  role?: number;
  status?: number;
  group?: string;
  email?: string;
  quota?: number;
  used_quota?: number;
};

type LoginResult = {
  success: boolean;
  message?: string;
  data?: NewApiUserData;
};

type SelfResult = {
  success: boolean;
  message?: string;
  data?: NewApiUserData;
};

type TokenResult = {
  success: boolean;
  message?: string;
  data?: string;
};

const PROD_GATEWAY_BASE = "http://186.241.75.127";

export function getGatewayBaseUrl() {
  return process.env.GATEWAY_BASE_URL
    ?? (process.env.NODE_ENV === "production" ? PROD_GATEWAY_BASE : "http://localhost:3001");
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return JSON.parse(text) as T;
}

function getCookieHeader(response: Response): string {
  const cookies = response.headers.getSetCookie?.() ?? [];
  return cookies.map((cookie) => cookie.split(";", 1)[0]).join("; ");
}

async function fetchSelf(baseUrl: string, cookieHeader: string, userId: number) {
  const response = await fetch(`${baseUrl}/api/user/self`, {
    headers: {
      Cookie: cookieHeader,
      "New-Api-User": String(userId),
    },
    cache: "no-store",
  });

  const data = await parseJson<SelfResult>(response);
  return { response, data };
}

async function fetchAccessToken(baseUrl: string, cookieHeader: string, userId: number) {
  const response = await fetch(`${baseUrl}/api/user/token`, {
    headers: {
      Cookie: cookieHeader,
      "New-Api-User": String(userId),
    },
    cache: "no-store",
  });

  const data = await parseJson<TokenResult>(response);
  return { response, data };
}

export async function loginViaNewApi(baseUrl: string, username: string, password: string) {
  const loginResponse = await fetch(`${baseUrl}/api/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    cache: "no-store",
  });

  const loginData = await parseJson<LoginResult>(loginResponse);
  if (!loginResponse.ok || !loginData.success || !loginData.data?.id) {
    return {
      ok: false,
      status: 401,
      message: loginData.message ?? "登錄失敗，請重試",
    } as const;
  }

  const cookieHeader = getCookieHeader(loginResponse);
  if (!cookieHeader) {
    return {
      ok: false,
      status: 503,
      message: "後端沒有返回 session cookie。",
    } as const;
  }

  const userId = loginData.data.id;

  const [{ response: selfResponse, data: selfData }, { response: tokenResponse, data: tokenData }] =
    await Promise.all([
      fetchSelf(baseUrl, cookieHeader, userId),
      fetchAccessToken(baseUrl, cookieHeader, userId),
    ]);

  if (!selfResponse.ok || !selfData.success || !selfData.data) {
    return {
      ok: false,
      status: 503,
      message: selfData.message ?? "獲取用戶信息失敗。",
    } as const;
  }

  if (!tokenResponse.ok || !tokenData.success || !tokenData.data) {
    return {
      ok: false,
      status: 503,
      message: tokenData.message ?? "生成 access token 失敗。",
    } as const;
  }

  return {
    ok: true,
    token: tokenData.data,
    user: selfData.data,
  } as const;
}
