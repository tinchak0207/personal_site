import { createHmac, randomUUID } from "node:crypto";

export interface GitHubProfile {
  id: number;
  login: string;
  name?: string | null;
  email?: string | null;
}

export function buildGitHubAuthorizeUrl(input: {
  clientId: string;
  state: string;
  redirectUri: string;
}) {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set("state", input.state);
  return url.toString();
}

export function createGitHubState() {
  return randomUUID();
}

export function buildGitHubUsername(profile: GitHubProfile) {
  return `gh_${profile.id}`;
}

export function buildGitHubPassword(profile: GitHubProfile, secret: string) {
  return createHmac("sha256", secret)
    .update(`github:${profile.id}:${profile.login}`)
    .digest("hex");
}

export function buildGitHubDisplayName(profile: GitHubProfile) {
  return profile.name?.trim() || profile.login;
}

export function buildGitHubEmail(profile: GitHubProfile) {
  return profile.email?.trim() || `${profile.id}+github@login.local`;
}
