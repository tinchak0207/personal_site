import { NextRequest, NextResponse } from "next/server";
import type { GenerateImageRequest } from "@/lib/api-types";
import { MOCK_MODE, mockGenerateImage } from "@/lib/mock";
import { buildGatewayEndpoints } from "@/lib/sub2api";
import { publicImageUrl } from "@/lib/image-url";
import { saveGeneratedHistoryEntry } from "@/lib/server-history-store";
import { authenticateImageUser, refundImageQuota, reserveImageQuota } from "@/lib/image-billing";
import { buildWorkflowPrompt } from "@/lib/generation-workflow";
import type { GenerationWorkflowMetadata } from "@/lib/image-types";

export const maxDuration = 120;
export const preferredRegion = "hkg1";

const DEFAULT_IMAGE_SIZE = "1024x1024";
const IMAGE_EDITS_PATH = "/images/edits";
const IMAGE_GENERATIONS_PATH = "/images/generations";
const PRIMARY_UPSTREAM_TIMEOUT_MS = 20_000;
const FALLBACK_UPSTREAM_TIMEOUT_MS = 100_000;

type UpstreamSuccess = {
  created?: number;
  data?: Array<{ b64_json?: string; url?: string }>;
  error?: { message?: string };
};

type ParsedGenerateImageRequest = GenerateImageRequest & {
  referenceImages: File[];
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

function readWorkflowMetadata(value: unknown): GenerationWorkflowMetadata | undefined {
  if (!value) return undefined;
  const parsed = typeof value === "string"
    ? (() => {
        try {
          return JSON.parse(value) as unknown;
        } catch {
          return undefined;
        }
      })()
    : value;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
  return parsed as GenerationWorkflowMetadata;
}

async function readGenerateImageRequest(req: NextRequest): Promise<ParsedGenerateImageRequest> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    const body = (await req.json()) as GenerateImageRequest;
    return { ...body, workflow: readWorkflowMetadata(body.workflow), referenceImages: [] };
  }

  const form = await req.formData();
  const prompt = String(form.get("prompt") ?? "");
  const provider = String(form.get("provider") ?? "") as GenerateImageRequest["provider"];
  const modelId = String(form.get("modelId") ?? "");
  const workflow = readWorkflowMetadata(form.get("workflow"));
  const referenceImages = form
    .getAll("referenceImages")
    .filter((item): item is File => item instanceof File && item.size > 0);

  return { prompt, provider, modelId, workflow, referenceImages };
}

function buildUpstreamImageRequestBody(
  prompt: string,
  modelId: string,
  referenceImages: File[],
): { path: string; body: BodyInit; headers: Record<string, string> } {
  if (referenceImages.length > 0) {
    const body = new FormData();
    body.append("model", modelId);
    body.append("prompt", prompt);
    body.append("size", DEFAULT_IMAGE_SIZE);
    for (const image of referenceImages) {
      body.append("image", image, image.name || "reference-image.png");
    }
    return { path: IMAGE_EDITS_PATH, body, headers: {} };
  }

  return {
    path: IMAGE_GENERATIONS_PATH,
    body: JSON.stringify({ model: modelId, prompt, size: DEFAULT_IMAGE_SIZE }),
    headers: { "Content-Type": "application/json" },
  };
}

async function requestImageGeneration(
  endpoint: { apiKey: string; baseURL: string; label: string },
  prompt: string,
  modelId: string,
  referenceImages: File[],
) {
  const startedAt = Date.now();
  const timeoutMs = upstreamTimeoutForEndpoint(endpoint.label);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const upstreamRequest = buildUpstreamImageRequestBody(prompt, modelId, referenceImages);

  try {
    const response = await fetch(`${endpoint.baseURL}${upstreamRequest.path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${endpoint.apiKey}`,
        ...upstreamRequest.headers,
      },
      body: upstreamRequest.body,
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
  const { prompt, modelId, referenceImages, workflow } = await readGenerateImageRequest(req);
  const finalPrompt = buildWorkflowPrompt(prompt, workflow);

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
      const result = await requestImageGeneration(endpoint, finalPrompt, modelId, referenceImages);
      if (authenticatedUser.id) {
        saveGeneratedHistoryEntry({
          id: `${authenticatedUser.id}-${Date.now()}`,
          userId: authenticatedUser.id,
          prompt: finalPrompt,
          generatedAt: Date.now(),
          workflow,
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
