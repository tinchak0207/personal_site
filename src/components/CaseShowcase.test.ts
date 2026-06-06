import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(relPath: string) {
  return readFileSync(join(process.cwd(), relPath), "utf8");
}

test("homepage wires case showcase prompts into the prompt input", () => {
  const playground = read("src/components/ImagePlayground.tsx");
  const promptInput = read("src/components/PromptInput.tsx");
  const showcase = read("src/components/CaseShowcase.tsx");
  assert.match(playground, /CaseShowcase/);
  assert.match(playground, /setCasePrompt/);
  assert.match(promptInput, /externalPrompt/);
  assert.match(showcase, /精品案例库/);
  assert.match(showcase, /min-h-11/);
  assert.match(showcase, /带入生成器/);
  assert.match(showcase, /<details/);
  assert.doesNotMatch(showcase, /lg-card/);
});
