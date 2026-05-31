import { NextRequest, NextResponse } from "next/server";
import type { GenerateImageRequest } from "@/lib/api-types";
import { MOCK_MODE, mockGenerateImage } from "@/lib/mock";

const DEFAULT_IMAGE_SIZE = "1024x1024";

type UpstreamSuccess = {
  created?: number;
  data?: Array<{ b64_json?: string; url?: string }>;
  error?: { message?: string };
};

async function requestImageGeneration(
  endpoint: { apiKey: string; baseURL: string; label: string },
  prompt: string,
  modelId: string,
) {
  const response = await fetch(`${endpoint.baseURL}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${endpoint.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: modelId, prompt, size: DEFAULT_IMAGE_SIZE }),
  });

  const payload = (await response.json()) as UpstreamSuccess;

  if (!response.ok) {
    throw new Error(
      payload.error?.message ?? `Image generation failed on ${endpoint.label} endpoint.`,
    );
  }

  const firstItem = payload.data?.[0];
  if (!firstItem?.b64_json && !firstItem?.url) {
    throw new Error(`No image payload returned from ${endpoint.label} endpoint.`);
  }

  return { image: firstItem.b64_json ?? null, imageUrl: firstItem.url ?? null };
}

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).slice(2);
  const { prompt, modelId } = (await req.json()) as GenerateImageRequest;

  if (!prompt || !modelId) {
    return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
  }

  // ── Mock mode ──────────────────────────────────────────────────────────────
  if (MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 1200));
    return NextResponse.json(mockGenerateImage());
  }

  // ── Real mode ──────────────────────────────────────────────────────────────
  const endpoints = [
    {
      baseURL: process.env.IMAGE_API_BASE_URL ?? process.env.IMAGE_API_BASE_URL_PRIMARY ?? "",
      apiKey: process.env.IMAGE_API_KEY ?? process.env.IMAGE_API_KEY_PRIMARY ?? "",
      label: "primary",
    },
    {
      baseURL: process.env.IMAGE_API_BASE_URL_FALLBACK ?? "",
      apiKey: process.env.IMAGE_API_KEY_FALLBACK ?? "",
      label: "fallback",
    },
  ].filter((e): e is { baseURL: string; apiKey: string; label: string } =>
    Boolean(e.apiKey && e.baseURL),
  );

  if (endpoints.length === 0) {
    return NextResponse.json(
      { error: "Missing IMAGE_API_KEY. Add your image API credentials before generating images." },
      { status: 500 },
    );
  }

  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const result = await requestImageGeneration(endpoint, prompt, modelId);
      console.log(`Completed [requestId=${requestId}, model=${modelId}, endpoint=${endpoint.label}]`);
      return NextResponse.json({ provider: "image_tinchak", image: result.image, imageUrl: result.imageUrl });
    } catch (error) {
      lastError = error;
      console.error(`Failed on ${endpoint.label} [requestId=${requestId}]`, error);
    }
  }

  return NextResponse.json(
    { error: lastError instanceof Error ? lastError.message : "Failed to generate image." },
    { status: 500 },
  );
}
