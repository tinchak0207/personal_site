"use client";

import { useState } from "react";
import { ModelSelect } from "@/components/ModelSelect";
import { PromptInput } from "@/components/PromptInput";
import { useImageGeneration } from "@/hooks/use-image-generation";
import {
  MODEL_CONFIGS,
  PROVIDERS,
  ProviderKey,
  type ModelMode,
} from "@/lib/provider-config";
import { cn } from "@/lib/utils";
import type { Suggestion } from "@/lib/suggestions";

const modeMeta: Record<ModelMode, { label: string }> = {
  fast: {
    label: "快速出圖",
  },
  quality: {
    label: "高質感",
  },
};

export function ImagePlayground({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  const {
    images,
    timings,
    failedProviders,
    isLoading,
    startGeneration,
  } = useImageGeneration();

  const [mode, setMode] = useState<ModelMode>("fast");
  const [selectedModels, setSelectedModels] = useState(MODEL_CONFIGS.fast);

  const providerToModel = {
    image_tinchak: selectedModels.image_tinchak,
  };

  const handleModeChange = (newMode: ModelMode) => {
    setMode(newMode);
    setSelectedModels(MODEL_CONFIGS[newMode]);
  };

  const handlePromptSubmit = (newPrompt: string) => {
    startGeneration(newPrompt, ["image_tinchak"], providerToModel);
  };

  const models = (Object.keys(PROVIDERS) as ProviderKey[]).map((key) => {
    const provider = PROVIDERS[key];
    const imageItem = images.find((img) => img.provider === key);

    return {
      label: provider.displayName,
      models: provider.models,
      value: selectedModels[key],
      providerKey: key,
      onChange: (model: string, currentProviderKey: ProviderKey) =>
        setSelectedModels((current) => ({
          ...current,
          [currentProviderKey]: model,
        })),
      iconPath: provider.iconPath,
      color: provider.color,
      image: imageItem?.image,
      modelId: imageItem?.modelId ?? selectedModels[key],
      timing: timings[key],
      failed: failedProviders.includes(key),
    };
  });

  const renderState = isLoading
    ? "生成中"
    : failedProviders.length > 0
      ? "需要重試"
      : images.some((image) => image.image)
        ? "已完成"
        : "待命";

  return (
    <div className="min-h-screen bg-background px-4 pb-32 pt-6 sm:px-6 sm:pb-36 lg:px-8">
      <div className="mx-auto w-full max-w-[1660px] space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.98fr)_minmax(430px,0.82fr)]">
          <PromptInput
            onSubmit={handlePromptSubmit}
            isLoading={isLoading}
            suggestions={suggestions}
          />

          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between px-1">
              <p className="text-sm font-medium text-[#6f7987]">結果</p>
              <div className="paper-float inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm text-[#6f7987]">
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    isLoading
                      ? "bg-[#7f9a83]"
                      : failedProviders.length > 0
                        ? "bg-[#ba877d]"
                        : "bg-[#95a9a1]",
                  )}
                />
                {renderState}
              </div>
            </div>

            {models.map((props) => (
              <ModelSelect key={props.label} {...props} />
            ))}
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 sm:bottom-6">
        <div className="pointer-events-auto zen-dock flex w-full max-w-[640px] items-center justify-between gap-3 rounded-[2rem] px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2 overflow-x-auto">
            {(["fast", "quality"] as const).map((option) => {
              const isActive = mode === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleModeChange(option)}
                  className={cn(
                    "rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "ink-wash text-foreground shadow-[0_10px_24px_rgba(89,103,122,0.08)]"
                      : "text-[#6f7987] hover:bg-white/42",
                  )}
                >
                  {modeMeta[option].label}
                </button>
              );
            })}
          </div>

          <div className="rounded-full bg-[#2d3142]/[0.04] px-4 py-2 text-sm text-[#6f7987]">
            {renderState}
          </div>
        </div>
      </div>
    </div>
  );
}
