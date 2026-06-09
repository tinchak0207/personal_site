import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react";

const PACKAGES = [
  { name: "轻度尝鲜包", quota: 100, note: "适合少量试用和验证提示词风格" },
  { name: "主力月度会员", quota: 500, note: "适合稳定出图和日常素材生产" },
  { name: "季度无限畅画", quota: 1500, note: "适合高频创作和批量出图" },
];

const STEPS = [
  "登录 image.tinchak0207.xyz",
  "打开兑换入口，输入闲鱼自动发货消息里的 CDK",
  "点击兑换，等待额度到账提示",
  "回到首页输入提示词，选择模型后生成图片",
];

export const metadata = {
  title: "CDK 兑换教程 | Image Studio",
  description: "Image Studio CDK 兑换链接、会员额度说明和使用教程。",
};

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-transparent px-4 pb-20 pt-20 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href="/pricing"
          className="lg-float mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-ios-footnote font-medium text-[rgba(0,0,0,0.56)] lg-transition hover:text-[rgba(0,0,0,0.82)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回充值
        </Link>

        <header className="mb-6">
          <p className="text-ios-footnote font-semibold text-[#007AFF]">CDK 兑换与使用教程</p>
          <h1 className="mt-2 text-ios-title1 font-bold tracking-tight text-[rgba(0,0,0,0.85)] sm:text-ios-large-title">
            拍下后按这几步兑换额度
          </h1>
          <p className="mt-2 max-w-2xl text-ios-body leading-relaxed text-[rgba(0,0,0,0.52)]">
            闲鱼自动发货会给你一条 CDK、兑换链接和本教程链接。兑换成功后，额度会进入当前登录账号。
          </p>
        </header>

        <section className="lg-card relative overflow-hidden rounded-ios-3xl p-4 sm:rounded-ios-4xl sm:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-ios-title3 font-semibold text-[rgba(0,0,0,0.85)]">兑换入口</h2>
              <p className="mt-1 text-ios-footnote text-[rgba(0,0,0,0.48)]">先登录，再兑换，避免额度进错账号。</p>
            </div>
            <Link
              href="/pricing#redeem"
              className="inline-flex w-full items-center justify-center gap-2 rounded-ios-xl bg-[#007AFF] px-4 py-3 text-ios-body font-semibold text-white shadow-[0_6px_24px_rgba(0,122,255,0.30)] transition-colors hover:bg-[#0066DD] sm:w-auto"
            >
              打开兑换链接
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-3">
          {PACKAGES.map((item) => (
            <div key={item.quota} className="lg-card rounded-ios-3xl p-4 sm:rounded-ios-4xl sm:p-5">
              <p className="text-ios-footnote font-semibold text-[rgba(0,0,0,0.56)]">{item.name}</p>
              <p className="mt-2 text-[2rem] font-bold leading-none text-[rgba(0,0,0,0.85)]">{item.quota}</p>
              <p className="mt-1 text-ios-caption1 text-[rgba(0,0,0,0.44)]">张图片额度</p>
              <p className="mt-3 text-ios-footnote leading-relaxed text-[rgba(0,0,0,0.52)]">{item.note}</p>
            </div>
          ))}
        </section>

        <section className="mt-4 lg-card rounded-ios-3xl p-4 sm:rounded-ios-4xl sm:p-6">
          <h2 className="text-ios-title3 font-semibold text-[rgba(0,0,0,0.85)]">使用流程</h2>
          <ol className="mt-4 space-y-3">
            {STEPS.map((step, index) => (
              <li key={step} className="flex gap-3 text-ios-footnote leading-relaxed text-[rgba(0,0,0,0.60)]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(0,122,255,0.10)] text-ios-caption1 font-semibold text-[#007AFF]">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-4 lg-card rounded-ios-3xl p-4 sm:rounded-ios-4xl sm:p-6">
          <h2 className="text-ios-title3 font-semibold text-[rgba(0,0,0,0.85)]">注意事项</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "CDK 只能兑换一次，拍下后不要转发给其他人。",
              "100、500、1500 三种 CDK 会发放到对应的登录账号。",
              "兑换后刷新页面即可看到最新额度。",
              "如果提示无效，核对是否复制了完整 CDK。",
            ].map((item) => (
              <p key={item} className="flex gap-2 text-ios-footnote leading-relaxed text-[rgba(0,0,0,0.56)]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#34C759]" />
                {item}
              </p>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
