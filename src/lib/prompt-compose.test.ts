import test from "node:test";
import assert from "node:assert/strict";
import { insertPromptSnippet } from "./prompt-compose.ts";

test("insertPromptSnippet appends after existing prompt without replacing it", () => {
  assert.equal(
    insertPromptSnippet("a red vase", "soft studio lighting"),
    "a red vase\n\nsoft studio lighting",
  );
});

test("insertPromptSnippet keeps existing prompt when the snippet is already present", () => {
  assert.equal(
    insertPromptSnippet("a red vase\n\nsoft studio lighting", "soft studio lighting"),
    "a red vase\n\nsoft studio lighting",
  );
});

test("insertPromptSnippet returns snippet when base prompt is empty", () => {
  assert.equal(insertPromptSnippet("   ", "soft studio lighting"), "soft studio lighting");
});
