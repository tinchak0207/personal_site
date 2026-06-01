export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  price: number;
  anchorPrice: number;
  couponNote?: string;
  coins: number;
  validDays: number;
  features: string[];
  highlight?: boolean;
  badge?: string;
}

export const PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "嘗鮮包",
    tagline: "第一次上手最便宜，先測風格、測 prompt、測成片率。",
    price: 9.9,
    anchorPrice: 19.9,
    coins: 200,
    validDays: 15,
    features: [
      "全部模型可用",
      "適合首次測試 prompt 與風格",
      "到期前提醒",
      "未用完退折扣券",
    ],
    badge: "嘗鮮",
  },
  {
    id: "popular",
    name: "常用包",
    tagline: "適合穩定產出社群圖、海報和商品視覺。",
    price: 99,
    anchorPrice: 129,
    couponNote: "最受歡迎 · 成本最低",
    coins: 2400,
    validDays: 90,
    features: [
      "全部模型可用",
      "平均單張成本更低",
      "適合小店與工作室日常使用",
      "未用完退折扣券",
    ],
    highlight: true,
    badge: "推薦",
  },
  {
    id: "pro",
    name: "重度包",
    tagline: "給高頻生成、批量出圖和長期運營帳號。",
    price: 299,
    anchorPrice: 399,
    coins: 9000,
    validDays: 180,
    features: [
      "全部模型可用",
      "適合高頻商業使用",
      "長有效期",
      "未用完退折扣券",
    ],
    badge: "高頻使用",
  },
];

export function pricePerCoin(plan: PricingPlan): string {
  return (plan.price / plan.coins).toFixed(2);
}
