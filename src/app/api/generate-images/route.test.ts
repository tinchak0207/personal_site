import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { buildGatewayEndpoints, shouldBypassAuthForLocalTest } from "../../../lib/sub2api.ts";

const root = process.cwd();

function read(relPath: string) {
  return readFileSync(join(root, relPath), "utf8");
}

test("buildGatewayEndpoints prefers sub2api and appends fallback image api endpoint", () => {
  const endpoints = buildGatewayEndpoints({
    SUB2API_ENABLED: "true",
    SUB2API_BASE_URL: "http://127.0.0.1:3000/v1",
    SUB2API_API_KEY: "sk-test",
    IMAGE_API_BASE_URL_FALLBACK: "https://fallback.example/v1",
    IMAGE_API_KEY_FALLBACK: "fallback-key",
  });

  assert.deepEqual(endpoints, [
    {
      apiKey: "sk-test",
      baseURL: "http://127.0.0.1:3000/v1",
      label: "sub2api",
    },
    {
      apiKey: "fallback-key",
      baseURL: "https://fallback.example/v1",
      label: "fallback",
    },
  ]);
});

test("buildGatewayEndpoints falls back to image api endpoints", () => {
  const endpoints = buildGatewayEndpoints({
    IMAGE_API_BASE_URL: "https://primary.example/v1",
    IMAGE_API_KEY: "primary-key",
    IMAGE_API_BASE_URL_FALLBACK: "https://fallback.example/v1",
    IMAGE_API_KEY_FALLBACK: "fallback-key",
  });

  assert.deepEqual(endpoints, [
    {
      apiKey: "primary-key",
      baseURL: "https://primary.example/v1",
      label: "primary",
    },
    {
      apiKey: "fallback-key",
      baseURL: "https://fallback.example/v1",
      label: "fallback",
    },
  ]);
});

test("buildGatewayEndpoints uses configured image api endpoint in production", () => {
  const endpoints = buildGatewayEndpoints({
    NODE_ENV: "production",
    IMAGE_API_BASE_URL: "https://primary.example/v1",
    IMAGE_API_KEY: "primary-key",
  });

  assert.deepEqual(endpoints, [
    {
      apiKey: "primary-key",
      baseURL: "https://primary.example/v1",
      label: "primary",
    },
  ]);
});

test("shouldBypassAuthForLocalTest only enables bypass when explicitly configured", () => {
  assert.equal(shouldBypassAuthForLocalTest({ NEXT_PUBLIC_LOCAL_TEST_MODE: "true" }), true);
  assert.equal(shouldBypassAuthForLocalTest({ NEXT_PUBLIC_LOCAL_TEST_MODE: "false" }), false);
  assert.equal(shouldBypassAuthForLocalTest({}), false);
});

test("generate image route allows long-running image requests on vercel", () => {
  const source = read("src/app/api/generate-images/route.ts");

  assert.match(source, /export const maxDuration = 120/);
  assert.match(source, /export const preferredRegion = "hkg1"/);
  assert.match(source, /PRIMARY_UPSTREAM_TIMEOUT_MS/);
  assert.match(source, /FALLBACK_UPSTREAM_TIMEOUT_MS/);
  assert.match(source, /upstreamTimeoutForEndpoint\(endpoint\.label\)/);
  assert.match(source, /AbortController/);
  assert.match(source, /signal: controller\.signal/);
  assert.ok(source.indexOf("readUpstreamPayload(response)") < source.indexOf("clearTimeout(timeout)"));

  const primaryTimeout = Number(source.match(/const PRIMARY_UPSTREAM_TIMEOUT_MS = ([\d_]+)/)?.[1].replace(/_/g, ""));
  const fallbackTimeout = Number(source.match(/const FALLBACK_UPSTREAM_TIMEOUT_MS = ([\d_]+)/)?.[1].replace(/_/g, ""));
  assert.ok(primaryTimeout <= 25_000);
  assert.ok(fallbackTimeout >= 90_000);
  assert.ok(fallbackTimeout > primaryTimeout);
});

test("generate image route bills authenticated users server-side", () => {
  const source = read("src/app/api/generate-images/route.ts");

  assert.match(source, /authenticateImageUser/);
  assert.match(source, /reserveImageQuota/);
  assert.match(source, /refundImageQuota/);
  assert.match(source, /authenticatedUser\.id/);
  assert.ok(source.indexOf("reserveImageQuota") < source.indexOf("requestImageGeneration"));
  assert.ok(source.lastIndexOf("refundImageQuota") < source.lastIndexOf("Failed to generate image"));
});

test("image billing helper uses one image credit and admin quota adjustment", () => {
  const source = read("src/lib/image-billing.ts");

  assert.match(source, /export const IMAGE_GENERATION_QUOTA = QUOTA_PER_COIN/);
  assert.match(source, /quota < IMAGE_GENERATION_QUOTA/);
  assert.match(source, /GATEWAY_ADMIN_ACCESS_TOKEN/);
  assert.match(source, /GATEWAY_ADMIN_USER_ID/);
  assert.match(source, /\/api\/user\/manage/);
  assert.match(source, /action: "add_quota"/);
  assert.match(source, /adjustImageQuota\(userId, "subtract"/);
  assert.match(source, /adjustImageQuota\(userId, "add"/);
  assert.match(source, /\/api\/user\/\$\{userId\}/);
  assert.match(source, /user\.quota < 0/);
});
