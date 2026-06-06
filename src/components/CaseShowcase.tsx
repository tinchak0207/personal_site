"use client";

import Image from "next/image";
import { ArrowUpRight, BadgeCheck, ChevronDown, Sparkles } from "lucide-react";
import { SHOWCASE_CASES } from "@/lib/showcase-cases";
import type { StylePreset } from "@/lib/prompt-enhancer";
import { cn } from "@/lib/utils";

interface CaseShowcaseProps {
  onUsePrompt: (prompt: string, style: StylePreset) => void;
}

export function CaseShowcase({ onUsePrompt }: CaseShowcaseProps) {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 pb-24 sm:px-6 lg:px-8" aria-labelledby="case-showcase-title">
      <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-[40rem]">
          <div className="mb-3 inline-flex min-h-8 items-center gap-1.5 rounded-full bg-[rgba(0,122,255,0.09)] px-3.5 text-ios-caption1 font-semibold text-[#007AFF]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            精品案例库
          </div>
          <h2 id="case-showcase-title" className="max-w-[32rem] text-ios-title1 font-semibold text-[rgba(0,0,0,0.88)] sm:text-ios-largetitle">
            看见一次成图，就知道下一张该怎么做。
          </h2>
          <p className="mt-3 max-w-[34rem] text-ios-callout text-[rgba(0,0,0,0.54)]">
            这些案例展示不同商业场景的起点。选择一个方向，替换成你的产品或活动。
          </p>
        </div>
        <div className="lg-float inline-flex min-h-11 w-fit items-center gap-2 rounded-full px-4 text-ios-footnote text-[rgba(0,0,0,0.58)]">
          <BadgeCheck className="h-4 w-4 text-[#34C759]" aria-hidden="true" />
          6 个可复用创作方向
        </div>
      </div>

      <div className="grid gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
        {SHOWCASE_CASES.map((item) => (
          <article key={item.id} className="group">
            <div className={cn("relative aspect-[4/3] overflow-hidden rounded-ios-3xl bg-gradient-to-br shadow-[0_18px_44px_rgba(0,0,0,0.10)]", item.gradient)}>
              {item.image ? (
                <Image src={item.image} alt={item.title} fill sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
              ) : (
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_16%,rgba(255,255,255,0.48),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.12),rgba(0,0,0,0.34))]" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-flex min-h-7 items-center rounded-full bg-white/76 px-3 text-ios-caption1 font-semibold text-[rgba(0,0,0,0.66)] backdrop-blur-md">
                      {item.category}
                    </span>
                    <h3 className="mt-3 max-w-[18rem] text-ios-title3 font-semibold text-white drop-shadow">
                      {item.title}
                    </h3>
                  </div>
                </div>
              )}
            </div>
            <div className="px-1 pt-4">
              <p className="text-ios-footnote text-[rgba(0,0,0,0.58)]">{item.resultNote}</p>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUsePrompt(item.prompt, item.style)}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#007AFF] px-4 text-ios-footnote font-semibold text-white shadow-[0_6px_18px_rgba(0,122,255,0.22)] transition hover:bg-[#0066DD] focus:outline-none focus:ring-2 focus:ring-[rgba(0,122,255,0.28)]"
                >
                  带入生成器
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <details className="group/details mt-3 rounded-ios-2xl bg-white/42 px-3 py-2.5 text-ios-footnote text-[rgba(0,0,0,0.64)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.70)]">
                <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-3 text-[rgba(0,0,0,0.58)]">
                  <span>查看提示词</span>
                  <ChevronDown className="h-4 w-4 transition group-open/details:rotate-180" aria-hidden="true" />
                </summary>
                <p className="mt-2 text-[rgba(0,0,0,0.66)]">{item.prompt}</p>
              </details>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
