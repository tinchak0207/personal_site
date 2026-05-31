"use client";

import { useState, useCallback, useMemo } from "react";
import { ModelSelect } from "@/components/ModelSelect";
import { PromptInput } from "@/components/PromptInput";
import { AuthModal } from "@/components/AuthModal";
import { useImageGeneration } from "@/hooks/use-image-generation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  MODEL_CONFIGS,
  PROVIDERS,
  ProviderKey,
  type ModelMode,
} from "@/lib/provider-config";
import { enhancePrompt, type StylePreset } from "@/lib/prompt-enhancer";
import { hasEnoughQuota } from "@/lib/new-api-client";
import { cn } from "@/lib/utils";
import type { Suggestion } from "@/lib/suggestions";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ImagePlayground({ suggestions }: { suggestions: Suggestion[] }) {
  const { images, timings, failedProviders, isLoading, startGeneration } = useImageGeneration();
  const { user, isLoggedIn, refresh } = useAuth();
  const { toast } = useToast();

  // Shuffle on client only — avoids SSR/hydration mismatch
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shuffledSuggestions = useMemo(() => shuffleArray(suggestions), []);
  const [mode, setMode] = useState<ModelMode>("fast");
  const [selectedModels, setSelectedModels] = useState(MODEL_CONFIGS.fast);
  const [stylePreset, setStylePreset] = useState<StylePreset>("none");
  const [authOpen, setAuthOpen] = useState(false);

  const handleModeChange = (newMode: ModelMode) => {
    setMode(newMode);
    setSelectedModels(MODEL_CONFIGS[newMode]);
  };

  const handlePromptSubmit = useCallback(async (rawPrompt: string) => {
    if (!isLoggedIn || !user) { setAuthOpen(true); return; }
    if (!hasEnoughQuota(user)) {
      toast({ title: "硬幣不足", description: "請前往充值後繼續生圖", variant: "destructive" });
      return;
    }
    const finalPrompt = enhancePrompt(rawPrompt, stylePreset);
    startGeneration(finalPrompt, ["image_tinchak"], { image_tinchak: selectedModels.image_tinchak });
    setTimeout(() => { refresh().catch(() => {}); }, 3000);
  }, [isLoggedIn, user, stylePreset, selectedModels, startGeneration, toast, refresh]);

  const models = (Object.keys(PROVIDERS) as ProviderKey[]).map((key) => {
    const provider = PROVIDERS[key];
    const imageItem = images.find((img) => img.provider === key);
    return {
      label: provider.displayName,
      models: provider.models,
      value: selectedModels[key],
      providerKey: key,
      onChange: (model: string, k: ProviderKey) =>
        setSelectedModels((cur) => ({ ...cur, [k]: model })),
      iconPath: provider.iconPath,
      color: provider.color,
      image: imageItem?.image,
      modelId: imageItem?.modelId ?? selectedModels[key],
      timing: timings[key],
      failed: failedProviders.includes(key),
    };
  });

  const renderState = isLoading ? "生成中"
    : failedProviders.length > 0 ? "需要重試"
    : images.some((i) => i.image) ? "已完成"
    : "目前可用";

  return (
    <>
      <div className="min-h-screen bg-transparent px-4 pb-28 pt-20 sm:px-6 sm:pb-32 lg:px-8">
        <div className="mx-auto w-full max-w-[1440px]">

          {/* ── Two-column grid ── */}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(380px,460px)]">

            {/* Left: all settings + prompt in one card */}
            <PromptInput
              onSubmit={handlePromptSubmit}
              isLoading={isLoading}
              suggestions={shuffledSuggestions}
              stylePreset={stylePreset}
              onStyleChange={setStylePreset}
              mode={mode}
              onModeChange={handleModeChange}
            />

            {/* Right: model select + result */}
            <div className="space-y-3">
              {models.map((props) => (
                <ModelSelect key={props.label} {...props} />
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Bottom dock — only show when actively generating or failed */}
      {(isLoading || failedProviders.length > 0) && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 sm:bottom-6">
          <div className="pointer-events-auto lg-bar flex items-center gap-3 rounded-ios-4xl px-5 py-2.5">
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              isLoading ? "bg-[#34C759] animate-pulse" : "bg-[#FF3B30]"
            )} />
            <span className="text-ios-footnote text-[rgba(0,0,0,0.44)]">{renderState}</span>
          </div>
        </div>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultTab="login" />
    </>
  );
}
