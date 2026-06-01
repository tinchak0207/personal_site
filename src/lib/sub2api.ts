export interface GatewayEndpoint {
  apiKey: string;
  baseURL: string;
  label: string;
}

export type EnvLike = Record<string, string | undefined>;
export const LOCAL_TEST_MODE = process.env.NEXT_PUBLIC_LOCAL_TEST_MODE === "true";

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

  if (env.SUB2API_ENABLED === "true") {
    const baseURL = normalizeBaseURL(env.SUB2API_BASE_URL ?? "");
    const apiKey = env.SUB2API_API_KEY ?? "";

    return baseURL && apiKey
      ? [{ baseURL, apiKey, label: "sub2api" }, ...fallbackEndpoint]
      : fallbackEndpoint;
  }

  return [
    {
      baseURL: normalizeBaseURL(env.IMAGE_API_BASE_URL ?? env.IMAGE_API_BASE_URL_PRIMARY ?? ""),
      apiKey: env.IMAGE_API_KEY ?? env.IMAGE_API_KEY_PRIMARY ?? "",
      label: "primary",
    },
    ...fallbackEndpoint,
  ].filter((endpoint) => Boolean(endpoint.baseURL && endpoint.apiKey));
}

export function shouldBypassAuthForLocalTest(env: EnvLike): boolean {
  return env.NEXT_PUBLIC_LOCAL_TEST_MODE === "true";
}
