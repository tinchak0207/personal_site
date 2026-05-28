import { NextRequest, NextResponse } from "next/server";

import type { GenerateImageRequest } from "@/lib/api-types";

const DEFAULT_IMAGE_SIZE = "1024x1024";

type UpstreamSuccess = {
  created?: number;
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
  error?: {
    message?: string;
  };
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
    body: JSON.stringify({
      model: modelId,
      prompt,
      size: DEFAULT_IMAGE_SIZE,
    }),
  });

  const payload = (await response.json()) as UpstreamSuccess;

  if (!response.ok) {
    throw new Error(
      payload.error?.message ??
        `Image generation failed on ${endpoint.label} endpoint.`,
    );
  }

  const firstItem = payload.data?.[0];
  if (!firstItem?.b64_json && !firstItem?.url) {
    throw new Error(`No image payload returned from ${endpoint.label} endpoint.`);
  }

  return {
    image: firstItem.b64_json ?? null,
    imageUrl: firstItem.url ?? null,
  };
}

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).slice(2);
  const { prompt, modelId } = (await req.json()) as GenerateImageRequest;

  const endpoints = [
    {
      baseURL:
        process.env.IMAGE_API_BASE_URL ??
        process.env.IMAGE_API_BASE_URL_PRIMARY ??
        "https://share-api.com/v1",
      apiKey: process.env.IMAGE_API_KEY ?? process.env.IMAGE_API_KEY_PRIMARY,
      label: "primary",
    },
    {
      baseURL: process.env.IMAGE_API_BASE_URL_FALLBACK ?? "https://happycode.vip/v1",
      apiKey: process.env.IMAGE_API_KEY_FALLBACK,
      label: "fallback",
    },
  ].filter((item): item is { baseURL: string; apiKey: string; label: string } =>
    Boolean(item.apiKey),
  );

  if (!prompt || !modelId) {
    return NextResponse.json(
      {
        error: "Invalid request parameters",
      },
      { status: 400 },
    );
  }

  if (endpoints.length === 0) {
    return NextResponse.json(
      {
        error:
          "Missing IMAGE_API_KEY or IMAGE_API_KEY_PRIMARY. Add your image API credentials before generating images.",
      },
      { status: 500 },
    );
  }

  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const result = await requestImageGeneration(endpoint, prompt, modelId);

      console.log(
        `Completed image request [requestId=${requestId}, model=${modelId}, endpoint=${endpoint.label}]`,
      );

      return NextResponse.json({
        provider: "image_tinchak",
        image: result.image,
        imageUrl: result.imageUrl,
      });
    } catch (error) {
      lastError = error;
      console.error(
        `Image generation failed on ${endpoint.label} endpoint [requestId=${requestId}]`,
        error,
      );
    }
  }

  console.error(`Error generating image [requestId=${requestId}]`, lastError);
  return NextResponse.json(
    {
      error:
        lastError instanceof Error
          ? lastError.message
          : "Failed to generate image. Please try again later.",
    },
    { status: 500 },
  );
}
