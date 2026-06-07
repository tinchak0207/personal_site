import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(relPath: string) {
  return readFileSync(join(process.cwd(), relPath), "utf8");
}

test("prompt input inserts example snippets instead of replacing typed text", () => {
  const source = read("src/components/PromptInput.tsx");
  assert.match(source, /insertPromptSnippet/);
  assert.match(source, /externalPrompt/);
  assert.match(source, /handleSuggestionSelect/);
  assert.match(source, /setInput\(\(current\) => insertPromptSnippet\(current, prompt\)\)/);
  assert.doesNotMatch(source, /setInput\(prompt\);\s*onSubmit\(prompt\)/);
  assert.doesNotMatch(source, /handleSuggestionSelect[\s\S]{0,160}onSubmit/);
});

test("prompt input uses selects on mobile and chips on desktop", () => {
  const source = read("src/components/PromptInput.tsx");
  assert.match(source, /md:hidden/);
  assert.match(source, /hidden flex-wrap items-center gap-x-4 gap-y-3 md:flex/);
  assert.match(source, /STYLE_OPTIONS\.map/);
  assert.match(source, /suggestions\.map/);
  assert.match(source, /select/);
  assert.match(source, /ChevronDown/);
  assert.match(source, /hidden flex-wrap items-center gap-x-2 gap-y-2 md:flex/);
  assert.match(source, /换一批示例/);
  assert.match(source, /RefreshCw/);
});
