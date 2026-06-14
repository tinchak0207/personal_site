"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Coins, Gift, Copy, Ticket, Sparkles, BookOpen, ShoppingBag, QrCode } from "lucide-react";
import { PLANS, pricePerCoin } from "@/lib/plans";
import { useAuth } from "@/hooks/use-auth";
import { fetchAffCode, redeemTopupCode } from "@/lib/new-api-client";
import { useToast } from "@/hooks/use-toast";
import { AuthModal } from "@/components/AuthModal";
import { cn } from "@/lib/utils";

export function PricingClient() {
  const { token, isLoggedIn, refresh } = useAuth();
  const { toast } = useToast();
  const [authOpen, setAuthOpen] = useState(false);
  const [affCode, setAffCode] = useState<string | null>(null);
  const [affLoading, setAffLoading] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);

  useEffect(() => {
    const cdk = new URLSearchParams(window.location.search).get("cdk");
    if (cdk) setRedeemCode(cdk);
  }, []);

  const handleBuy = (purchaseUrl: string) => {
    window.open(purchaseUrl, "_blank");
  };

  const handleMapayBuy = (planId: string) => {
    window.open(`/api/payments/mapay/checkout?plan=${encodeURIComponent(planId)}`, "_blank");
  };

  const handleFetchAff = async () => {
    if (!token) { setAuthOpen(true); return; }
    setAffLoading(true);
    try {
      const res = await fetchAffCode(token);
      if (res.success && res.data) setAffCode(res.data);
      else toast({ title: "获取失败", description: res.message ?? "请稍后再试", variant: "destructive" });
    } catch {
      toast({ title: "网络错误", variant: "destructive" });
    } finally { setAffLoading(false); }
  };

  const handleCopyAff = () => {
    if (!affCode) return;
    const url = `${window.location.origin}?ref=${affCode}`;
    navigator.clipboard.writeText(url).then(() =>
      toast({ title: "已复制邀请链接" })
    );
  };

  const handleRedeem = async () => {
    if (!token) { setAuthOpen(true); return; }
    if (!redeemCode.trim()) return;
    setRedeemLoading(true);
    try {
      const res = await redeemTopupCode(token, redeemCode.trim());
      if (res.success) {
        await refresh();
        toast({ title: "兑换成功", description: `已到账 ${res.data?.quota ?? ""} 点额度` });
        setRedeemCode("");
      } else {
        toast({ title: "兑换失败", description: res.message ?? "兑换码无效或已使用", variant: "destructive" });
      }
    } catch {
      toast({ title: "网络错误", variant: "destructive" });
    } finally { setRedeemLoading(false); }
  };

  return (
    <>
      <div className="mobile-pricing-compact min-h-screen bg-transparent px-4 pb-20 pt-20 sm:px-6 sm:pb-24 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">

          {/* Back nav */}
          <Link
            href="/"
            className="lg-float mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-ios-footnote font-medium text-[rgba(0,0,0,0.56)] lg-transition hover:text-[rgba(0,0,0,0.82)] cursor-pointer sm:mb-8 sm:px-4 sm:py-2.5"
            aria-label="返回做图"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回做图
          </Link>

          {/* Header */}
          <div className="mb-5 text-left sm:mb-10 sm:text-center">
            <div className="mb-4 hidden justify-center sm:flex">
              <div className="flex h-12 w-12 items-center justify-center rounded-ios-2xl bg-[rgba(0,122,255,0.10)]">
                <Sparkles className="h-5 w-5 text-[#007AFF]" />
              </div>
            </div>
            <h1 className="text-ios-title1 font-bold tracking-tight text-[rgba(0,0,0,0.85)] sm:text-ios-large-title">
              选择你的方案
            </h1>
            <p className="mt-1 max-w-[22rem] text-ios-footnote leading-relaxed text-[rgba(0,0,0,0.46)] sm:mx-auto sm:mt-2 sm:max-w-none sm:text-ios-body">
              所有方案都支持全部模型，到期前会提醒，没用完会退等值折扣券
            </p>
          </div>

          {/* Plan cards */}
          <div className="mobile-pricing-plans grid gap-3 sm:grid-cols-3 sm:gap-4">
            {PLANS.map((plan) => (
              <section
                key={plan.id}
                className={cn(
                  "lg-card relative flex flex-col overflow-hidden rounded-ios-3xl p-4 sm:rounded-ios-4xl sm:p-6",
                  plan.highlight && "ring-2 ring-[rgba(0,122,255,0.28)]",
                )}
              >
                {/* Specular */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />

                {/* Badge */}
                {plan.badge && (
                  <span className="mb-2 inline-flex w-fit items-center rounded-full bg-[#007AFF] px-2.5 py-0.5 text-ios-caption1 font-semibold text-white sm:mb-3 sm:px-3 sm:py-1">
                    {plan.badge}
                  </span>
                )}

                {/* Name + tagline */}
                <h2 className="text-ios-title3 font-bold text-[rgba(0,0,0,0.85)] sm:text-ios-title2">{plan.name}</h2>
                <p className="mt-1 hidden text-ios-footnote text-[rgba(0,0,0,0.44)] sm:block">{plan.tagline}</p>

                {/* Price block */}
                <div className="mt-3 sm:mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[1.75rem] font-bold leading-none text-[rgba(0,0,0,0.85)] sm:text-[2rem]">
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
                      {plan.coins} 张 · {plan.validDays} 天有效
                    </span>
                  </div>
                  <p className="mt-1 text-ios-caption2 text-[rgba(0,0,0,0.28)]">
                    约 ¥{pricePerCoin(plan)} / 张
                  </p>
                </div>

                {/* Features */}
                <ul className="mt-4 hidden sm:flex-1 sm:block sm:space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-ios-footnote text-[rgba(0,0,0,0.60)]">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#34C759]" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6">
                  <button
                    type="button"
                    onClick={() => handleBuy(plan.purchaseUrl)}
                    className={cn(
                      "inline-flex min-w-0 items-center justify-center gap-1.5 rounded-ios-xl py-3 text-ios-footnote font-semibold transition-all duration-200 cursor-pointer",
                      plan.highlight
                        ? "bg-[#007AFF] text-white shadow-[0_6px_24px_rgba(0,122,255,0.40)] hover:bg-[#0066DD] hover:scale-[1.02] active:scale-[0.98]"
                        : "lg-float text-[rgba(0,0,0,0.65)] hover:text-[rgba(0,0,0,0.85)]",
                    )}
                  >
                    <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">淘宝购买</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMapayBuy(plan.id)}
                    className="lg-float inline-flex min-w-0 items-center justify-center gap-1.5 rounded-ios-xl py-3 text-ios-footnote font-semibold text-[rgba(0,0,0,0.65)] transition-all duration-200 hover:text-[rgba(0,0,0,0.85)] cursor-pointer"
                  >
                    <QrCode className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">码支付</span>
                  </button>
                </div>
              </section>
            ))}
          </div>

          {/* Redeem code + Invite — two-col on desktop */}
          <div className="mobile-pricing-tools mt-5 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">

            {/* Redeem code */}
            <section id="redeem" className="lg-card relative overflow-hidden rounded-ios-3xl p-4 sm:rounded-ios-4xl sm:p-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
              <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-[rgba(0,0,0,0.44)]" />
                  <h3 className="text-ios-subhead font-semibold text-[rgba(0,0,0,0.85)]">兑换码</h3>
                </div>
                <Link
                  href="/docs"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[rgba(0,0,0,0.04)] px-2.5 py-1 text-ios-caption1 font-medium text-[rgba(0,0,0,0.56)] transition-colors hover:text-[rgba(0,0,0,0.82)]"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  教程
                </Link>
              </div>
              <p className="mb-3 text-ios-footnote text-[rgba(0,0,0,0.44)] sm:mb-4">
                输入兑换码，额度会立即到账。
              </p>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <input
                  type="text"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
                  placeholder="输入兑换码"
                  className="min-w-0 rounded-ios-xl border-0 bg-[rgba(0,0,0,0.04)] px-4 py-2.5 text-ios-footnote text-[rgba(0,0,0,0.85)] placeholder:text-[rgba(0,0,0,0.24)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,122,255,0.20)] [background-image:none]"
                />
                <button
                  type="button"
                  onClick={handleRedeem}
                  disabled={redeemLoading || !redeemCode.trim()}
                  className="rounded-ios-xl bg-[#007AFF] px-4 py-2.5 text-ios-footnote font-semibold text-white shadow-[0_4px_16px_rgba(0,122,255,0.30)] transition-all hover:bg-[#0066DD] disabled:bg-[rgba(0,0,0,0.16)] disabled:shadow-none cursor-pointer disabled:cursor-default"
                >
                  {redeemLoading ? "兑换中" : "兑换"}
                </button>
              </div>
            </section>

            {/* Invite / referral */}
            <section className="hidden sm:block lg-card relative overflow-hidden rounded-ios-4xl p-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
              <div className="flex items-center gap-2 mb-4">
                <Gift className="h-4 w-4 text-[rgba(0,0,0,0.44)]" />
                <h3 className="text-ios-subhead font-semibold text-[rgba(0,0,0,0.85)]">邀请好友</h3>
              </div>
              <p className="mb-4 text-ios-footnote text-[rgba(0,0,0,0.44)]">
                好友首次充值后，你获得 <span className="font-semibold text-[rgba(0,0,0,0.72)]">100 点额度</span>，好友获得 <span className="font-semibold text-[rgba(0,0,0,0.72)]">50 点额度</span>。奖励会以额度形式发放，不能提现。
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
                  <p className="text-ios-caption2 text-[rgba(0,0,0,0.30)]">你的邀请码：{affCode}</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleFetchAff}
                  disabled={affLoading}
                  className="w-full rounded-ios-xl border border-[rgba(0,0,0,0.10)] py-2.5 text-ios-footnote font-medium text-[rgba(0,0,0,0.56)] transition-all hover:border-[rgba(0,0,0,0.18)] hover:text-[rgba(0,0,0,0.80)] disabled:opacity-50 cursor-pointer disabled:cursor-default"
                >
                  {affLoading ? "加载中…" : isLoggedIn ? "查看我的邀请链接" : "登录后查看"}
                </button>
              )}
            </section>
          </div>

          {/* FAQ strip */}
          <div className="hidden sm:block mt-8 lg-card relative overflow-hidden rounded-ios-4xl p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
            <h3 className="mb-4 text-ios-subhead font-semibold text-[rgba(0,0,0,0.85)]">常见问题</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FAQ.map((item) => (
                <div key={item.q}>
                  <p className="text-ios-footnote font-semibold text-[rgba(0,0,0,0.72)]">{item.q}</p>
                  <p className="mt-1 text-ios-caption1 text-[rgba(0,0,0,0.44)] leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultTab="login" />
    </>
  );
}

const FAQ = [
  {
    q: "额度过期了怎么办？",
    a: "到期前 3 天会提醒。过期后如果还有没用完的额度，我们会退一张等值折扣券，有效期 72 小时。",
  },
  {
    q: "邀请奖励是现金吗？",
    a: "不是。奖励会以生成额度形式发放，不能提现，也不能转让。",
  },
  {
    q: "支持哪些模型？",
    a: "所有方案都支持平台上架的全部模型，包括 GPT-Image、DALL·E 等，不会额外收费。",
  },
  {
    q: "可以退款吗？",
    a: "虚拟商品一经发放就不支持退款。如果因为平台故障导致无法使用，会按比例补偿额度。",
  },
  {
    q: "一张图会消耗多少额度？",
    a: "会根据模型和分辨率不同而变化。通常 1 张图消耗 1 个额度单位，高分辨率或特殊模型可能消耗 2 到 3 个。",
  },
  {
    q: "充值后多久到账？",
    a: "通过兑换码充值会立即到账。如果有延迟，请联系客服，通常 5 分钟内可以解决。",
  },
];

