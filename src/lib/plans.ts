export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  price: number;
  anchorPrice: number;
  couponNote?: string;
  coins: number;
  validDays: number;
  purchaseUrl: string;
  features: string[];
  highlight?: boolean;
  badge?: string;
}

export const PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "轻度尝鲜包",
    tagline: "20元 / 100张，适合少量试用和快速验证风格。",
    price: 9.9,
    anchorPrice: 20,
    couponNote: "用无门槛券",
    coins: 100,
    validDays: 30,
    purchaseUrl: "https://m.tb.cn/h.R8hnjYn?tk=98pJg1LCwU5",
    features: [
      "100张图片额度",
      "无门槛券后 9.9 元",
      "折合 0.099 元/张",
      "适合轻量尝鲜和小批量出图",
    ],
    badge: "尝鲜",
  },
  {
    id: "popular",
    name: "主力月度会员",
    tagline: "50元 / 500张，适合月度稳定出图和日常素材生产。",
    price: 29.9,
    anchorPrice: 50,
    couponNote: "用满减券",
    coins: 500,
    validDays: 30,
    purchaseUrl: "https://m.tb.cn/h.RRNPSt8?tk=Jwqvg1LCmYc",
    features: [
      "500张图片额度",
      "满减券后 29.9 元",
      "折合 0.059 元/张",
      "适合主力月度使用",
    ],
    highlight: true,
    badge: "主力",
  },
  {
    id: "pro",
    name: "季度无限畅画",
    tagline: "120元 / 1500张，适合季度高频创作和批量出图。",
    price: 69,
    anchorPrice: 120,
    couponNote: "限时折扣",
    coins: 1500,
    validDays: 90,
    purchaseUrl: "https://m.tb.cn/h.RQl1F4Y?tk=FtGeg1LCZ7X",
    features: [
      "1500张图片额度",
      "限时折扣 69 元",
      "折合 0.046 元/张",
      "适合季度高频畅画",
    ],
    badge: "季度",
  },
];

export function pricePerCoin(plan: PricingPlan): string {
  return (Math.floor((plan.price / plan.coins) * 1000) / 1000).toFixed(3);
}
