import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(relPath: string) {
  return readFileSync(join(root, relPath), "utf8");
}

test("navbar keeps the history link and only the card-icon top-up entry", () => {
  const source = read("src/components/Navbar.tsx");
  assert.match(source, /href="\/pricing"/);
  assert.match(source, /href="\/history"/);
  assert.match(source, /<WalletBadge showTopUp=\{false\} \/>/);
});

test("pricing page removes the bottom external store link and uses zh-CN locale", () => {
  const pricing = read("src/components/PricingClient.tsx");
  const layout = read("src/app/layout.tsx");

  assert.doesNotMatch(pricing, /前往充值商店/);
  assert.doesNotMatch(pricing, /href="https:\/\/store\.tinchak0207\.xyz"/);
  assert.match(layout, /<html lang="zh-CN"/);
});

test("pricing copy uses simplified Chinese for the back button and redeem flow", () => {
  const pricing = read("src/components/PricingClient.tsx");

  assert.match(pricing, /返回做图/);
  assert.match(pricing, /兑换码/);
  assert.match(pricing, /兑换成功/);
  assert.doesNotMatch(pricing, /返回做圖/);
  assert.doesNotMatch(pricing, /兌換碼/);
});
