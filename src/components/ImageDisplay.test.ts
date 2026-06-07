import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(relPath: string) {
  return readFileSync(join(process.cwd(), relPath), "utf8");
}

test("image display download button never invokes native share", () => {
  const displaySource = read("src/components/ImageDisplay.tsx");
  const helperSource = read("src/lib/image-helpers.ts");
  assert.match(displaySource, /imageHelpers\.download/);
  assert.doesNotMatch(displaySource, /Share/);
  assert.doesNotMatch(helperSource, /navigator\.share/);
});
