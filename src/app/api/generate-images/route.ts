import { NextRequest, NextResponse } from "next/server";
import type { GenerateImageRequest } from "@/lib/api-types";
import { MOCK_MODE, mockGenerateImage } from "@/lib/mock";
import { buildGatewayEndpoints } from "@/lib/sub2api";
import { publicImageUrl } from "@/lib/image-url";
import { saveGeneratedHistoryEntry } from "@/lib/server-history-store";
import { authenticateImageUser, refundImageQuota, reserveImageQuota } from "@/lib/image-billing";

export const maxDuration = 120;
export const preferredRegion = "hkg1";

const DEFAULT_IMAGE_SIZE = "1024x1024";
const PRIMARY_UPSTREAM_TIMEOUT_MS = 20_000;
const FALLBACK_UPSTREAM_TIMEOUT_MS = 100_000;

type UpstreamSuccess = {
  created?: number;
  data?: Array<{ b64_json?: string; url?: string }>;
  error?: { message?: string };
};

async function readUpstreamPayload(response: Response): Promise<UpstreamSuccess | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as UpstreamSuccess;
  } catch {
    if (!response.ok) {
      throw new Error(text.slice(0, 300));
    }
    throw new Error("Upstream returned a non-JSON success payload.");
  }
}

function upstreamTimeoutForEndpoint(label: string): number {
  return label === "fallback" ? FALLBACK_UPSTREAM_TIMEOUT_MS : PRIMARY_UPSTREAM_TIMEOUT_MS;
}

async function requestImageGeneration(
  endpoint: { apiKey: string; baseURL: string; label: string },
  prompt: string,
  modelId: string,
) {
  const startedAt = Date.now();
  const timeoutMs = upstreamTimeoutForEndpoint(endpoint.label);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${endpoint.baseURL}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${endpoint.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: modelId, prompt, size: DEFAULT_IMAGE_SIZE }),
      signal: controller.signal,
    });
    const payload = await readUpstreamPayload(response);

    if (!response.ok) {
      throw new Error(
        payload?.error?.message ?? `Image generation failed on ${endpoint.label} endpoint.`,
      );
    }

    const firstItem = payload?.data?.[0];
    if (!firstItem?.b64_json && !firstItem?.url) {
      throw new Error(`No image payload returned from ${endpoint.label} endpoint.`);
    }

    return {
      image: firstItem.b64_json ?? null,
      imageUrl: publicImageUrl(firstItem.url),
      upstreamElapsedMs: Date.now() - startedAt,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Image generation timed out on ${endpoint.label} endpoint after ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).slice(2);
  const { prompt, modelId } = (await req.json()) as GenerateImageRequest;

  if (!prompt || !modelId) {
    return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
  }

  const authResult = await authenticateImageUser(req.headers);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.message }, { status: authResult.status });
  }
  const authenticatedUser = authResult.user;

  // ── Mock mode ──────────────────────────────────────────────────────────────
  if (MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 1200));
    return NextResponse.json(mockGenerateImage());
  }

  // ── Real mode ──────────────────────────────────────────────────────────────
  const endpoints = buildGatewayEndpoints(process.env);

  if (endpoints.length === 0) {
    return NextResponse.json(
      {
        error:
          process.env.SUB2API_ENABLED === "true"
            ? "Missing SUB2API_API_KEY or SUB2API_BASE_URL."
            : "Missing IMAGE_API_KEY. Add your image API credentials before generating images.",
      },
      { status: 500 },
    );
  }

  if (!authResult.bypassBilling) {
    try {
      await reserveImageQuota(authenticatedUser.id);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to reserve image quota." },
        { status: 402 },
      );
    }
  }

  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const result = await requestImageGeneration(endpoint, prompt, modelId);
      if (authenticatedUser.id) {
        saveGeneratedHistoryEntry({
          id: `${authenticatedUser.id}-${Date.now()}`,
          userId: authenticatedUser.id,
          prompt,
          generatedAt: Date.now(),
          results: [
            {
              provider: "image_tinchak",
              modelId,
              image: result.image,
              imageUrl: result.imageUrl,
              endpointLabel: endpoint.label,
            },
          ],
        }).catch((error) => {
          console.error(`Failed to save history [requestId=${requestId}]`, error);
        });
      }
      console.log(`Completed [requestId=${requestId}, model=${modelId}, endpoint=${endpoint.label}, upstreamElapsedMs=${result.upstreamElapsedMs}]`);
      return NextResponse.json({
        provider: "image_tinchak",
        image: result.image,
        imageUrl: result.imageUrl,
        endpointLabel: endpoint.label,
      });
    } catch (error) {
      lastError = error;
      console.error(`Failed on ${endpoint.label} [requestId=${requestId}]`, error);
    }
  }

  if (!authResult.bypassBilling) {
    try {
      await refundImageQuota(authenticatedUser.id);
    } catch (error) {
      console.error(`Failed to refund image quota [requestId=${requestId}]`, error);
      return NextResponse.json(
        { error: "生成失败，额度退回失败，请联系管理员。" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    { error: lastError instanceof Error ? lastError.message : "Failed to generate image." },
    { status: 500 },
  );
}
