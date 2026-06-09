import test from "node:test";
import assert from "node:assert/strict";

import { PLANS, pricePerCoin } from "./plans.ts";

test("pricing plans match the public image package offers", () => {
  assert.deepEqual(
    PLANS.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      anchorPrice: plan.anchorPrice,
      couponNote: plan.couponNote,
      coins: plan.coins,
      purchaseUrl: plan.purchaseUrl,
      pricePerCoin: pricePerCoin(plan),
    })),
    [
      {
        id: "starter",
        name: "轻度尝鲜包",
        price: 9.9,
        anchorPrice: 20,
        couponNote: "用无门槛券",
        coins: 100,
        purchaseUrl: "https://m.tb.cn/h.R8hnjYn?tk=98pJg1LCwU5",
        pricePerCoin: "0.099",
      },
      {
        id: "popular",
        name: "主力月度会员",
        price: 29.9,
        anchorPrice: 50,
        couponNote: "用满减券",
        coins: 500,
        purchaseUrl: "https://m.tb.cn/h.RRNPSt8?tk=Jwqvg1LCmYc",
        pricePerCoin: "0.059",
      },
      {
        id: "pro",
        name: "季度无限畅画",
        price: 69,
        anchorPrice: 120,
        couponNote: "限时折扣",
        coins: 1500,
        purchaseUrl: "https://m.tb.cn/h.RQl1F4Y?tk=FtGeg1LCZ7X",
        pricePerCoin: "0.046",
      },
    ],
  );
});
