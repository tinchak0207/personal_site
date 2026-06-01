import test from "node:test";
import assert from "node:assert/strict";

import { buildGatewayEndpoints, shouldBypassAuthForLocalTest } from "../../../lib/sub2api.ts";

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

test("shouldBypassAuthForLocalTest only enables bypass when explicitly configured", () => {
  assert.equal(shouldBypassAuthForLocalTest({ NEXT_PUBLIC_LOCAL_TEST_MODE: "true" }), true);
  assert.equal(shouldBypassAuthForLocalTest({ NEXT_PUBLIC_LOCAL_TEST_MODE: "false" }), false);
  assert.equal(shouldBypassAuthForLocalTest({}), false);
});
