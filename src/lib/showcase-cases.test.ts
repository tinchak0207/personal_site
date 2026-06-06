import test from "node:test";
import assert from "node:assert/strict";
import { SHOWCASE_CASES } from "./showcase-cases.ts";

test("showcase cases include prompt-driven examples across core styles", () => {
  assert.deepEqual(SHOWCASE_CASES.map((item) => item.id), [
    "global-skincare-branding",
    "readable-craft-beer-label",
    "tech-event-poster-dual-lang",
    "cinematic-steampunk-train",
    "interior-trend-lookup",
    "streetwear-drop-teaser",
  ]);
  assert.equal(SHOWCASE_CASES.every((item) => item.prompt.length > 20), true);
  assert.equal(SHOWCASE_CASES.every((item) => item.resultNote.length > 20), true);
  assert.deepEqual(SHOWCASE_CASES.map((item) => item.image), [
    "/showcase/showcase1.png",
    "/showcase/showcase2.png",
    "/showcase/showcase3.png",
    "/showcase/showcase4.png",
    "/showcase/showcase5.png",
    "/showcase/showcase6.png",
  ]);
  assert.equal(SHOWCASE_CASES.every((item) => !item.image?.includes("Downloads") && !item.image?.includes(":")), true);
});
