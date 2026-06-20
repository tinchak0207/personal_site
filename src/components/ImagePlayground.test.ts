import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(relPath: string) {
  return readFileSync(join(process.cwd(), relPath), "utf8");
}

test("image playground controls normal, fallback, and failed progress timing", () => {
  const source = read("src/components/ImagePlayground.tsx");
  assert.match(source, /NORMAL_PROGRESS_DURATION_MS/);
  assert.match(source, /FALLBACK_PROGRESS_DURATION_MS/);
  assert.match(source, /progressDurationMs/);
  assert.match(source, /endpointLabel === "fallback"/);
  assert.match(source, /failedProviders\.length > 0/);
  assert.match(source, /progressStartedAt/);
  assert.match(source, /showProgress/);
  assert.match(source, /revealGeneratedResult = !showProgress/);
  assert.doesNotMatch(source, /<GenerationProgressBar|QuietRevealTheater|theaterStartedAt|finalImageSrc/);
});

test("professional mode renders as a standalone app without the normal showcase shell", () => {
  const source = read("src/components/ImagePlayground.tsx");
  const proBranch = source.indexOf("if (showProfessionalMode)");
  const normalShell = source.indexOf("min-h-screen bg-transparent");
  const showcase = source.indexOf("<CaseShowcase");

  assert.notEqual(proBranch, -1);
  assert.match(source, /pro-app-shell/);
  assert.match(source, /onExitProfessionalMode/);
  assert.ok(proBranch < normalShell);
  assert.ok(proBranch < showcase);
});
