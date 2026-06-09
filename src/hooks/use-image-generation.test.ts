import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(relPath: string) {
  return readFileSync(join(root, relPath), "utf8");
}

test("image generation hook handles non-json server errors without a json parse crash", () => {
  const source = read("src/hooks/use-image-generation.ts");

  assert.match(source, /async function readGenerationResponse/);
  assert.match(source, /const text = await response\.text\(\)/);
  assert.match(source, /JSON\.parse\(text\)/);
  assert.doesNotMatch(source, /const data = await response\.json\(\)/);
});

test("image generation hook sends user auth and refreshes balance after completion", () => {
  const hook = read("src/hooks/use-image-generation.ts");
  const playground = read("src/components/ImagePlayground.tsx");

  assert.match(hook, /getStoredToken/);
  assert.match(hook, /Authorization: `Bearer \$\{token\}`/);
  assert.match(hook, /"x-user-id": String\(user\.id\)/);
  assert.match(playground, /await startGeneration/);
  assert.doesNotMatch(playground, /setTimeout\(\(\) => \{\s*refresh\(\)/);
});
