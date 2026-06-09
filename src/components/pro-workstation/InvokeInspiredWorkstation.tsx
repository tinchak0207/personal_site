"use client";

import { useEffect, useRef, useState } from "react";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useHotkeys } from "react-hotkeys-hook";
import { Virtuoso } from "react-virtuoso";
import { Bot, Braces, Clipboard, FileJson, Gauge, Images, Layers3, Library, Play, RotateCcw, SlidersHorizontal, Sparkles } from "lucide-react";
import { ReferenceImageUpload } from "@/components/ReferenceImageUpload";
import type { ImageResult, ReferenceImage, ReferenceImageRole } from "@/lib/image-types";
import type { Suggestion } from "@/lib/suggestions";
import { cn } from "@/lib/utils";
import { WORKFLOW_SCHEMA_VERSION } from "@/lib/generation-workflow";
import { parseWorkflowRecallConfig } from "@/lib/workflow-recall";
import { WORKSTATION_SOURCES } from "./workstation-sources";

export const INVOKE_AI_WORKSTATION_SOURCE = {
  ...WORKSTATION_SOURCES[0],
  patterns: WORKSTATION_SOURCES[0].capabilities,
};

interface WorkstationPreset {
  id: string;
  label: string;
  note: string;
  promptHint: string;
  negativeHint: string;
  defaultRole: ReferenceImageRole;
  estimatedCredits: number;
}

export const WORKFLOW_PRESETS: WorkstationPreset[] = [
  {
    id: "product-shot",
    label: "商品主图",
    note: "产品清晰、标签可读、背景干净",
    promptHint: "premium ecommerce product hero, clean studio lighting, readable packaging label, realistic shadows",
    negativeHint: "distorted label, broken logo, watermark, low resolution, cluttered background",
    defaultRole: "product",
    estimatedCredits: 2,
  },
  {
    id: "character-consistency",
    label: "角色一致",
    note: "保留人物身份、服装和面部特征",
    promptHint: "consistent character identity, same face structure, same outfit details, production still quality",
    negativeHint: "face drift, asymmetrical eyes, different clothing, extra fingers, plastic skin",
    defaultRole: "character",
    estimatedCredits: 3,
  },
  {
    id: "poster-variants",
    label: "海报变体",
    note: "适合批量出封面、banner 和社媒图",
    promptHint: "campaign key visual, strong focal point, clean copy space, premium layout, variant-ready composition",
    negativeHint: "busy composition, unreadable text, poor hierarchy, muddy contrast",
    defaultRole: "composition",
    estimatedCredits: 4,
  },
  {
    id: "style-transfer",
    label: "风格迁移",
    note: "把参考图风格转移到新构图",
    promptHint: "preserve the reference image style language, color grading, lighting rhythm, material texture",
    negativeHint: "style mismatch, overprocessed texture, low fidelity, noisy artifacts",
    defaultRole: "style",
    estimatedCredits: 2,
  },
];

export const REFERENCE_IMAGE_ROLES: Array<{ id: ReferenceImageRole; label: string }> = [
  { id: "general", label: "通用" },
  { id: "style", label: "风格" },
  { id: "character", label: "角色" },
  { id: "composition", label: "构图" },
  { id: "product", label: "产品" },
  { id: "face", label: "脸部" },
];

const WORKFLOW_PLAN_STEPS = [
  "Prompt",
  "Context Merge",
  "Reference Images",
  "Image Edits/Generation",
  "Fallback",
  "History",
];

export interface ProfessionalRunConfig {
  prompt: string;
  contextPrompt: string;
  negativePrompt: string;
  negativeHint: string;
  workflowPreset: string;
  workflowPresetLabel: string;
  promptHint: string;
  estimatedCredits: number;
  referenceImageRoles: Record<string, ReferenceImageRole>;
  copies: number;
  concurrency: number;
}

interface InvokeInspiredWorkstationProps {
  suggestions: Suggestion[];
  referenceImages: ReferenceImage[];
  onReferenceImagesChange: (images: ReferenceImage[]) => void;
  images: ImageResult[];
  isLoading: boolean;
  onRun: (config: ProfessionalRunConfig) => void;
}

