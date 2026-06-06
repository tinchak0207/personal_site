"use client";

import { useState, useCallback } from "react";
import { ModelSelect } from "@/components/ModelSelect";
import { PromptInput } from "@/components/PromptInput";
import { CaseShowcase } from "@/components/CaseShowcase";
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
import { LOCAL_TEST_MODE } from "@/lib/sub2api";
import { cn } from "@/lib/utils";
import { getInitialSuggestions, type Suggestion } from "@/lib/suggestions";

export function ImagePlayground({ suggestions }: { suggestions: Suggestion[] }) {
  const { images, timings, failedProviders, isLoading, startGeneration } = useImageGeneration();
  const { user, isLoggedIn, refresh } = useAuth();
  const { toast } = useToast();
  const initialSuggestions = getInitialSuggestions(suggestions);
  const [mode, setMode] = useState<ModelMode>("fast");
  const [selectedModels, setSelectedModels] = useState(MODEL_CONFIGS.fast);
  const [stylePreset, setStylePreset] = useState<StylePreset>("none");
  const [casePrompt, setCasePrompt] = useState("");
  const [authOpen, setAuthOpen] = useState(false);

  const handleModeChange = (newMode: ModelMode) => {
    setMode(newMode);
    setSelectedModels(MODEL_CONFIGS[newMode]);
  };

  const handleUseCasePrompt = (prompt: string, style: StylePreset) => {
    setCasePrompt(prompt);
    setStylePreset(style);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePromptSubmit = useCallback(async (rawPrompt: string) => {
    if (!LOCAL_TEST_MODE && (!isLoggedIn || !user)) {
      setAuthOpen(true);
      return;
    }
    if (!LOCAL_TEST_MODE && user && !hasEnoughQuota(user)) {
      toast({ title: "余额不足", description: "请先充值再继续做图", variant: "destructive" });
      return;
    }
    const finalPrompt = enhancePrompt(rawPrompt, stylePreset);
    startGeneration(finalPrompt, ["image_tinchak"], { image_tinchak: selectedModels.image_tinchak });
    if (!LOCAL_TEST_MODE) {
      setTimeout(() => {
        refresh().catch(() => {});
      }, 3000);
    }
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
      imageUrl: imageItem?.imageUrl,
      modelId: imageItem?.modelId ?? selectedModels[key],
      timing: timings[key],
      failed: failedProviders.includes(key),
    };
  });

  const renderState = isLoading
    ? "生成中"
    : failedProviders.length > 0
      ? "需要重试"
      : images.some((i) => i.image || i.imageUrl)
        ? "已完成"
        : "当前可用";

  return (
    <>
      <div className="min-h-screen bg-transparent px-4 pb-28 pt-20 sm:px-6 sm:pb-32 lg:px-8">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(380px,460px)]">
            <PromptInput
              onSubmit={handlePromptSubmit}
              isLoading={isLoading}
              isLoggedIn={LOCAL_TEST_MODE ? true : isLoggedIn}
              suggestions={initialSuggestions}
              stylePreset={stylePreset}
              onStyleChange={setStylePreset}
              mode={mode}
              onModeChange={handleModeChange}
              externalPrompt={casePrompt}
            />

            <div className="space-y-3">
              {models.map((props) => (
                <ModelSelect key={props.label} {...props} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <CaseShowcase onUsePrompt={handleUseCasePrompt} />

      {(isLoading || failedProviders.length > 0) && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 sm:bottom-6">
          <div className="pointer-events-auto lg-bar flex items-center gap-3 rounded-ios-4xl px-5 py-2.5">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isLoading ? "bg-[#34C759] animate-pulse" : "bg-[#FF3B30]",
              )}
            />
            <span className="text-ios-footnote text-[rgba(0,0,0,0.44)]">{renderState}</span>
          </div>
        </div>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultTab="login" />
    </>
  );
}
