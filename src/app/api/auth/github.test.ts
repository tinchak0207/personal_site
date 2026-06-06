import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(relPath: string) {
  return readFileSync(join(root, relPath), "utf8");
}

test("github auth routes exist for start and callback flow", () => {
  const startRoute = read("src/app/api/auth/github/start/route.ts");
  const callbackRoute = read("src/app/api/auth/github/callback/route.ts");

  assert.match(startRoute, /export async function GET/);
  assert.match(callbackRoute, /export async function GET/);
});

test("auth modal offers a GitHub login shortcut", () => {
  const source = read("src/components/AuthModal.tsx");
  assert.match(source, /GitHub/);
  assert.match(source, /\/api\/auth\/github\/start/);
});
