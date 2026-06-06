import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(relPath: string) {
  return readFileSync(join(root, relPath), "utf8");
}

test("image generation hook persists and restores the latest result cache", () => {
  const source = read("src/hooks/use-image-generation.ts");
  assert.match(source, /readGenerationCache/);
  assert.match(source, /writeGenerationCache/);
  assert.match(source, /recordGenerationResult/);
});

test("history page merges persisted image history with server logs", () => {
  const source = read("src/components/HistoryClient.tsx");
  assert.match(source, /mergePersistedHistory/);
  assert.match(source, /readGenerationCache/);
  assert.match(source, /本地缓存/);
});