function DraggableReferenceTile({
  image,
  onRoleChange,
}: {
  image: ReferenceImage;
  onRoleChange: (id: string, role: ReferenceImageRole) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return draggable({
      element,
      getInitialData() {
        return { type: "reference_image", id: image.id, name: image.name, role: image.role ?? "general" };
      },
    });
  }, [image.id, image.name, image.role]);

  return (
    <div ref={ref} className="group relative aspect-square overflow-hidden rounded-ios-xl bg-white/46 shadow-[0_10px_26px_rgba(45,49,66,0.08)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.previewUrl} alt={image.name} className="h-full w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/58 to-transparent p-2">
        <p className="truncate text-[10px] font-semibold text-white">{image.name}</p>
        <select
          value={image.role ?? "general"}
          onChange={(event) => onRoleChange(image.id, event.target.value as ReferenceImageRole)}
          className="mt-1 w-full rounded-md border-0 bg-white/82 px-1.5 py-1 text-[10px] font-semibold text-black/70 outline-none"
          aria-label={`${image.name} role`}
        >
          {REFERENCE_IMAGE_ROLES.map((role) => (
            <option key={role.id} value={role.id}>{role.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function InvokeInspiredWorkstation({
  suggestions,
  referenceImages,
  onReferenceImagesChange,
  images,
  isLoading,
  onRun,
}: InvokeInspiredWorkstationProps) {
  const [prompt, setPrompt] = useState("");
  const [contextPrompt, setContextPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [workflowPreset, setWorkflowPreset] = useState(WORKFLOW_PRESETS[0].id);
  const [copies, setCopies] = useState(2);
  const [concurrency, setConcurrency] = useState(2);
  const [restoreConfigText, setRestoreConfigText] = useState("");
  const [restoreConfigMessage, setRestoreConfigMessage] = useState("");
  const activePreset = WORKFLOW_PRESETS.find((preset) => preset.id === workflowPreset) ?? WORKFLOW_PRESETS[0];
  const completedSlots = images.filter((image) => image.image || image.imageUrl).length;
  const failedSlots = images.filter((image) => !isLoading && image.image === null && image.imageUrl === null).length;
  const fallbackSlots = images.filter((image) => image.endpointLabel === "fallback").length;
  const runningSlots = isLoading ? Math.max(0, copies - completedSlots - failedSlots) : 0;
  const estimatedCredits = Math.max(copies, activePreset.estimatedCredits);
  const promptStats = {
    chars: prompt.trim().length,
    estimatedTokens: Math.ceil(prompt.trim().length / 4),
    state: prompt.trim().length > 1200 ? "过长" : prompt.trim().length > 600 ? "充实" : "精简",
  };
  const slotItems = Array.from({ length: copies }, (_, index) => {
    const image = images[index];
    const hasResult = !!(image?.image || image?.imageUrl);
    const isFailed = !!image && !isLoading && !hasResult;
    const state = hasResult
      ? "done"
      : isFailed
        ? "failed"
        : isLoading && index < Math.min(copies, completedSlots + failedSlots + concurrency)
          ? "running"
          : "queued";
    return {
      id: image?.slotId ?? `slot-${index + 1}`,
      label: `Slot ${index + 1}`,
      state,
      detail: image?.endpointLabel ?? image?.modelId ?? "waiting",
    };
  });

  const canRun = prompt.trim().length > 0 && !isLoading;
  const appendUniqueText = (current: string, next: string) => {
    const currentText = current.trim();
    if (!next.trim()) return current;
    if (currentText.includes(next.trim())) return current;
    return currentText ? `${currentText}\n${next.trim()}` : next.trim();
  };

  const applyWorkflowPreset = (preset: WorkstationPreset) => {
    setWorkflowPreset(preset.id);
    setPrompt((current) => appendUniqueText(current, preset.promptHint));
    setNegativePrompt((current) => appendUniqueText(current, preset.negativeHint));
    onReferenceImagesChange(referenceImages.map((image) => ({ ...image, role: image.role ?? preset.defaultRole })));
  };

  const run = () => {
    if (!canRun) return;
    onRun({
      prompt: prompt.trim(),
      contextPrompt,
      negativePrompt,
      negativeHint: activePreset.negativeHint,
      workflowPreset,
      workflowPresetLabel: activePreset.label,
      promptHint: activePreset.promptHint,
      estimatedCredits,
      referenceImageRoles: Object.fromEntries(
        referenceImages.map((image) => [image.id, image.role ?? "general"]),
      ) as Record<string, ReferenceImageRole>,
      copies,
      concurrency,
    });
  };

  const updateReferenceRole = (id: string, role: ReferenceImageRole) => {
    onReferenceImagesChange(referenceImages.map((image) => image.id === id ? { ...image, role } : image));
  };

  const copyProvenanceConfig = async (image?: ImageResult) => {
    const config = {
      schemaVersion: WORKFLOW_SCHEMA_VERSION,
      prompt: prompt.trim(),
      contextPrompt: contextPrompt.trim(),
      negativePrompt: negativePrompt.trim(),
      workflowPreset,
      workflowPresetLabel: activePreset.label,
      promptHint: activePreset.promptHint,
      negativeHint: activePreset.negativeHint,
      copies,
      concurrency,
      modelId: image?.modelId,
      endpointLabel: image?.endpointLabel,
      referenceImages: referenceImages.map((ref) => ({
        name: ref.name,
        role: ref.role ?? activePreset.defaultRole,
        size: ref.size,
      })),
    };
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
  };

  const restoreProvenanceConfig = () => {
    const result = parseWorkflowRecallConfig(restoreConfigText);
    if (!result.ok) {
      setRestoreConfigMessage(result.error);
      return;
    }

    const { config } = result;
    if (config.prompt !== undefined) setPrompt(config.prompt);
    if (config.contextPrompt !== undefined) setContextPrompt(config.contextPrompt);
    if (config.negativePrompt !== undefined) setNegativePrompt(config.negativePrompt);
    if (config.workflowPreset && WORKFLOW_PRESETS.some((preset) => preset.id === config.workflowPreset)) {
      setWorkflowPreset(config.workflowPreset);
    }
    if (config.copies) setCopies(config.copies);
    if (config.concurrency) setConcurrency(config.concurrency);
    if (config.referenceImageRolesByName) {
      onReferenceImagesChange(referenceImages.map((image) => {
        const role = config.referenceImageRolesByName?.[image.name];
        return role ? { ...image, role } : image;
      }));
    }
    setRestoreConfigMessage("配置已导入");
  };

  useHotkeys("mod+enter", run, { enableOnFormTags: true }, [
    canRun,
    prompt,
    contextPrompt,
    negativePrompt,
    workflowPreset,
    referenceImages,
    estimatedCredits,
    copies,
    concurrency,
  ]);

  return (
    <section className="pro-workstation-shell">
      <div className="pro-workstation-toolbar">
        <div className="min-w-0">
          <p className="text-ios-caption1 font-semibold uppercase text-[rgba(0,0,0,0.34)]">InvokeAI GitHub 母版</p>
          <h2 className="truncate text-ios-title2 font-bold text-[rgba(0,0,0,0.84)]">专业生图工作站</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/48 px-3 py-1.5 text-ios-caption1 font-semibold text-[rgba(0,0,0,0.42)]">schema v{WORKFLOW_SCHEMA_VERSION}</span>
          <span className="rounded-full bg-white/56 px-3 py-1.5 text-ios-caption1 font-semibold text-[rgba(0,0,0,0.50)]">⌘ Enter</span>
          <button
            type="button"
            onClick={run}
            disabled={!canRun}
            className="inline-flex items-center gap-2 rounded-ios-xl bg-[#007AFF] px-4 py-2.5 text-ios-footnote font-semibold text-white shadow-[0_8px_26px_rgba(0,122,255,0.38)] transition-all hover:bg-[#0066DD] disabled:bg-black/16 disabled:shadow-none"
          >
            <Play className="h-3.5 w-3.5" />
            运行队列
          </button>
        </div>
      </div>

      <div className="pro-workstation-grid">
        <aside className="pro-workstation-panel">
          <div className="pro-panel-title">
            <Library className="h-4 w-4" />
            Prompt Lab
          </div>
          <div className="grid grid-cols-2 gap-2">
            {WORKFLOW_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyWorkflowPreset(preset)}
                className={cn(
                  "rounded-ios-xl px-3 py-2 text-left text-[11px] font-semibold transition-all",
                  workflowPreset === preset.id
                    ? "bg-[#007AFF] text-white shadow-[0_8px_22px_rgba(0,122,255,0.24)]"
                    : "bg-white/40 text-black/58 hover:bg-white/62",
                )}
                title={preset.note}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="mt-2 rounded-ios-2xl bg-white/32 px-3 py-2 text-[11px] font-medium leading-relaxed text-[rgba(0,0,0,0.50)]">
            <Sparkles className="mr-1.5 inline h-3 w-3 text-[#007AFF]" />
            {activePreset.note}
          </div>

          <div className="pro-panel-title mt-4">
            <FileJson className="h-4 w-4" />
            配置召回
          </div>
          <textarea
            value={restoreConfigText}
            onChange={(event) => setRestoreConfigText(event.target.value)}
            placeholder="粘贴“复制配置”得到的 JSON，恢复 prompt、preset、队列参数和参考图角色..."
            className="min-h-[82px] w-full resize-none rounded-ios-2xl border-0 bg-white/38 px-3.5 py-3 text-[11px] text-[rgba(0,0,0,0.68)] outline-none ring-0 transition-all focus:bg-white/58 focus:ring-2 focus:ring-[rgba(0,122,255,0.16)]"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={restoreProvenanceConfig}
              className="inline-flex items-center gap-1.5 rounded-ios-xl bg-white/52 px-3 py-2 text-[11px] font-bold text-[rgba(0,0,0,0.58)] transition-colors hover:bg-white/74"
            >
              <FileJson className="h-3 w-3" />
              导入配置
            </button>
            {restoreConfigMessage && (
              <span className="truncate text-[11px] font-semibold text-[rgba(0,0,0,0.42)]">{restoreConfigMessage}</span>
            )}
          </div>

          <div className="pro-panel-title mt-4">
            <Braces className="h-4 w-4" />
            Context
          </div>
          <textarea
            value={contextPrompt}
            onChange={(event) => setContextPrompt(event.target.value)}
            placeholder="项目背景、角色一致性、品牌限制、约束..."
            className="min-h-[112px] w-full resize-none rounded-ios-2xl border-0 bg-white/38 px-3.5 py-3 text-ios-footnote text-[rgba(0,0,0,0.72)] outline-none ring-0 transition-all focus:bg-white/58 focus:ring-2 focus:ring-[rgba(0,122,255,0.16)]"
          />

          <div className="pro-panel-title mt-4">
            <Braces className="h-4 w-4" />
            Negative Prompt
          </div>
          <textarea
            value={negativePrompt}
            onChange={(event) => setNegativePrompt(event.target.value)}
            placeholder="不要畸形手、错字、水印、低清、破损标签..."
            className="min-h-[88px] w-full resize-none rounded-ios-2xl border-0 bg-white/38 px-3.5 py-3 text-ios-footnote text-[rgba(0,0,0,0.72)] outline-none ring-0 transition-all focus:bg-white/58 focus:ring-2 focus:ring-[rgba(0,122,255,0.16)]"
          />

          <div className="pro-panel-title mt-4">
            <Library className="h-4 w-4" />
            Prompt Library
          </div>
          <div className="h-[186px] overflow-hidden rounded-ios-2xl bg-white/36">
            <Virtuoso
              data={suggestions}
              itemContent={(_, item) => (
                <button
                  type="button"
                  onClick={() => setPrompt((current) => current ? `${current}\n${item.prompt}` : item.prompt)}
                  className="block w-full border-b border-white/46 px-3 py-2.5 text-left text-ios-footnote text-[rgba(0,0,0,0.62)] transition-colors hover:bg-white/52"
                >
                  <span className="font-semibold text-[rgba(0,0,0,0.72)]">{item.text}</span>
                  <span className="mt-1 line-clamp-2 block text-ios-caption1 text-[rgba(0,0,0,0.38)]">{item.prompt}</span>
                </button>
              )}
            />
          </div>
        </aside>

        <main className="pro-workstation-panel pro-canvas-panel">
          <div className="pro-panel-title">
            <Layers3 className="h-4 w-4" />
            Unified Canvas / Control Layers
          </div>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="描述要生成的图像，参考图会作为 edits 输入一起发送..."
            className="min-h-[172px] w-full resize-none rounded-ios-3xl border-0 bg-white/42 px-4 py-3.5 text-ios-body text-[rgba(0,0,0,0.78)] outline-none ring-0 transition-all focus:bg-white/64 focus:ring-2 focus:ring-[rgba(0,122,255,0.18)]"
          />
          <div className="pro-prompt-meter">
            <span>{promptStats.chars} chars</span>
            <span>Estimated tokens {promptStats.estimatedTokens}</span>
            <strong>{promptStats.state}</strong>
          </div>

          <div className="mt-4">
            <ReferenceImageUpload value={referenceImages} onChange={onReferenceImagesChange} compact />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {referenceImages.map((image) => (
              <DraggableReferenceTile key={image.id} image={image} onRoleChange={updateReferenceRole} />
            ))}
          </div>
        </main>

        <aside className="pro-workstation-panel">
          <div className="pro-panel-title">
            <SlidersHorizontal className="h-4 w-4" />
            Queue
          </div>
          <label className="pro-control-row">
            <span>并发</span>
            <input min={1} max={4} type="range" value={concurrency} onChange={(event) => setConcurrency(Number(event.target.value))} />
            <strong>{concurrency}</strong>
          </label>
          <label className="pro-control-row">
            <span>批量</span>
            <input min={1} max={8} type="range" value={copies} onChange={(event) => setCopies(Number(event.target.value))} />
            <strong>{copies}</strong>
          </label>
          <div className="mt-3 rounded-ios-2xl bg-white/38 px-3 py-2 text-ios-caption1 font-semibold text-[rgba(0,0,0,0.54)]">
            预计消耗 {estimatedCredits} 张
          </div>

          <div className="pro-panel-title mt-4">
            <Gauge className="h-4 w-4" />
            Queue Inspector
          </div>
          <div className="pro-metric-grid">
            <div className="pro-metric-card">
              <span>Slots</span>
              <strong>{copies}</strong>
            </div>
            <div className="pro-metric-card">
              <span>Running</span>
              <strong>{runningSlots}</strong>
            </div>
            <div className="pro-metric-card">
              <span>Done</span>
              <strong>{completedSlots}</strong>
            </div>
            <div className="pro-metric-card">
              <span>Failed</span>
              <strong>{failedSlots}</strong>
            </div>
          </div>
          <div className="pro-slot-list">
            {slotItems.map((slot) => (
              <div key={slot.id} className="pro-slot-row" data-slot-state={slot.state}>
                <span className="pro-slot-dot" />
                <span>{slot.label}</span>
                <strong>{slot.state}</strong>
                <em>{slot.detail}</em>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between rounded-ios-2xl bg-white/34 px-3 py-2 text-[11px] font-semibold text-[rgba(0,0,0,0.50)]">
            <span>Fallback used</span>
            <span className={cn("rounded-full px-2 py-0.5", fallbackSlots ? "bg-[#FF9500]/18 text-[#B45F00]" : "bg-[#34C759]/14 text-[#207A37]")}>
              {fallbackSlots}
            </span>
          </div>

          <div className="pro-panel-title mt-4">
            <Layers3 className="h-4 w-4" />
            Workflow Plan
          </div>
          <div className="space-y-1.5 rounded-ios-2xl bg-white/34 p-2.5">
            {WORKFLOW_PLAN_STEPS.map((step, index) => (
              <div key={step} className="flex items-center gap-2 text-[11px] font-semibold text-[rgba(0,0,0,0.54)]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/58 text-[10px] text-[rgba(0,122,255,0.78)]">
                  {index + 1}
                </span>
                <span className="truncate">{step}</span>
              </div>
            ))}
          </div>

          <div className="pro-panel-title mt-4">
            <Images className="h-4 w-4" />
            Board & Gallery Management / Provenance
          </div>
          <div className="grid max-h-[320px] grid-cols-2 gap-2 overflow-y-auto pr-1">
            {images.map((image, index) => (
              <div key={image.slotId ?? index} className="pro-provenance-card">
                <div className={cn("aspect-square overflow-hidden rounded-ios-xl bg-white/42", !image.image && !image.imageUrl && "flex items-center justify-center")}>
                  {image.image || image.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image.image ? `data:image/png;base64,${image.image}` : image.imageUrl ?? undefined} alt="生成结果" className="h-full w-full object-cover" />
                  ) : (
                    <Bot className="h-5 w-5 text-[rgba(0,0,0,0.28)]" />
                  )}
                </div>
                <div className="mt-2 space-y-1 text-[10px] font-semibold text-[rgba(0,0,0,0.46)]">
                  <div className="flex items-center gap-1">
                    <Clipboard className="h-3 w-3" />
                    <span className="truncate">Provenance</span>
                  </div>
                      <p className="truncate">{image.workflow?.workflowPresetLabel ?? activePreset.label}</p>
                      <p className="truncate">{image.endpointLabel ?? "queued"} · {image.modelId}</p>
                      <p className="truncate">{image.referenceImageNames?.join(", ") || "no refs"}</p>
                      <button
                        type="button"
                        onClick={() => copyProvenanceConfig(image)}
                        className="mt-1 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-white/46 px-2 py-1 text-[10px] font-bold text-[rgba(0,0,0,0.56)] transition-colors hover:bg-white/70"
                      >
                        <Clipboard className="h-3 w-3" />
                        复制配置
                      </button>
                    </div>
                  </div>
                ))}
          </div>
          {images.length === 0 && (
            <div className="mt-2 rounded-ios-2xl bg-white/34 px-3 py-3 text-[11px] font-medium leading-relaxed text-[rgba(0,0,0,0.46)]">
                  <RotateCcw className="mr-1.5 inline h-3 w-3" />
                  生成后这里会记录模型、端点、preset、参考图和可召回参数。
                  <button
                    type="button"
                    onClick={() => copyProvenanceConfig()}
                    className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-ios-xl bg-white/46 px-3 py-2 text-[11px] font-bold text-[rgba(0,0,0,0.56)] transition-colors hover:bg-white/70"
                  >
                    <Clipboard className="h-3 w-3" />
                    复制配置
                  </button>
                </div>
              )}
        </aside>
      </div>
    </section>
  );
}
