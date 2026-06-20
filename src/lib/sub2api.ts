export interface GatewayEndpoint {
  apiKey: string;
  baseURL: string;
  label: string;
  modelId?: string;
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
          ...(env.IMAGE_API_MODEL_FALLBACK ? { modelId: env.IMAGE_API_MODEL_FALLBACK } : {}),
        }]
      : [];

  const primaryBaseURL = normalizeBaseURL(
    env.IMAGE_API_BASE_URL ?? env.IMAGE_API_BASE_URL_PRIMARY ?? env.GATEWAY_BASE_URL ?? "",
  );
  const primaryApiKey = env.IMAGE_API_KEY ?? env.IMAGE_API_KEY_PRIMARY ?? env.GATEWAY_API_KEY ?? "";

  if (env.SUB2API_ENABLED === "true") {
    const baseURL = normalizeBaseURL(env.SUB2API_BASE_URL ?? "");
    const apiKey = env.SUB2API_API_KEY ?? "";

    return baseURL && apiKey
      ? [{ baseURL, apiKey, label: "sub2api" }, ...fallbackEndpoint]
      : fallbackEndpoint;
  }

  const primaryModelId = env.IMAGE_API_MODEL ?? env.IMAGE_API_MODEL_PRIMARY;
  return [
    {
      baseURL: primaryBaseURL,
      apiKey: primaryApiKey,
      label: "primary",
      ...(primaryModelId ? { modelId: primaryModelId } : {}),
    },
    ...fallbackEndpoint,
  ].filter((endpoint) => Boolean(endpoint.baseURL && endpoint.apiKey));
}

export function shouldBypassAuthForLocalTest(env: EnvLike): boolean {
  return env.NEXT_PUBLIC_LOCAL_TEST_MODE === "true";
}
