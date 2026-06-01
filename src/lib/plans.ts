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
    name: "入門包",
    tagline: "給第一次試圖、偶爾要做封面和商品圖的人。",
    price: 29,
    anchorPrice: 39,
    coins: 600,
    validDays: 30,
    features: [
      "全部模型可用",
      "適合測試 prompt 與風格",
      "到期前提醒",
      "未用完退折扣券",
    ],
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
