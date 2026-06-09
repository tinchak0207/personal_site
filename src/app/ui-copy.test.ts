import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(relPath: string) {
  return readFileSync(join(root, relPath), "utf8");
}

test("navbar exposes wallet, history and top-up controls on mobile", () => {
  const source = read("src/components/Navbar.tsx");
  assert.match(source, /href="\/pricing"/);
  assert.match(source, /href="\/history"/);
  assert.match(source, /onClick=\{openLogin\}/);
  assert.match(source, /onClick=\{openRegister\}/);
  assert.match(source, /mobile-nav-actions/);
  assert.match(source, /mobile-wallet-balance/);
  assert.match(source, /<CheckinCalendar className="shrink-0" \/>/);
  assert.match(source, /<WalletBadge\s+showTopUp=\{false\}\s+showCheckin=\{false\}\s+className="mobile-wallet-balance min-w-0 flex-1 sm:flex-none"\s*\/>/);
  assert.match(source, /mobile-nav-actions flex min-w-0 flex-1 items-center justify-end gap-1\.5/);
  assert.match(source, /sr-only sm:not-sr-only/);
  assert.doesNotMatch(source, /flex-col gap-2/);
  assert.doesNotMatch(source, /grid-cols-\[minmax/);
  assert.doesNotMatch(source, /mobile-nav-actions[\s\S]{0,180}overflow-x-auto/);
  assert.doesNotMatch(source, /href="\/history"[\s\S]{0,220}hidden sm:flex/);
  assert.doesNotMatch(source, /href="\/pricing"[\s\S]{0,220}hidden sm:flex/);
});

test("wallet badge can be compacted for mobile navigation", () => {
  const source = read("src/components/WalletBadge.tsx");
  assert.match(source, /showCheckin = true/);
  assert.match(source, /showCheckin && canCheckin/);
  assert.match(source, /max-w-full/);
});

test("checkin calendar opens a calendar modal and awards random image credits", () => {
  const source = read("src/components/CheckinCalendar.tsx");

  assert.match(source, /fetchCheckinStatus/);
  assert.match(source, /doCheckin/);
  assert.match(source, /quotaToRewardCount/);
  assert.match(source, /formatCheckinRewardText/);
  assert.match(source, /Array\.from\(\{ length: 7 \}/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /签到领取/);
  assert.match(source, /每日签到可随机获得 1 到 3 张额度/);
  assert.match(source, /今日签到已获得/);
  assert.match(source, /await refresh\(\)/);
  assert.match(source, /bg-\[#1f2230\]\/38/);
  assert.match(source, /backdrop-blur-md/);
  assert.match(source, /bg-\[#f7f8fb\]/);
  assert.match(source, /max-w-\[440px\]/);
  assert.match(source, /w-\[min\(calc\(100vw-20px\),440px\)\]/);
  assert.doesNotMatch(source, /sm:bg-\[#f4f5f7\]/);
  assert.doesNotMatch(source, /max-w-\[390px\]/);
});

test("mobile pages reserve space for the single-row navbar", () => {
  for (const relPath of [
    "src/components/ImagePlayground.tsx",
    "src/components/HistoryClient.tsx",
    "src/components/PricingClient.tsx",
  ]) {
    const source = read(relPath);
    assert.match(source, /pt-20/);
    assert.doesNotMatch(source, /pt-32/);
  }
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

test("pricing page has a compact mobile-first recharge layout", () => {
  const pricing = read("src/components/PricingClient.tsx");

  assert.match(pricing, /mobile-pricing-compact/);
  assert.match(pricing, /mobile-pricing-plans/);
  assert.match(pricing, /mobile-pricing-tools/);
  assert.match(pricing, /text-left[\s\S]{0,80}sm:text-center/);
  assert.match(pricing, /hidden sm:flex-1/);
  assert.match(pricing, /hidden sm:block/);
});

test("pricing page exposes docs link and redeem anchor for cdk delivery", () => {
  const pricing = read("src/components/PricingClient.tsx");

  assert.match(pricing, /id="redeem"/);
  assert.match(pricing, /href="\/docs"/);
});

test("pricing redeem refreshes the displayed quota after successful cdk redemption", () => {
  const pricing = read("src/components/PricingClient.tsx");

  assert.match(pricing, /const \{ token, isLoggedIn, refresh \} = useAuth\(\)/);
  assert.match(pricing, /await refresh\(\)/);
  assert.ok(pricing.indexOf("redeemTopupCode") < pricing.indexOf("await refresh()"));
});

test("auth refresh persists the latest quota returned by new-api", () => {
  const auth = read("src/hooks/use-auth.tsx");

  assert.match(auth, /setStoredToken\(t, result\.user\)/);
  assert.match(auth, /setStoredToken\(storedToken, result\.user\)/);
});
