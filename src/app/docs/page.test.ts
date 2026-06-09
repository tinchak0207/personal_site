import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(relPath: string) {
  return readFileSync(join(process.cwd(), relPath), "utf8");
}

test("docs page explains cdk redemption and links back to the redeem form", () => {
  const source = read("src/app/docs/page.tsx");

  assert.match(source, /href="\/pricing#redeem"/);
  assert.match(source, /CDK/);
  assert.match(source, /兑换/);
  assert.match(source, /100/);
  assert.match(source, /500/);
  assert.match(source, /1500/);
  assert.match(source, /image\.tinchak0207\.xyz/);
});
