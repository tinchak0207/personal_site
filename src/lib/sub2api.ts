export interface GatewayEndpoint {
  apiKey: string;
  baseURL: string;
  label: string;
}

export type EnvLike = Record<string, string | undefined>;
export const LOCAL_TEST_MODE = process.env.NEXT_PUBLIC_LOCAL_TEST_MODE === "true";
const PROD_IMAGE_GATEWAY_BASE = "http://186.241.75.127/v1";
const PROD_IMAGE_GATEWAY_TOKEN = "1i3vncVKNsJdicJdueR2a8IOHHQAWYswjpZPfdgusBXz8QW5";

function normalizeBaseURL(baseURL: string): string {
  return baseURL.replace(/\/+$/, "");
}

export function buildGatewayEndpoints(env: EnvLike): GatewayEndpoint[] {
  const fallbackEndpoint =
    normalizeBaseURL(env.IMAGE_API_BASE_URL_FALLBACK ?? "") && (env.IMAGE_API_KEY_FALLBACK ?? "")
      ? [{
          baseURL: normalizeBaseURL(env.IMAGE_API_BASE_URL_FALLBACK ?? ""),
          apiKey: env.IMAGE_API_KEY_FALLBACK ?? "",
          label: "fallback",
        }]
      : [];

  const primaryBaseURL = normalizeBaseURL(
    env.IMAGE_API_BASE_URL
      ?? env.IMAGE_API_BASE_URL_PRIMARY
      ?? (env.NODE_ENV === "production" ? PROD_IMAGE_GATEWAY_BASE : ""),
  );
  const primaryApiKey = env.IMAGE_API_KEY
    ?? env.IMAGE_API_KEY_PRIMARY
    ?? (env.NODE_ENV === "production" ? PROD_IMAGE_GATEWAY_TOKEN : "");

  if (env.SUB2API_ENABLED === "true") {
    const baseURL = normalizeBaseURL(env.SUB2API_BASE_URL ?? "");
    const apiKey = env.SUB2API_API_KEY ?? "";

    return baseURL && apiKey
      ? [{ baseURL, apiKey, label: "sub2api" }, ...fallbackEndpoint]
      : fallbackEndpoint;
  }

  return [
    {
      baseURL: primaryBaseURL,
      apiKey: primaryApiKey,
      label: "primary",
    },
    ...fallbackEndpoint,
  ].filter((endpoint) => Boolean(endpoint.baseURL && endpoint.apiKey));
}

export function shouldBypassAuthForLocalTest(env: EnvLike): boolean {
  return env.NEXT_PUBLIC_LOCAL_TEST_MODE === "true";
}
