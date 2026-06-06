import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(relPath: string) {
  return readFileSync(join(root, relPath), "utf8");
}

test("history api route exposes both GET and POST handlers", () => {
  const source = read("src/app/api/history/route.ts");
  assert.match(source, /export async function GET/);
  assert.match(source, /export async function POST/);
});

test("generate images route persists successful generations to server history", () => {
  const source = read("src/app/api/generate-images/route.ts");
  assert.match(source, /saveGeneratedHistoryEntry/);
});

test("server history store uses vercel blob-backed persistence", () => {
  const source = read("src/lib/server-history-store.ts");
  assert.match(source, /@vercel\/blob/);
  assert.match(source, /put\(/);
  assert.match(source, /history\/\$\{userId\}\.json/);
});
