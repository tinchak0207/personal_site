"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { ModelSelect } from "@/components/ModelSelect";
import { PromptInput } from "@/components/PromptInput";
import { CaseShowcase } from "@/components/CaseShowcase";
import { AuthModal } from "@/components/AuthModal";
import {
  FALLBACK_PROGRESS_DURATION_MS,
  NORMAL_PROGRESS_DURATION_MS,
} from "@/components/GenerationProgressBar";
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
import type { ReferenceImage } from "@/lib/image-types";
import type { ProfessionalRunConfig } from "@/components/pro-workstation/InvokeInspiredWorkstation";

const InvokeInspiredWorkstation = dynamic(() => import("@/components/pro-workstation/InvokeInspiredWorkstation").then((mod) => mod.InvokeInspiredWorkstation), {
  ssr: false,
  loading: () => <div className="lg-card rounded-ios-4xl p-5 text-ios-footnote text-[rgba(0,0,0,0.46)]">加载专业工作站...</div>,
});

const ReferenceImageUpload = dynamic(() => import("@/components/ReferenceImageUpload").then((mod) => mod.ReferenceImageUpload), {
  ssr: false,
  loading: () => <div className="rounded-ios-2xl bg-white/38 px-4 py-3 text-ios-footnote text-[rgba(0,0,0,0.42)]">加载参考图上传...</div>,
});

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
  const [showProfessionalMode, setShowProfessionalMode] = useState(false);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [progressStartedAt, setProgressStartedAt] = useState<number>();
  const [progressDurationMs, setProgressDurationMs] = useState(NORMAL_PROGRESS_DURATION_MS);
  const [showProgress, setShowProgress] = useState(false);

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
    setProgressStartedAt(Date.now());
    setProgressDurationMs(NORMAL_PROGRESS_DURATION_MS);
    setShowProgress(true);
    await startGeneration(finalPrompt, ["image_tinchak"], { image_tinchak: selectedModels.image_tinchak }, { referenceImages });
    if (!LOCAL_TEST_MODE) {
      refresh().catch(() => {});
    }
  }, [isLoggedIn, user, stylePreset, selectedModels, startGeneration, toast, refresh, referenceImages]);

  const handleProfessionalRun = useCallback(async (config: ProfessionalRunConfig) => {
    if (!LOCAL_TEST_MODE && (!isLoggedIn || !user)) {
      setAuthOpen(true);
      return;
    }
    if (!LOCAL_TEST_MODE && user && !hasEnoughQuota(user)) {
      toast({ title: "余额不足", description: "请先充值再继续做图", variant: "destructive" });
      return;
    }
    const finalPrompt = enhancePrompt(config.prompt, stylePreset);
    setProgressStartedAt(Date.now());
    setProgressDurationMs(NORMAL_PROGRESS_DURATION_MS);
    setShowProgress(true);
    await startGeneration(finalPrompt, ["image_tinchak"], { image_tinchak: selectedModels.image_tinchak }, {
      referenceImages,
      contextPrompt: config.contextPrompt,
      negativePrompt: config.negativePrompt,
      negativeHint: config.negativeHint,
      workflowPreset: config.workflowPreset,
      workflowPresetLabel: config.workflowPresetLabel,
      promptHint: config.promptHint,
      estimatedCredits: config.estimatedCredits,
      referenceImageRoles: config.referenceImageRoles,
      copies: config.copies,
      concurrency: config.concurrency,
    });
    if (!LOCAL_TEST_MODE) {
      refresh().catch(() => {});
    }
  }, [isLoggedIn, user, stylePreset, selectedModels, startGeneration, toast, refresh, referenceImages]);

  const usedFallback = images.some((image) =>
    image.endpointLabel === "fallback" && (image.image || image.imageUrl),
  );

  useEffect(() => {
    if (usedFallback) setProgressDurationMs(FALLBACK_PROGRESS_DURATION_MS);
  }, [usedFallback]);

  useEffect(() => {
    if (failedProviders.length > 0) {
      setShowProgress(false);
      return;
    }
    if (!showProgress || !progressStartedAt || isLoading) return;
    const elapsed = Date.now() - progressStartedAt;
    const remaining = Math.max(0, progressDurationMs - elapsed);
    const timer = window.setTimeout(() => setShowProgress(false), remaining + 450);
    return () => window.clearTimeout(timer);
  }, [failedProviders.length, isLoading, progressDurationMs, progressStartedAt, showProgress]);

  const revealGeneratedResult = !showProgress;
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
      image: revealGeneratedResult ? imageItem?.image : null,
      imageUrl: revealGeneratedResult ? imageItem?.imageUrl : null,
      modelId: imageItem?.modelId ?? selectedModels[key],
      timing: showProgress
        ? { startTime: progressStartedAt ?? Date.now(), durationMs: progressDurationMs }
        : timings[key],
      failed: revealGeneratedResult && failedProviders.includes(key),
    };
  });

  const renderState = isLoading
    ? "处理中"
    : failedProviders.length > 0
      ? "需要重试"
      : images.some((i) => i.image || i.imageUrl)
        ? "已完成"
        : "当前可用";

  return (
    <>
      <div className="min-h-screen bg-transparent px-4 pb-28 pt-20 sm:px-6 sm:pb-32 lg:px-8">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => setShowProfessionalMode((current) => !current)}
              className="hidden md:inline-flex items-center gap-2 rounded-full bg-white/56 px-4 py-2 text-ios-footnote font-semibold text-[rgba(0,0,0,0.62)] shadow-[0_10px_30px_rgba(45,49,66,0.06)] backdrop-blur-[28px] transition-all hover:bg-white/72"
            >
              {showProfessionalMode ? "普通模式" : "专业模式"}
            </button>
          </div>

          {showProfessionalMode ? (
            <InvokeInspiredWorkstation
              suggestions={initialSuggestions}
              referenceImages={referenceImages}
              onReferenceImagesChange={setReferenceImages}
              images={images}
              isLoading={isLoading}
              onRun={handleProfessionalRun}
            />
          ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(380px,460px)]">
            <div className="space-y-3">
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
              <section className="lg-card rounded-ios-3xl p-4 sm:p-5">
                <ReferenceImageUpload value={referenceImages} onChange={setReferenceImages} />
              </section>
            </div>

            <div className="space-y-3">
              {models.map((props) => (
                <ModelSelect key={props.label} {...props} />
              ))}
            </div>
          </div>
          )}
        </div>
      </div>

      <CaseShowcase onUsePrompt={handleUseCasePrompt} />

      {(!showProgress && (isLoading || failedProviders.length > 0)) && (
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
