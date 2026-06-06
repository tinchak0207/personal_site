import test from "node:test";
import assert from "node:assert/strict";

import {
  createEmptyGenerationCache,
  mergePersistedHistory,
  recordGenerationResult,
  selectPersistedHistoryForUser,
} from "./generation-cache.ts";

test("recordGenerationResult keeps the latest generated images for the active account", () => {
  const cache = createEmptyGenerationCache();

  const next = recordGenerationResult(cache, {
    userId: 7,
    username: "alice",
    prompt: "make a poster",
    generatedAt: 1000,
    results: [
      { provider: "image_tinchak", modelId: "gpt-image-2", image: "b64-a", imageUrl: null },
    ],
  });

  assert.equal(next.current.userId, 7);
  assert.equal(next.current.prompt, "make a poster");
  assert.equal(next.current.results[0]?.image, "b64-a");
  assert.equal(next.historyByUser["7"]?.length, 1);
});

test("recordGenerationResult keeps history isolated by account", () => {
  const cache = createEmptyGenerationCache();

  const withAlice = recordGenerationResult(cache, {
    userId: 7,
    username: "alice",
    prompt: "alice image",
    generatedAt: 1000,
    results: [
      { provider: "image_tinchak", modelId: "gpt-image-2", image: "alice-b64", imageUrl: null },
    ],
  });

  const withBob = recordGenerationResult(withAlice, {
    userId: 8,
    username: "bob",
    prompt: "bob image",
    generatedAt: 2000,
    results: [
      { provider: "image_tinchak", modelId: "gpt-image-2", image: "bob-b64", imageUrl: null },
    ],
  });

  assert.equal(withBob.historyByUser["7"]?.[0]?.prompt, "alice image");
  assert.equal(withBob.historyByUser["8"]?.[0]?.prompt, "bob image");
  assert.equal(selectPersistedHistoryForUser(withBob, 7).length, 1);
  assert.equal(selectPersistedHistoryForUser(withBob, 8).length, 1);
});

test("mergePersistedHistory prefers cached image data when upstream history has no image", () => {
  const cache = recordGenerationResult(createEmptyGenerationCache(), {
    userId: 7,
    username: "alice",
    prompt: "cached prompt",
    generatedAt: 1000,
    results: [
      { provider: "image_tinchak", modelId: "gpt-image-2", image: "cached-b64", imageUrl: null },
    ],
  });

  const merged = mergePersistedHistory(cache, 7, [
    {
      id: "upstream-1",
      prompt: "server prompt",
      generatedAt: 900,
      results: [],
      source: "server",
    },
  ]);

  assert.equal(merged.length, 2);
  assert.equal(merged[0]?.prompt, "cached prompt");
  assert.equal(merged[0]?.results[0]?.image, "cached-b64");
  assert.equal(merged[1]?.source, "server");
});
