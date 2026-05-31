"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Coins, Gift, Copy, ExternalLink, Ticket } from "lucide-react";
import { PLANS, pricePerCoin } from "@/lib/plans";
import { useAuth } from "@/hooks/use-auth";
import { fetchAffCode, redeemTopupCode } from "@/lib/new-api-client";
import { useToast } from "@/hooks/use-toast";
import { AuthModal } from "@/components/AuthModal";
import { cn } from "@/lib/utils";

export function PricingClient() {
  const { token, isLoggedIn } = useAuth();
  const { toast } = useToast();
  const [authOpen, setAuthOpen] = useState(false);
  const [affCode, setAffCode] = useState<string | null>(null);
  const [affLoading, setAffLoading] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);

  const handleBuy = (planId: string) => {
    if (!isLoggedIn) { setAuthOpen(true); return; }
    // Redirect to store with plan hint
    window.open(`https://store.tinchak0207.xyz?plan=${planId}`, "_blank");
  };

  const handleFetchAff = async () => {
    if (!token) { setAuthOpen(true); return; }
    setAffLoading(true);
    try {
      const res = await fetchAffCode(token);
      if (res.success && res.data) setAffCode(res.data);
      else toast({ title: "獲取失敗", description: res.message ?? "請稍後再試", variant: "destructive" });
    } catch {
      toast({ title: "網絡錯誤", variant: "destructive" });
    } finally { setAffLoading(false); }
  };

  const handleCopyAff = () => {
    if (!affCode) return;
    const url = `${window.location.origin}?ref=${affCode}`;
    navigator.clipboard.writeText(url).then(() =>
      toast({ title: "已複製邀請連結" })
    );
  };

  const handleRedeem = async () => {
    if (!token) { setAuthOpen(true); return; }
    if (!redeemCode.trim()) return;
    setRedeemLoading(true);
    try {
      const res = await redeemTopupCode(token, redeemCode.trim());
      if (res.success) {
        toast({ title: "兌換成功 🎉", description: `已入帳 ${res.data?.quota ?? ""} 額度` });
        setRedeemCode("");
      } else {
        toast({ title: "兌換失敗", description: res.message ?? "碼無效或已使用", variant: "destructive" });
      }
    } catch {
      toast({ title: "網絡錯誤", variant: "destructive" });
    } finally { setRedeemLoading(false); }
  };

  return (
    <>
      <div className="min-h-screen bg-transparent px-4 pb-24 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">

          {/* Back nav */}
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-ios-footnote text-[rgba(0,0,0,0.44)] lg-transition hover:text-[rgba(0,0,0,0.72)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回做圖
          </Link>

          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-ios-large-title font-bold tracking-tight text-[rgba(0,0,0,0.85)]">
              選擇你的方案
            </h1>
            <p className="mt-2 text-ios-body text-[rgba(0,0,0,0.44)]">
              所有方案均支援全部模型 · 到期前提醒 · 未用完退折扣券
            </p>
          </div>

          {/* Plan cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <section
                key={plan.id}
                className={cn(
                  "lg-card relative overflow-hidden rounded-ios-4xl p-6 flex flex-col",
                  plan.highlight && "ring-2 ring-[#007AFF]/30",
                )}
              >
                {/* Specular */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />

                {/* Badge */}
                {plan.badge && (
                  <span className="mb-3 inline-flex w-fit items-center rounded-full bg-[#007AFF] px-3 py-1 text-ios-caption1 font-semibold text-white">
                    {plan.badge}
                  </span>
                )}

                {/* Name + tagline */}
                <h2 className="text-ios-title2 font-bold text-[rgba(0,0,0,0.85)]">{plan.name}</h2>
                <p className="mt-1 text-ios-footnote text-[rgba(0,0,0,0.44)]">{plan.tagline}</p>

                {/* Price block */}
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[2rem] font-bold leading-none text-[rgba(0,0,0,0.85)]">
                      ¥{plan.price}
                    </span>
                    <span className="text-ios-footnote text-[rgba(0,0,0,0.30)] line-through">
                      ¥{plan.anchorPrice}
                    </span>
                  </div>
                  {plan.couponNote && (
                    <p className="mt-1 text-ios-caption1 text-[rgba(0,122,255,0.72)]">{plan.couponNote}</p>
                  )}
                  <div className="mt-2 flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-[rgba(120,90,20,0.60)]" />
                    <span className="text-ios-caption1 text-[rgba(0,0,0,0.44)]">
                      {plan.coins} 張 · {plan.validDays} 天有效
                    </span>
                  </div>
                  <p className="mt-1 text-ios-caption2 text-[rgba(0,0,0,0.28)]">
                    約 ¥{pricePerCoin(plan)} / 張
                  </p>
                </div>

                {/* Features */}
                <ul className="mt-5 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-ios-footnote text-[rgba(0,0,0,0.60)]">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#34C759]" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  type="button"
                  onClick={() => handleBuy(plan.id)}
                  className={cn(
                    "mt-6 w-full rounded-ios-xl py-3 text-ios-body font-semibold transition-all duration-200",
                    plan.highlight
                      ? "bg-[#007AFF] text-white shadow-[0_6px_24px_rgba(0,122,255,0.40)] hover:bg-[#0066DD] hover:scale-[1.02]"
                      : "lg-float text-[rgba(0,0,0,0.72)] hover:text-[rgba(0,0,0,0.85)]",
                  )}
                >
                  立即購買
                </button>
              </section>
            ))}
          </div>

          {/* Redeem code + Invite — two-col on desktop */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">

            {/* Redeem code */}
            <section className="lg-card relative overflow-hidden rounded-ios-4xl p-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
              <div className="flex items-center gap-2 mb-4">
                <Ticket className="h-4 w-4 text-[rgba(0,0,0,0.44)]" />
                <h3 className="text-ios-subhead font-semibold text-[rgba(0,0,0,0.85)]">兌換碼</h3>
              </div>
              <p className="mb-4 text-ios-footnote text-[rgba(0,0,0,0.44)]">
                輸入兌換碼，額度即時入帳。
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
                  placeholder="輸入兌換碼"
                  className="flex-1 rounded-ios-xl border-0 bg-[rgba(0,0,0,0.04)] px-4 py-2.5 text-ios-footnote text-[rgba(0,0,0,0.85)] placeholder:text-[rgba(0,0,0,0.24)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,122,255,0.20)] [background-image:none]"
                />
                <button
                  type="button"
                  onClick={handleRedeem}
                  disabled={redeemLoading || !redeemCode.trim()}
                  className="rounded-ios-xl bg-[#007AFF] px-4 py-2.5 text-ios-footnote font-semibold text-white shadow-[0_4px_16px_rgba(0,122,255,0.30)] transition-all hover:bg-[#0066DD] disabled:bg-[rgba(0,0,0,0.16)] disabled:shadow-none"
                >
                  {redeemLoading ? "兌換中" : "兌換"}
                </button>
              </div>
            </section>

            {/* Invite / referral */}
            <section className="lg-card relative overflow-hidden rounded-ios-4xl p-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
              <div className="flex items-center gap-2 mb-4">
                <Gift className="h-4 w-4 text-[rgba(0,0,0,0.44)]" />
                <h3 className="text-ios-subhead font-semibold text-[rgba(0,0,0,0.85)]">邀請好友</h3>
              </div>
              <p className="mb-4 text-ios-footnote text-[rgba(0,0,0,0.44)]">
                好友首次充值後，你獲得 <span className="font-semibold text-[rgba(0,0,0,0.72)]">100 張額度</span>，好友獲得 <span className="font-semibold text-[rgba(0,0,0,0.72)]">50 張額度</span>。獎勵以額度形式發放，不可提現。
              </p>
              {affCode ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-ios-xl bg-[rgba(0,0,0,0.04)] px-4 py-2.5">
                    <span className="flex-1 truncate font-mono text-ios-footnote text-[rgba(0,0,0,0.72)]">
                      {`${typeof window !== "undefined" ? window.location.origin : ""}/ref=${affCode}`}
                    </span>
                    <button type="button" onClick={handleCopyAff} className="shrink-0 text-[rgba(0,122,255,0.80)] hover:text-[#007AFF]">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-ios-caption2 text-[rgba(0,0,0,0.30)]">你的邀請碼：{affCode}</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleFetchAff}
                  disabled={affLoading}
                  className="w-full rounded-ios-xl border border-[rgba(0,0,0,0.10)] py-2.5 text-ios-footnote font-medium text-[rgba(0,0,0,0.56)] transition-all hover:border-[rgba(0,0,0,0.18)] hover:text-[rgba(0,0,0,0.80)] disabled:opacity-50"
                >
                  {affLoading ? "載入中…" : isLoggedIn ? "查看我的邀請連結" : "登錄後查看"}
                </button>
              )}
            </section>
          </div>

          {/* FAQ strip */}
          <div className="mt-8 lg-card relative overflow-hidden rounded-ios-4xl p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
            <h3 className="mb-4 text-ios-subhead font-semibold text-[rgba(0,0,0,0.85)]">常見問題</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FAQ.map((item) => (
                <div key={item.q}>
                  <p className="text-ios-footnote font-semibold text-[rgba(0,0,0,0.72)]">{item.q}</p>
                  <p className="mt-1 text-ios-caption1 text-[rgba(0,0,0,0.44)] leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Store link */}
          <div className="mt-6 text-center">
            <a
              href="https://store.tinchak0207.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-ios-footnote text-[rgba(0,0,0,0.36)] hover:text-[rgba(0,0,0,0.60)] transition-colors"
            >
              前往充值商店
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultTab="login" />
    </>
  );
}

const FAQ = [
  {
    q: "額度過期了怎麼辦？",
    a: "到期前 3 天會發通知。過期後未用完的額度，我們會退一張等值折扣券，有效期 72 小時。",
  },
  {
    q: "邀請獎勵是現金嗎？",
    a: "不是。獎勵以生成額度形式發放，不可提現，不可轉讓。這樣我們才能把成本壓到最低，讓你的單張成本更便宜。",
  },
  {
    q: "支援哪些模型？",
    a: "所有方案均支援平台上架的全部模型，包括 GPT-Image、DALL·E 等，不額外收費。",
  },
  {
    q: "可以退款嗎？",
    a: "虛擬商品一經發放不支援退款。如遇平台故障導致無法使用，會按比例補償額度。",
  },
  {
    q: "一張圖消耗多少額度？",
    a: "根據模型和解析度不同，通常 1 張消耗 1 個額度單位。高解析度或特殊模型可能消耗 2-3 個。",
  },
  {
    q: "充值後多久到帳？",
    a: "通過兌換碼充值即時到帳。如有延遲請聯繫客服，通常 5 分鐘內解決。",
  },
];

