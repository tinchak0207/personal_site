"use client";

import { useState } from "react";
import { ArrowUpRight, RefreshCw, ChevronDown } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { StylePresets } from "@/components/StylePresets";
import { getRandomSuggestions, Suggestion } from "@/lib/suggestions";
import { type StylePreset } from "@/lib/prompt-enhancer";
import { type ModelMode } from "@/lib/provider-config";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
  suggestions: Suggestion[];
  stylePreset: StylePreset;
  onStyleChange: (preset: StylePreset) => void;
  mode: ModelMode;
  onModeChange: (mode: ModelMode) => void;
}

const MODE_OPTIONS: { value: ModelMode; label: string; desc: string }[] = [
  { value: "fast",    label: "快速出圖",  desc: "速度優先，適合快速預覽" },
  { value: "quality", label: "高質感",    desc: "細節更豐富，稍慢" },
];

export function PromptInput({
  suggestions: initialSuggestions,
  isLoading,
  onSubmit,
  stylePreset,
  onStyleChange,
  mode,
  onModeChange,
}: PromptInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions);

  const updateSuggestions = () => setSuggestions(getRandomSuggestions());

  const handleSuggestionSelect = (prompt: string) => {
    setInput(prompt);
    onSubmit(prompt);
  };

  const handleSubmit = () => {
    if (!isLoading && input.trim()) onSubmit(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) onSubmit(input);
    }
  };

  return (
    <section className="lg-card lg-ambient relative overflow-hidden rounded-ios-4xl p-5 sm:p-6">
      {/* Specular top edge */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" aria-hidden="true" />

      <div className="relative space-y-4">

        {/* ── Textarea ── */}
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="試試：幫我把這瓶香水放在落日的海灘上，要有高級網美風的環境光"
            rows={5}
            className="min-h-[180px] rounded-ios-2xl border-0 bg-[rgba(0,0,0,0.04)] px-5 py-4 pb-8 text-ios-body text-[rgba(0,0,0,0.85)] placeholder:text-[rgba(0,0,0,0.24)] focus:bg-[rgba(0,122,255,0.04)] focus:ring-2 focus:ring-[rgba(0,122,255,0.20)] resize-none transition-all duration-200 [background-image:none]"
          />
          <p className="pointer-events-none absolute bottom-3 right-4 select-none text-ios-caption2 text-[rgba(0,0,0,0.22)]">
            Enter 送出 · Shift+Enter 換行
          </p>
        </div>

        {/* ── Divider ── */}
        <div className="lg-divider" />

        {/* ── Settings row: 畫質 + 風格 ── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">

          {/* 畫質 dropdown */}
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-ios-caption1 font-semibold uppercase tracking-widest text-[rgba(0,0,0,0.30)]">
              畫質
            </span>
            <div className="relative">
              <select
                value={mode}
                onChange={(e) => onModeChange(e.target.value as ModelMode)}
                className="appearance-none cursor-pointer rounded-full bg-[rgba(0,0,0,0.05)] py-1.5 pl-3.5 pr-8 text-ios-footnote font-medium text-[rgba(0,0,0,0.72)] lg-transition hover:bg-[rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,122,255,0.20)]"
              >
                {MODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[rgba(0,0,0,0.36)]" aria-hidden="true" />
            </div>
          </div>

          {/* 風格 chips inline — label 固定不換行，chips 區域自由換行 */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <span className="shrink-0 text-ios-caption1 font-semibold uppercase tracking-widest text-[rgba(0,0,0,0.30)]">
              風格
            </span>
            <div className="flex flex-wrap gap-1.5">
              <StylePresets value={stylePreset} onChange={onStyleChange} inline />
            </div>
          </div>

        </div>

        {/* ── Divider ── */}
        <div className="lg-divider" />

        {/* ── Suggestions + Submit ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

          {/* 範例 inline */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <span className="shrink-0 text-ios-caption1 font-semibold uppercase tracking-widest text-[rgba(0,0,0,0.30)]">
              範例
            </span>
            <button
              type="button"
              onClick={updateSuggestions}
              className="lg-float flex h-6 w-6 items-center justify-center rounded-full text-[rgba(0,0,0,0.36)] lg-transition hover:text-[rgba(0,0,0,0.64)] cursor-pointer"
              aria-label="換一批範例"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.text}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion.prompt)}
                className="lg-float group rounded-full px-3.5 py-1.5 text-left text-ios-footnote text-[rgba(0,0,0,0.50)] lg-transition hover:text-[rgba(0,0,0,0.80)] cursor-pointer"
              >
                <span className="font-medium">{suggestion.text}</span>
                <svg className="ml-1 inline h-2.5 w-2.5 opacity-35 group-hover:opacity-60 transition-opacity duration-200" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M10 2v4a2 2 0 0 1-2 2H2M2 8l3-3M2 8l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}
          </div>

          {/* Single CTA — elevated blue, strong shadow, scale on hover */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-ios-xl bg-[#007AFF] px-6 py-3 text-ios-body font-semibold text-white shadow-[0_6px_24px_rgba(0,122,255,0.40),0_2px_8px_rgba(0,122,255,0.24)] transition-all duration-200 hover:bg-[#0066DD] hover:shadow-[0_10px_32px_rgba(0,122,255,0.52),0_4px_12px_rgba(0,122,255,0.30)] hover:scale-[1.025] active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-[rgba(0,0,0,0.16)] disabled:shadow-none disabled:scale-100 cursor-pointer"
          >
            {isLoading ? (
              <><Spinner className="h-4 w-4 text-white" />正在做圖</>
            ) : (
              <>開始做圖<ArrowUpRight className="h-4 w-4" /></>
            )}
          </button>
        </div>

      </div>
    </section>
  );
}
