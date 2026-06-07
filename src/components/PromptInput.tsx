"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronDown, RefreshCw } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { StylePresets } from "@/components/StylePresets";
import { getRandomSuggestions, Suggestion } from "@/lib/suggestions";
import { STYLE_PRESETS, type StylePreset } from "@/lib/prompt-enhancer";
import { type ModelMode } from "@/lib/provider-config";
import { insertPromptSnippet } from "@/lib/prompt-compose";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
  isLoggedIn?: boolean;
  suggestions: Suggestion[];
  stylePreset: StylePreset;
  onStyleChange: (preset: StylePreset) => void;
  mode: ModelMode;
  onModeChange: (mode: ModelMode) => void;
  externalPrompt?: string;
}

const MODE_OPTIONS: { value: ModelMode; label: string; desc: string }[] = [
  { value: "fast", label: "快速出图", desc: "速度优先，适合快速预览" },
  { value: "quality", label: "高质感", desc: "细节更丰富，但会稍慢一些" },
];

const STYLE_OPTIONS = [
  { value: "none" as const, label: "默认" },
  ...STYLE_PRESETS.map((preset) => ({ value: preset.key, label: preset.label })),
];

export function PromptInput({
  suggestions: initialSuggestions,
  isLoading,
  isLoggedIn,
  onSubmit,
  stylePreset,
  onStyleChange,
  mode,
  onModeChange,
  externalPrompt,
}: PromptInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions);

  useEffect(() => {
    if (externalPrompt) {
      setInput((current) => insertPromptSnippet(current, externalPrompt));
    }
  }, [externalPrompt]);

  const handleSuggestionSelect = (prompt: string) => {
    setInput((current) => insertPromptSnippet(current, prompt));
  };

  const updateSuggestions = () => setSuggestions(getRandomSuggestions());

  const handleSubmit = () => {
    // Not logged in: always allow click → parent will open auth modal
    if (!isLoggedIn) { onSubmit(input); return; }
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
            placeholder="试试：帮我把这瓶香水放在落日海滩上，要有高级感和自然环境光"
            rows={5}
            className="min-h-[180px] rounded-ios-2xl border-0 bg-[rgba(0,0,0,0.04)] px-5 py-4 pb-8 text-ios-body text-[rgba(0,0,0,0.85)] placeholder:text-[rgba(0,0,0,0.24)] focus:bg-[rgba(0,122,255,0.04)] focus:ring-2 focus:ring-[rgba(0,122,255,0.20)] resize-none transition-all duration-200 [background-image:none]"
          />
          <p className="pointer-events-none absolute bottom-3 right-4 select-none text-ios-caption2 text-[rgba(0,0,0,0.22)]">
            Enter 发送 · Shift+Enter 换行
          </p>
        </div>

        {/* ── Divider ── */}
        <div className="lg-divider" />

        {/* ── Settings row: 畫質 + 風格 ── */}
        <div className="grid gap-3 md:hidden">
          <div className="flex items-center gap-3">
            <span className="w-12 shrink-0 text-ios-caption1 font-semibold uppercase tracking-widest text-[rgba(0,0,0,0.30)]">
              画质
            </span>
            <div className="relative min-w-0 flex-1">
              <select
                value={mode}
                onChange={(e) => onModeChange(e.target.value as ModelMode)}
                className="appearance-none w-full cursor-pointer rounded-full bg-[rgba(0,0,0,0.05)] py-1.5 pl-3.5 pr-8 text-ios-footnote font-medium text-[rgba(0,0,0,0.72)] lg-transition hover:bg-[rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,122,255,0.20)]"
              >
                {MODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[rgba(0,0,0,0.36)]" aria-hidden="true" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-12 shrink-0 text-ios-caption1 font-semibold uppercase tracking-widest text-[rgba(0,0,0,0.30)]">
              风格
            </span>
            <div className="relative min-w-0 flex-1">
              <select
                value={stylePreset}
                onChange={(e) => onStyleChange(e.target.value as StylePreset)}
                className="appearance-none w-full cursor-pointer rounded-full bg-[rgba(0,0,0,0.05)] py-1.5 pl-3.5 pr-8 text-ios-footnote font-medium text-[rgba(0,0,0,0.72)] lg-transition hover:bg-[rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,122,255,0.20)]"
              >
                {STYLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[rgba(0,0,0,0.36)]" aria-hidden="true" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-12 shrink-0 text-ios-caption1 font-semibold uppercase tracking-widest text-[rgba(0,0,0,0.30)]">
              示例
            </span>
            <div className="relative min-w-0 flex-1">
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleSuggestionSelect(e.target.value);
                    e.currentTarget.value = "";
                  }
                }}
                className="appearance-none w-full cursor-pointer rounded-full bg-[rgba(0,0,0,0.05)] py-1.5 pl-3.5 pr-8 text-ios-footnote font-medium text-[rgba(0,0,0,0.72)] lg-transition hover:bg-[rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,122,255,0.20)]"
              >
                <option value="">选择示例</option>
                {suggestions.map((suggestion) => (
                  <option key={suggestion.text} value={suggestion.prompt}>
                    {suggestion.text}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[rgba(0,0,0,0.36)]" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="hidden flex-wrap items-center gap-x-4 gap-y-3 md:flex">

          {/* 畫質 dropdown */}
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-ios-caption1 font-semibold uppercase tracking-widest text-[rgba(0,0,0,0.30)]">
              画质
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
          <div className="hidden flex-wrap items-center gap-x-2 gap-y-2 md:flex">
            <span className="shrink-0 text-ios-caption1 font-semibold uppercase tracking-widest text-[rgba(0,0,0,0.30)]">
              风格
            </span>
            <div className="flex flex-wrap gap-1.5">
              <StylePresets value={stylePreset} onChange={onStyleChange} inline />
            </div>
          </div>

        </div>

        {/* ── Divider ── */}
        <div className="lg-divider" />

        {/* ── Desktop suggestions + submit ── */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="hidden flex-wrap items-center gap-x-2 gap-y-2 md:flex">
            <span className="shrink-0 text-ios-caption1 font-semibold uppercase tracking-widest text-[rgba(0,0,0,0.30)]">
              示例
            </span>
            <button
              type="button"
              onClick={updateSuggestions}
              className="lg-float flex h-6 w-6 items-center justify-center rounded-full text-[rgba(0,0,0,0.36)] lg-transition hover:text-[rgba(0,0,0,0.64)] cursor-pointer"
              aria-label="换一批示例"
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
            disabled={isLoading || (isLoggedIn && !input.trim())}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-ios-xl bg-[#007AFF] px-6 py-3 text-ios-body font-semibold text-white shadow-[0_6px_24px_rgba(0,122,255,0.40),0_2px_8px_rgba(0,122,255,0.24)] transition-all duration-200 hover:bg-[#0066DD] hover:shadow-[0_10px_32px_rgba(0,122,255,0.52),0_4px_12px_rgba(0,122,255,0.30)] hover:scale-[1.025] active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-[rgba(0,0,0,0.16)] disabled:shadow-none disabled:scale-100 cursor-pointer"
          >
            {isLoading ? (
              <><Spinner className="h-4 w-4 text-white" />正在出图</>
            ) : (
              <>开始做图<ArrowUpRight className="h-4 w-4" /></>
            )}
          </button>
        </div>

      </div>
    </section>
  );
}
