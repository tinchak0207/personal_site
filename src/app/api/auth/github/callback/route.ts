import { NextRequest, NextResponse } from "next/server";
import { loginViaNewApi, getGatewayBaseUrl } from "@/lib/new-api-auth-server";
import {
  buildGitHubDisplayName,
  buildGitHubEmail,
  buildGitHubPassword,
  buildGitHubUsername,
  type GitHubProfile,
} from "@/lib/github-auth";

function getBaseUrl(req: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL
    ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`;
}

async function exchangeGithubCode(input: { code: string; redirectUri: string }) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: input.code,
      redirect_uri: input.redirectUri,
    }),
    cache: "no-store",
  });
  return response.json() as Promise<{ access_token?: string; error?: string; error_description?: string }>;
}

async function fetchGithubProfile(accessToken: string) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "image.tinchak0207.xyz",
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("获取 GitHub 用户信息失败");
  return response.json() as Promise<GitHubProfile>;
}

async function registerGithubUser(profile: GitHubProfile, password: string) {
  const gatewayBase = getGatewayBaseUrl();
  const username = buildGitHubUsername(profile);
  const response = await fetch(`${gatewayBase}/api/user/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
      email: buildGitHubEmail(profile),
      display_name: buildGitHubDisplayName(profile),
    }),
    cache: "no-store",
  });

  if (response.ok) return;

  const data = await response.json().catch(() => null) as { message?: string } | null;
  if (data?.message?.includes("已存在") || data?.message?.includes("exists")) return;
  throw new Error(data?.message || "GitHub 用户自动注册失败");
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const stateCookie = req.cookies.get("github_oauth_state")?.value;

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return NextResponse.redirect(`${getBaseUrl(req)}/?auth_error=github_state`);
  }

  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return NextResponse.redirect(`${getBaseUrl(req)}/?auth_error=github_config`);
  }

  try {
    const redirectUri = `${getBaseUrl(req)}/api/auth/github/callback`;
    const tokenResult = await exchangeGithubCode({ code, redirectUri });
    if (!tokenResult.access_token) {
      throw new Error(tokenResult.error_description || tokenResult.error || "GitHub 登录失败");
    }

    const profile = await fetchGithubProfile(tokenResult.access_token);
    const passwordSeed = process.env.GITHUB_LOGIN_SECRET || process.env.GITHUB_CLIENT_SECRET;
    const password = buildGitHubPassword(profile, passwordSeed);
    const username = buildGitHubUsername(profile);

    await registerGithubUser(profile, password);
    const loginResult = await loginViaNewApi(getGatewayBaseUrl(), username, password);
    if (!loginResult.ok) {
      throw new Error(loginResult.message || "GitHub 登录失败");
    }

    const redirect = NextResponse.redirect(`${getBaseUrl(req)}/?auth=github`);
    redirect.cookies.set("github_oauth_state", "", { path: "/", maxAge: 0 });
    redirect.cookies.set("napi_token", loginResult.token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      secure: true,
    });
    redirect.cookies.set("napi_user", JSON.stringify(loginResult.user), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      secure: true,
    });
    return redirect;
  } catch (error) {
    console.error("[auth/github/callback]", error);
    return NextResponse.redirect(`${getBaseUrl(req)}/?auth_error=github_login`);
  }
}
