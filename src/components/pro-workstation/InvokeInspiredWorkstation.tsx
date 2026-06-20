"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { Driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./workstation.css";
import {
  Bot,
  Braces,
  CircleHelp,
  Clipboard,
  Download,
  FileJson,
  FolderOpen,
  Gauge,
  ImagePlus,
  Images,
  Layers3,
  Library,
  Palette,
  Play,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Wand2,
} from "lucide-react";
import { MAX_REFERENCE_IMAGES, ReferenceImageUpload } from "@/components/ReferenceImageUpload";
import type { ImageResult, ReferenceImage, ReferenceImageRole } from "@/lib/image-types";
import type { PersistedGenerationEntry } from "@/lib/generation-cache";
import type { Suggestion } from "@/lib/suggestions";
import { cn } from "@/lib/utils";
import { WORKFLOW_SCHEMA_VERSION } from "@/lib/generation-workflow";
import { extractPromptSection, parseWorkflowRecallConfig } from "@/lib/workflow-recall";
import { AD_SIZE_OPTIONS, normalizeSizeSelection, sizeForSlot } from "@/lib/ad-formats";
import {
  type BoardFolder,
  type SavedShotMeta,
  createBoard,
  deleteBoard,
  deleteShot,
  ensureDefaultBoard,
  getShotBlob,
  listBoards,
  listShots,
  moveShot,
  saveShot,
  toggleShotStar,
} from "@/lib/boards-store";
import {
  type BrandKit,
  EMPTY_BRAND_KIT,
  buildBrandContext,
  clearBrandKit,
  hasBrandKit,
  loadBrandKit,
  saveBrandKit,
} from "@/lib/brand-kit";
import { exportShotsZip } from "@/lib/export-zip";
import { SCENARIO_TEMPLATES, type ScenarioTemplate } from "@/lib/scenario-templates";
import {
  STYLE_CATEGORIES,
  STYLE_LIBRARY,
  applyStyleToPrompt,
  getStyleById,
  mergeStyleNegative,
} from "@/lib/style-library";
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

type WorkspaceMode = "canvas" | "viewer";
type LeftPanelTab = "prompt" | "assets" | "settings";
type InspectorTab = "queue" | "gallery" | "history";
type CanvasTool = "select" | "annotate" | "erase";
type GalleryMode = "images" | "assets" | "boards";
type SlotState = "done" | "failed" | "running" | "queued";

interface RegionalPromptItem {
  id: string;
  text: string;
  weight: number;
  enabled: boolean;
}

export const WORKFLOW_PRESETS: WorkstationPreset[] = [
  {
    id: "product-shot",
    label: "商品主图",
    note: "产品清晰、标签可读、背景干净",
    promptHint: "高端电商商品主图，干净棚拍布光，包装文字清晰可读，真实阴影，背景简洁",
    negativeHint: "标签扭曲，商标破损，水印，低清晰度，背景杂乱",
    defaultRole: "product",
    estimatedCredits: 2,
  },
  {
    id: "character-consistency",
    label: "人物一致",
    note: "保留人物身份、服装和面部特征",
    promptHint: "保持同一角色身份，同一面部结构，同一服装细节，影视级静帧质感",
    negativeHint: "面部漂移，眼睛不对称，服装变化，多余手指，塑料皮肤",
    defaultRole: "character",
    estimatedCredits: 3,
  },
  {
    id: "poster-variants",
    label: "版式参考",
    note: "适合批量出封面、banner 和社媒图",
    promptHint: "活动主视觉，焦点明确，留有干净文案空间，高级版式，适合批量扩展变体",
    negativeHint: "构图拥挤，文字不可读，层级混乱，对比浑浊",
    defaultRole: "composition",
    estimatedCredits: 4,
  },
  {
    id: "style-transfer",
    label: "风格参考",
    note: "把参考图风格转移到新构图",
    promptHint: "保留参考图的风格语言、色彩分级、光影节奏和材质纹理",
    negativeHint: "风格不一致，纹理过度处理，低保真，噪点伪影",
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
  "整理描述",
  "合并信息",
  "设置尺寸",
  "处理参考图",
  "生成图片",
  "切换备用渠道",
  "保存历史",
];

const QUALITY_PROFILE_OPTIONS = [
  { id: "draft", label: "草稿" },
  { id: "balanced", label: "均衡" },
  { id: "print", label: "印刷" },
];

const PRODUCTION_INTENT_OPTIONS = [
  { id: "general", label: "通用" },
  { id: "ecommerce", label: "电商" },
  { id: "campaign", label: "活动" },
  { id: "character", label: "角色" },
  { id: "social", label: "社媒" },
];

const WORKSPACE_MODES: Array<{ id: WorkspaceMode; label: string; title: string }> = [
  { id: "canvas", label: "画布", title: "画布" },
  { id: "viewer", label: "成片墙", title: "成片墙" },
];

const CANVAS_TOOLS: Array<{ id: CanvasTool; label: string; hint: string }> = [
  { id: "select", label: "选择", hint: "选择成片或调整画布。" },
  { id: "annotate", label: "标注笔", hint: "在图上圈出要修改的区域。" },
  { id: "erase", label: "擦除", hint: "擦掉画错的标注。" },
];

const LEFT_PANEL_TABS: Array<{ id: LeftPanelTab; label: string; hint: string }> = [
  { id: "prompt", label: "提示词", hint: "描述画面，选择场景和风格。" },
  { id: "assets", label: "参考图", hint: "添加产品、人物或风格参考。" },
  { id: "settings", label: "参数", hint: "设置尺寸、数量和品牌信息。" },
];

const INSPECTOR_TABS: Array<{ id: InspectorTab; label: string; hint: string }> = [
  { id: "queue", label: "队列", hint: "查看生成进度，失败任务可重试。" },
  { id: "gallery", label: "图库", hint: "查看成片、参考图和文件夹。" },
  { id: "history", label: "历史", hint: "恢复最近用过的设置。" },
];

const SLOT_STATE_LABELS: Record<SlotState, string> = {
  done: "已完成",
  failed: "失败",
  running: "进行中",
  queued: "排队中",
};

const ENDPOINT_LABELS: Record<string, string> = {
  primary: "主渠道",
  fallback: "备用渠道",
  waiting: "等待调度",
};

const TOUR_STORAGE_KEY = "pro-workstation-tour-v2";
const ANNOTATION_CONTEXT_NOTE = "红色标注区域为需要重点修改的位置";

// base64 成片转 data URL 是多 MB 的字符串拼接，按 ImageResult 对象身份缓存，
// 避免每次 render 重新分配（对象随 GC 释放，无需手动清理）
const resultSrcCache = new WeakMap<ImageResult, string>();

function resultSrc(image: ImageResult): string | undefined {
  if (image.image) {
    let url = resultSrcCache.get(image);
    if (!url) {
      url = `data:image/png;base64,${image.image}`;
      resultSrcCache.set(image, url);
    }
    return url;
  }
  return image.imageUrl ?? undefined;
}

/** 始终调用最新闭包但保持引用稳定的事件回调（React.memo 子组件依赖此特性） */
function useEventCallback<Args extends unknown[], Result>(fn: (...args: Args) => Result) {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback((...args: Args) => ref.current(...args), []);
}

const ScenarioGrid = memo(function ScenarioGrid({
  activeId,
  onApply,
}: {
  activeId: string | null;
  onApply: (scenario: ScenarioTemplate) => void;
}) {
  return (
    <div className="pro-chip-grid">
      {SCENARIO_TEMPLATES.map((scenario) => (
        <button
          key={scenario.id}
          type="button"
          onClick={() => onApply(scenario)}
          className={cn(activeId === scenario.id && "is-active")}
          title={scenario.description}
        >
          {scenario.name}
        </button>
      ))}
    </div>
  );
});

const StyleGrid = memo(function StyleGrid({
  category,
  selectedId,
  onCategoryChange,
  onToggle,
}: {
  category: string;
  selectedId: string | null;
  onCategoryChange: (category: string) => void;
  onToggle: (id: string) => void;
}) {
  const styles = useMemo(() => STYLE_LIBRARY.filter((style) => style.category === category), [category]);
  return (
    <>
      <div className="pro-chip-row">
        {STYLE_CATEGORIES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onCategoryChange(item)}
            className={cn(category === item && "is-active")}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="pro-style-grid">
        {styles.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => onToggle(style.id)}
            className={cn(selectedId === style.id && "is-active")}
            title={style.prompt.replace("{prompt}", "…")}
          >
            {style.name}
          </button>
        ))}
      </div>
    </>
  );
});

const SuggestionList = memo(function SuggestionList({
  suggestions,
  onPick,
}: {
  suggestions: Suggestion[];
  onPick: (prompt: string) => void;
}) {
  // 词库仅个位数条目，原生滚动即可；引入虚拟列表（react-virtuoso ~25KB gz）属负优化
  return (
    <div className="h-[186px] overflow-y-auto rounded-ios-2xl bg-white/36">
      {suggestions.map((item, index) => (
        <button
          key={`${item.text}-${index}`}
          type="button"
          onClick={() => onPick(item.prompt)}
          className="block w-full border-b border-white/46 px-3 py-2.5 text-left text-ios-footnote text-[rgba(0,0,0,0.62)] transition-colors hover:bg-white/52"
        >
          <span className="font-semibold text-[rgba(0,0,0,0.72)]">{item.text}</span>
          <span className="mt-1 line-clamp-2 block text-ios-caption1 text-[rgba(0,0,0,0.38)]">{item.prompt}</span>
        </button>
      ))}
    </div>
  );
});

export interface ProfessionalRunConfig {
  prompt: string;
  contextPrompt: string;
  negativePrompt: string;
  negativeHint: string;
  workflowPreset: string;
  workflowPresetLabel: string;
  promptHint: string;
  productionIntent: string;
  imageSize: string;
  imageSizes: string[];
  styleTemplate?: string;
  qualityProfile: string;
  seedHint: string;
  regionalPrompts: Array<{ text: string; weight?: number }>;
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
  recentWorkflows: PersistedGenerationEntry[];
  onRun: (config: ProfessionalRunConfig) => void;
  onExitProfessionalMode?: () => void;
}

const DraggableReferenceTile = memo(function DraggableReferenceTile({
  image,
  onRoleChange,
  onStrengthChange,
}: {
  image: ReferenceImage;
  onRoleChange: (id: string, role: ReferenceImageRole) => void;
  onStrengthChange: (id: string, strength: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const imageRef = useRef(image);
  imageRef.current = image;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return draggable({
      element,
      getInitialData() {
        const current = imageRef.current;
        return { type: "reference_image", id: current.id, name: current.name, role: current.role ?? "general" };
      },
    });
  }, []);

  return (
    <div ref={ref} className="pro-reference-tile">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.previewUrl} alt={image.name} />
      <div className="pro-reference-tile-body">
        <p title={image.name}>{image.name}</p>
        <label>
          <span>用途</span>
          <select
            value={image.role ?? "general"}
            onChange={(event) => onRoleChange(image.id, event.target.value as ReferenceImageRole)}
            aria-label={`${image.name} 参考图用途`}
          >
            {REFERENCE_IMAGE_ROLES.map((role) => (
              <option key={role.id} value={role.id}>{role.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>强度</span>
          <input
            min={10}
            max={100}
            step={5}
            type="range"
            value={image.strength ?? 80}
            onChange={(event) => onStrengthChange(image.id, Number(event.target.value))}
            aria-label={`${image.name} 影响强度`}
          />
          <strong>{image.strength ?? 80}%</strong>
        </label>
      </div>
    </div>
  );
});

interface SlotItemView {
  id: string;
  label: string;
  state: SlotState;
  detail: string;
}

const QueueSlotList = memo(function QueueSlotList({ slots }: { slots: SlotItemView[] }) {
  return (
    <div className="pro-slot-list">
      {slots.map((slot) => (
        <div key={slot.id} className="pro-slot-row" data-slot-state={slot.state}>
          <span className="pro-slot-dot" />
          <span>{slot.label}</span>
          <strong>{SLOT_STATE_LABELS[slot.state]}</strong>
          <em>{slot.detail}</em>
        </div>
      ))}
    </div>
  );
});

const BoardsPanel = memo(function BoardsPanel({
  boards,
  shots,
  shotUrls,
  shotCounts,
  totalShots,
  activeBoardId,
  newBoardName,
  hasActiveBoard,
  onSelectBoard,
  onNameChange,
  onCreate,
  onDeleteActive,
  onExport,
  onMoveShot,
  onToggleStar,
  onDeleteShot,
  onDownload,
}: {
  boards: BoardFolder[];
  shots: SavedShotMeta[];
  shotUrls: Record<string, string>;
  shotCounts: ReadonlyMap<string, number>;
  totalShots: number;
  activeBoardId: string;
  newBoardName: string;
  hasActiveBoard: boolean;
  onSelectBoard: (id: string) => void;
  onNameChange: (name: string) => void;
  onCreate: () => void;
  onDeleteActive: () => void;
  onExport: () => void;
  onMoveShot: (id: string, boardId: string) => void;
  onToggleStar: (id: string) => void;
  onDeleteShot: (id: string) => void;
  onDownload: (shot: SavedShotMeta) => void;
}) {
  return (
    <div className="pro-boards">
      <div className="pro-board-chips">
        <button
          type="button"
          onClick={() => onSelectBoard("all")}
          className={cn(activeBoardId === "all" && "is-active")}
        >
          全部 {totalShots}
        </button>
        {boards.map((board) => (
          <button
            key={board.id}
            type="button"
            onClick={() => onSelectBoard(board.id)}
            className={cn(activeBoardId === board.id && "is-active")}
          >
            {board.name} {shotCounts.get(board.id) ?? 0}
          </button>
        ))}
      </div>
      <div className="pro-board-create">
        <input
          value={newBoardName}
          onChange={(event) => onNameChange(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") onCreate(); }}
          placeholder="新文件夹名称"
        />
        <button type="button" onClick={onCreate}>新建</button>
        <button type="button" onClick={onExport} disabled={!shots.length} title="导出当前文件夹的打包文件">
          <Download className="h-3 w-3" />
          导出打包文件
        </button>
        {hasActiveBoard && (
          <button type="button" onClick={onDeleteActive} title="删除当前文件夹及其中所有图片">
            删除文件夹
          </button>
        )}
      </div>
      <div className="pro-shot-grid">
        {shots.map((shot) => (
          <div key={shot.id} className="pro-shot-card">
            {shotUrls[shot.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shotUrls[shot.id]} alt={shot.name} />
            ) : (
              <div className="pro-shot-loading">正在载入</div>
            )}
            <div className="pro-shot-body">
              <p title={shot.name}>{shot.name}</p>
              <small>{[shot.presetLabel, shot.imageSize].filter(Boolean).join(" · ") || "成片"}</small>
              <div className="pro-shot-actions">
                <button
                  type="button"
                  onClick={() => onToggleStar(shot.id)}
                  className={cn(shot.starred && "is-active")}
                  title={shot.starred ? "取消入选" : "标为入选"}
                >
                  {shot.starred ? "★" : "☆"}
                </button>
                <select
                  value={shot.boardId}
                  onChange={(event) => onMoveShot(shot.id, event.target.value)}
                  aria-label="移动到文件夹"
                >
                  {boards.map((board) => (
                    <option key={board.id} value={board.id}>{board.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => onDownload(shot)} title="下载这张成片">
                  <Download className="h-3 w-3" />
                </button>
                <button type="button" onClick={() => onDeleteShot(shot.id)} title="从文件夹删除">
                  删
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!shots.length && (
        <p className="pro-boards-empty">
          文件夹为空。可在成片上选择“存入文件夹”。
        </p>
      )}
    </div>
  );
});

export function InvokeInspiredWorkstation({
  suggestions,
  referenceImages,
  onReferenceImagesChange,
  images,
  isLoading,
  recentWorkflows,
  onRun,
  onExitProfessionalMode,
}: InvokeInspiredWorkstationProps) {
  const [prompt, setPrompt] = useState("");
  const [contextPrompt, setContextPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [workflowPreset, setWorkflowPreset] = useState(WORKFLOW_PRESETS[0].id);
  const [productionIntent, setProductionIntent] = useState("general");
  const [imageSizes, setImageSizes] = useState<string[]>(["1024x1024"]);
  const [qualityProfile, setQualityProfile] = useState("balanced");
  const [styleTemplateId, setStyleTemplateId] = useState<string | null>(null);
  const [styleCategory, setStyleCategory] = useState(STYLE_CATEGORIES[0]);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [brandKit, setBrandKit] = useState<BrandKit>(EMPTY_BRAND_KIT);
  const [brandKitMessage, setBrandKitMessage] = useState("");
  const [boards, setBoards] = useState<BoardFolder[]>([]);
  const [shots, setShots] = useState<SavedShotMeta[]>([]);
  const [shotUrls, setShotUrls] = useState<Record<string, string>>({});
  const [activeBoardId, setActiveBoardId] = useState<string>("all");
  const [newBoardName, setNewBoardName] = useState("");
  const [seedHint, setSeedHint] = useState("");
  const [copies, setCopies] = useState(2);
  const [concurrency, setConcurrency] = useState(2);
  const [regionalPrompts, setRegionalPrompts] = useState<RegionalPromptItem[]>([]);
  const [restoreConfigText, setRestoreConfigText] = useState("");
  const [restoreConfigMessage, setRestoreConfigMessage] = useState("");
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("canvas");
  const [leftPanelTab, setLeftPanelTab] = useState<LeftPanelTab>("prompt");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("queue");
  const [activeCanvasTool, setActiveCanvasTool] = useState<CanvasTool>("select");
  const [galleryMode, setGalleryMode] = useState<GalleryMode>("images");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [canvasZoom, setCanvasZoom] = useState<"fit" | "actual">("fit");
  const [canvasNotice, setCanvasNotice] = useState("");
  const [hasAnnotation, setHasAnnotation] = useState(false);

  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const baseImageRef = useRef<HTMLImageElement>(null);
  const isDrawingRef = useRef(false);
  const hasAnnotationRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const shotUrlPendingRef = useRef<Set<string>>(new Set());
  const tourRef = useRef<Driver | null>(null);

  const activePreset = WORKFLOW_PRESETS.find((preset) => preset.id === workflowPreset) ?? WORKFLOW_PRESETS[0];
  const completedSlots = images.filter((image) => image.image || image.imageUrl).length;
  const failedSlots = images.filter((image) => !isLoading && image.image === null && image.imageUrl === null).length;
  const fallbackSlots = images.filter((image) => image.endpointLabel === "fallback").length;
  const runningSlots = isLoading ? Math.max(0, copies - completedSlots - failedSlots) : 0;
  const estimatedCredits = Math.max(copies, activePreset.estimatedCredits);
  const selectedResult = images.find((image) => !!image.slotId && image.slotId === selectedSlotId && (image.image || image.imageUrl));
  const visibleResult = selectedResult ?? images.find((image) => image.image || image.imageUrl);
  const promptStats = {
    chars: prompt.trim().length,
    estimatedTokens: Math.ceil(prompt.trim().length / 4),
    state: prompt.trim().length > 1200 ? "偏长" : prompt.trim().length > 600 ? "适中" : "精简",
  };
  const activeWorkspace = WORKSPACE_MODES.find((mode) => mode.id === workspaceMode) ?? WORKSPACE_MODES[0];
  const imageSize = imageSizes[0] ?? "1024x1024";
  const imageSizeLabel = imageSizes
    .map((id) => AD_SIZE_OPTIONS.find((option) => option.id === id)?.label ?? id)
    .join(" + ");
  const activeStyle = getStyleById(styleTemplateId);
  const filteredShots = useMemo(() => shots
    .filter((shot) => activeBoardId === "all" || shot.boardId === activeBoardId)
    .sort((a, b) => Number(b.starred) - Number(a.starred) || b.createdAt - a.createdAt), [shots, activeBoardId]);
  const shotCounts = useMemo(() => {
    const counts = new Map<string, number>();
    shots.forEach((shot) => counts.set(shot.boardId, (counts.get(shot.boardId) ?? 0) + 1));
    return counts;
  }, [shots]);
  const activeBoard = boards.find((board) => board.id === activeBoardId);
  const qualityProfileLabel = QUALITY_PROFILE_OPTIONS.find((option) => option.id === qualityProfile)?.label ?? qualityProfile;
  const productionIntentLabel = PRODUCTION_INTENT_OPTIONS.find((option) => option.id === productionIntent)?.label ?? productionIntent;
  const activeLeftTab = LEFT_PANEL_TABS.find((tab) => tab.id === leftPanelTab) ?? LEFT_PANEL_TABS[0];
  const activeInspectorTab = INSPECTOR_TABS.find((tab) => tab.id === inspectorTab) ?? INSPECTOR_TABS[0];
  const slotItems = useMemo(() => Array.from({ length: copies }, (_, index) => {
    const image = images[index];
    const hasResult = !!(image?.image || image?.imageUrl);
    const isFailed = !!image && !isLoading && !hasResult;
    const state: SlotState = hasResult
      ? "done"
      : isFailed
        ? "failed"
        : isLoading && index < Math.min(copies, completedSlots + failedSlots + concurrency)
          ? "running"
          : "queued";
    const slotSize = image?.workflow?.imageSize ?? sizeForSlot(imageSizes, index);
    const sizeTag = imageSizes.length > 1
      ? `${(AD_SIZE_OPTIONS.find((option) => option.id === slotSize)?.label ?? slotSize).split(" ")[0]} · `
      : "";
    return {
      id: image?.slotId ?? `slot-${index + 1}`,
      label: `任务 ${index + 1}`,
      state,
      detail: `${sizeTag}${image?.endpointLabel ? (ENDPOINT_LABELS[image.endpointLabel] ?? image.endpointLabel) : image?.modelId ?? ENDPOINT_LABELS.waiting}`,
    };
  }), [copies, images, isLoading, concurrency, imageSizes, completedSlots, failedSlots]);
  const failedSlotCount = slotItems.filter((slot) => slot.state === "failed").length;

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

  const activeRegionalPrompts = regionalPrompts.filter((item) => item.enabled && item.text.trim());

  const buildRunConfig = (requestedCopies = copies): ProfessionalRunConfig => {
    const brandContext = buildBrandContext(brandKit);
    return {
      prompt: applyStyleToPrompt(activeStyle, prompt.trim()),
      contextPrompt: brandContext ? appendUniqueText(contextPrompt, brandContext) : contextPrompt,
      negativePrompt: mergeStyleNegative(activeStyle, negativePrompt),
      negativeHint: activePreset.negativeHint,
      workflowPreset,
      workflowPresetLabel: activePreset.label,
      promptHint: activePreset.promptHint,
      productionIntent,
      imageSize,
      imageSizes,
      ...(styleTemplateId ? { styleTemplate: styleTemplateId } : {}),
      qualityProfile,
      seedHint,
      regionalPrompts: activeRegionalPrompts.map((item) => ({ text: item.text.trim(), weight: item.weight })),
      estimatedCredits: Math.max(requestedCopies, activePreset.estimatedCredits),
      referenceImageRoles: Object.fromEntries(
        referenceImages.map((image) => [image.id, image.role ?? "general"]),
      ) as Record<string, ReferenceImageRole>,
      copies: requestedCopies,
      concurrency,
    };
  };

  const run = (requestedCopies = copies) => {
    if (!canRun) return;
    onRun(buildRunConfig(requestedCopies));
  };

  const updateReferenceRole = useEventCallback((id: string, role: ReferenceImageRole) => {
    onReferenceImagesChange(referenceImages.map((image) => image.id === id ? { ...image, role } : image));
  });

  const updateReferenceStrength = useEventCallback((id: string, strength: number) => {
    onReferenceImagesChange(referenceImages.map((image) => image.id === id ? { ...image, strength } : image));
  });

  const applyScenario = useCallback((scenario: ScenarioTemplate) => {
    setScenarioId(scenario.id);
    setContextPrompt(scenario.contextPrompt);
    setNegativePrompt(scenario.negativePrompt);
    setWorkflowPreset(scenario.workflowPreset);
    setProductionIntent(scenario.productionIntent);
    setQualityProfile(scenario.qualityProfile);
    setImageSizes(normalizeSizeSelection(scenario.sizes));
    setCopies(Math.max(1, Math.min(8, scenario.copies)));
    const style = getStyleById(scenario.styleId);
    if (style) {
      setStyleTemplateId(style.id);
      setStyleCategory(style.category);
    }
    setLeftPanelTab("prompt");
    setCanvasNotice(`已套用「${scenario.name}」。补充画面描述后即可生成。`);
  }, []);

  const handleToggleStyle = useCallback((id: string) => {
    setStyleTemplateId((current) => current === id ? null : id);
  }, []);

  const handlePickSuggestion = useCallback((suggestionPrompt: string) => {
    setPrompt((current) => current ? `${current}\n${suggestionPrompt}` : suggestionPrompt);
  }, []);

  const toggleImageSize = (sizeId: string) => {
    setImageSizes((current) => normalizeSizeSelection(
      current.includes(sizeId) ? current.filter((item) => item !== sizeId) : [...current, sizeId],
    ));
  };

  const handleSaveBrandKit = () => {
    saveBrandKit(brandKit);
    setBrandKitMessage(hasBrandKit(brandKit) ? "品牌信息已保存。" : "品牌信息为空。");
  };

  const handleClearBrandKit = () => {
    clearBrandKit();
    setBrandKit(EMPTY_BRAND_KIT);
    setBrandKitMessage("已清空品牌信息。");
  };

  const addRegionalPrompt = (initialText = "") => {
    setLeftPanelTab("prompt");
    setRegionalPrompts((items) => [
      { id: `region-${Date.now()}`, text: initialText, weight: 80, enabled: true },
      ...items,
    ]);
  };

  const updateRegionalPrompt = (id: string, patch: Partial<RegionalPromptItem>) => {
    setRegionalPrompts((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  const removeRegionalPrompt = (id: string) => {
    setRegionalPrompts((items) => items.filter((item) => item.id !== id));
  };

  const restoreRegionalPrompts = (entries?: Array<{ text: string; weight?: number }>) => {
    if (!entries?.length) return;
    setRegionalPrompts(entries.map((entry, index) => ({
      id: `recall-${Date.now()}-${index}`,
      text: entry.text,
      weight: entry.weight ?? 80,
      enabled: true,
    })));
  };

  const openResultOnCanvas = (image: ImageResult) => {
    if (!image.image && !image.imageUrl) return;
    setSelectedSlotId(image.slotId ?? null);
    setWorkspaceMode("canvas");
    setCanvasNotice("");
  };

  const appendReferenceImage = (file: File, role: ReferenceImageRole, strength?: number) => {
    onReferenceImagesChange([
      ...referenceImages,
      {
        id: `result-${Date.now()}`,
        name: file.name,
        file,
        previewUrl: URL.createObjectURL(file),
        size: file.size,
        role,
        ...(strength !== undefined ? { strength } : {}),
      },
    ]);
  };

  const resultToBlob = async (image: ImageResult): Promise<Blob> => {
    if (image.image) {
      const binary = atob(image.image);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      return new Blob([bytes], { type: "image/png" });
    }
    const response = await fetch(image.imageUrl as string);
    if (!response.ok) throw new Error(`status ${response.status}`);
    return response.blob();
  };

  const sendResultToAssets = async (image?: ImageResult) => {
    if (!image || (!image.image && !image.imageUrl)) {
      setCanvasNotice("还没有可转为参考的成片。");
      return;
    }
    if (referenceImages.length >= MAX_REFERENCE_IMAGES) {
      setCanvasNotice(`参考图已达上限，最多 ${MAX_REFERENCE_IMAGES} 张。`);
      return;
    }
    try {
      const blob = await resultToBlob(image);
      const name = `成片-${(image.slotId ?? `${images.indexOf(image) + 1}`).slice(-6)}.png`;
      const file = new File([blob], name, { type: blob.type || "image/png" });
      appendReferenceImage(file, activePreset.defaultRole);
      setLeftPanelTab("assets");
      setCanvasNotice("已设为参考图。");
    } catch {
      setCanvasNotice("设置参考图失败，请先下载图片。");
    }
  };

  // ── 成片文件夹 ────────────────────────────────────────────────────────────

  const refreshBoards = async () => {
    const [boardList, shotList] = await Promise.all([listBoards(), listShots()]);
    setBoards(boardList);
    setShots(shotList);
  };

  const handleCreateBoard = useEventCallback(async () => {
    const board = await createBoard(newBoardName.trim());
    setNewBoardName("");
    setActiveBoardId(board.id);
    await refreshBoards();
    setCanvasNotice(`已创建「${board.name}」。`);
  });

  const handleDeleteBoard = useEventCallback(async (boardId: string) => {
    const board = boards.find((item) => item.id === boardId);
    if (!board) return;
    const count = shots.filter((shot) => shot.boardId === boardId).length;
    if (count > 0 && !window.confirm(`删除文件夹「${board.name}」会同时删除其中 ${count} 张图片，确定吗？`)) return;
    setShotUrls((current) => {
      shots.filter((shot) => shot.boardId === boardId).forEach((shot) => {
        if (current[shot.id]) URL.revokeObjectURL(current[shot.id]);
      });
      return Object.fromEntries(Object.entries(current).filter(([id]) => !shots.some((shot) => shot.id === id && shot.boardId === boardId)));
    });
    await deleteBoard(boardId);
    setActiveBoardId("all");
    await refreshBoards();
    setCanvasNotice(`已删除「${board.name}」。`);
  });

  const handleDeleteActiveBoard = useEventCallback(() => {
    if (activeBoard) handleDeleteBoard(activeBoard.id);
  });

  const saveResultToBoard = async (image?: ImageResult) => {
    if (!image || (!image.image && !image.imageUrl)) {
      setCanvasNotice("还没有可存入的成片。");
      return;
    }
    try {
      const blob = await resultToBlob(image);
      const target = activeBoard ?? await ensureDefaultBoard();
      const presetLabel = image.workflow?.workflowPresetLabel ?? activePreset.label;
      await saveShot(blob, {
        boardId: target.id,
        name: `${presetLabel}-${(image.slotId ?? `${images.indexOf(image) + 1}`).slice(-4)}.png`,
        modelId: image.modelId,
        endpointLabel: image.endpointLabel,
        presetLabel,
        prompt: prompt.trim() || undefined,
        imageSize: image.workflow?.imageSize,
      });
      await refreshBoards();
      setCanvasNotice(`已存入「${target.name}」。`);
    } catch {
      setCanvasNotice("存入失败，请重试。");
    }
  };

  const handleMoveShot = useEventCallback(async (shotId: string, boardId: string) => {
    await moveShot(shotId, boardId);
    await refreshBoards();
  });

  const handleToggleStar = useEventCallback(async (shotId: string) => {
    await toggleShotStar(shotId);
    await refreshBoards();
  });

  const handleDeleteShot = useEventCallback(async (shotId: string) => {
    setShotUrls((current) => {
      if (current[shotId]) URL.revokeObjectURL(current[shotId]);
      const next = { ...current };
      delete next[shotId];
      return next;
    });
    await deleteShot(shotId);
    await refreshBoards();
    setCanvasNotice("成片已从文件夹删除");
  });

  const downloadShot = useEventCallback((shot: SavedShotMeta) => {
    const url = shotUrls[shot.id];
    if (!url) return;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = shot.name;
    anchor.click();
  });

  const handleExportBoard = useEventCallback(async () => {
    if (!filteredShots.length) {
      setCanvasNotice("当前文件夹没有可导出的图片。");
      return;
    }
    const items: Array<{ name: string; blob: Blob }> = [];
    for (const shot of filteredShots) {
      const blob = await getShotBlob(shot.id);
      if (blob) items.push({ name: shot.name, blob });
    }
    await exportShotsZip(items, `${activeBoard?.name ?? "全部成片"}`);
    setCanvasNotice(`已导出 ${items.length} 张图片。`);
  });

  const activateWorkspace = (mode: WorkspaceMode) => {
    setWorkspaceMode(mode);
    if (mode === "viewer") {
      setInspectorTab("gallery");
    }
  };

  // ── 画布标注层 ────────────────────────────────────────────────────────────

  const syncAnnotationCanvasSize = () => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const { clientWidth, clientHeight } = canvas;
    if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
      canvas.width = clientWidth;
      canvas.height = clientHeight;
      hasAnnotationRef.current = false;
      setHasAnnotation(false);
    }
  };

  const annotationPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const drawAnnotationSegment = (
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) => {
    const canvas = annotationCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.lineCap = "round";
    context.lineJoin = "round";
    if (activeCanvasTool === "erase") {
      context.globalCompositeOperation = "destination-out";
      context.lineWidth = 26;
      context.strokeStyle = "rgba(0,0,0,1)";
    } else {
      context.globalCompositeOperation = "source-over";
      context.lineWidth = 6;
      context.strokeStyle = "rgba(255, 59, 48, 0.85)";
    }
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x + 0.01, to.y + 0.01);
    context.stroke();
    // 首段标注只 setState 一次，后续笔迹零重渲染（绘制全在 canvas 位图上）
    if (activeCanvasTool === "annotate" && !hasAnnotationRef.current) {
      hasAnnotationRef.current = true;
      setHasAnnotation(true);
    }
  };

  const handleAnnotationPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeCanvasTool === "select") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    syncAnnotationCanvasSize();
    isDrawingRef.current = true;
    const point = annotationPoint(event);
    lastPointRef.current = point;
    drawAnnotationSegment(point, point);
  };

  const handleAnnotationPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || activeCanvasTool === "select") return;
    const point = annotationPoint(event);
    drawAnnotationSegment(lastPointRef.current ?? point, point);
    lastPointRef.current = point;
  };

  const handleAnnotationPointerUp = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const clearAnnotation = () => {
    const canvas = annotationCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    hasAnnotationRef.current = false;
    setHasAnnotation(false);
    setCanvasNotice("已清空标注。");
  };

  const canvasToBlob = (canvas: HTMLCanvasElement) =>
    new Promise<Blob>((resolve, reject) => {
      try {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("empty blob"))), "image/png");
      } catch (error) {
        reject(error);
      }
    });

  const exportAnnotationToReference = async () => {
    const canvas = annotationCanvasRef.current;
    if (!canvas || !hasAnnotation) {
      setCanvasNotice("先用标注笔圈出区域。");
      return;
    }
    if (referenceImages.length >= MAX_REFERENCE_IMAGES) {
      setCanvasNotice(`参考图已达上限，最多 ${MAX_REFERENCE_IMAGES} 张。`);
      return;
    }

    const buildAnnotationOnlyBlob = async () => {
      const fallbackCanvas = document.createElement("canvas");
      fallbackCanvas.width = canvas.width;
      fallbackCanvas.height = canvas.height;
      const context = fallbackCanvas.getContext("2d");
      if (!context) throw new Error("no context");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
      context.drawImage(canvas, 0, 0);
      return canvasToBlob(fallbackCanvas);
    };

    let blob: Blob;
    let annotationOnly = false;
    const baseImage = baseImageRef.current;
    try {
      if (visibleResult && baseImage?.naturalWidth) {
        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = baseImage.naturalWidth;
        exportCanvas.height = baseImage.naturalHeight;
        const context = exportCanvas.getContext("2d");
        if (!context) throw new Error("no context");
        context.drawImage(baseImage, 0, 0);
        const scale = Math.min(canvas.width / baseImage.naturalWidth, canvas.height / baseImage.naturalHeight);
        const displayWidth = baseImage.naturalWidth * scale;
        const displayHeight = baseImage.naturalHeight * scale;
        const offsetX = (canvas.width - displayWidth) / 2;
        const offsetY = (canvas.height - displayHeight) / 2;
        context.drawImage(
          canvas,
          offsetX, offsetY, displayWidth, displayHeight,
          0, 0, baseImage.naturalWidth, baseImage.naturalHeight,
        );
        blob = await canvasToBlob(exportCanvas);
      } else {
        annotationOnly = true;
        blob = await buildAnnotationOnlyBlob();
      }
    } catch {
      try {
        annotationOnly = true;
        blob = await buildAnnotationOnlyBlob();
      } catch {
        setCanvasNotice("标注保存失败，请重试。");
        return;
      }
    }

    const file = new File([blob], `标注-${Date.now().toString().slice(-6)}.png`, { type: "image/png" });
    appendReferenceImage(file, "composition", 90);
    setContextPrompt((current) => appendUniqueText(current, ANNOTATION_CONTEXT_NOTE));
    clearAnnotation();
    setActiveCanvasTool("select");
    setCanvasNotice(annotationOnly
      ? "已将标注设为参考图。"
      : "已将标注设为参考图。");
  };

  // ── 配置召回 ─────────────────────────────────────────────────────────────

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
      productionIntent,
      imageSize,
      imageSizes,
      styleTemplate: styleTemplateId ?? undefined,
      qualityProfile,
      seedHint,
      regionalPrompts: activeRegionalPrompts.map((item) => ({ text: item.text.trim(), weight: item.weight })),
      copies,
      concurrency,
      modelId: image?.modelId,
      endpointLabel: image?.endpointLabel,
      referenceImages: referenceImages.map((ref) => ({
        name: ref.name,
        role: ref.role ?? activePreset.defaultRole,
        size: ref.size,
        strength: ref.strength ?? 80,
      })),
    };
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCanvasNotice("配置已复制。");
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
    if (config.productionIntent) setProductionIntent(config.productionIntent);
    if (config.imageSizes?.length) {
      setImageSizes(normalizeSizeSelection(config.imageSizes));
    } else if (config.imageSize) {
      setImageSizes(normalizeSizeSelection([config.imageSize]));
    }
    if (config.styleTemplate !== undefined) {
      setStyleTemplateId(getStyleById(config.styleTemplate)?.id ?? null);
    }
    if (config.qualityProfile) setQualityProfile(config.qualityProfile);
    if (config.seedHint !== undefined) setSeedHint(config.seedHint);
    if (config.copies) setCopies(config.copies);
    if (config.concurrency) setConcurrency(config.concurrency);
    restoreRegionalPrompts(config.regionalPrompts);
    if (config.referenceImageRolesByName) {
      onReferenceImagesChange(referenceImages.map((image) => {
        const role = config.referenceImageRolesByName?.[image.name];
        return role ? { ...image, role } : image;
      }));
    }
    setRestoreConfigMessage("配置已导入。");
  };

  const restoreHistoryEntry = (entry: PersistedGenerationEntry) => {
    const workflow = entry.workflow;
    setPrompt(extractPromptSection(entry.prompt));
    setContextPrompt(workflow?.contextPrompt ?? "");
    setNegativePrompt(workflow?.negativePrompt ?? "");
    if (workflow?.workflowPreset && WORKFLOW_PRESETS.some((preset) => preset.id === workflow.workflowPreset)) {
      setWorkflowPreset(workflow.workflowPreset);
    }
    if (workflow?.productionIntent) setProductionIntent(workflow.productionIntent);
    if (workflow?.imageSizes?.length) {
      setImageSizes(normalizeSizeSelection(workflow.imageSizes));
    } else if (workflow?.imageSize) {
      setImageSizes(normalizeSizeSelection([workflow.imageSize]));
    }
    // 历史记录里的提示词已包含风格文本，这里不再恢复风格，避免二次套用
    setStyleTemplateId(null);
    if (workflow?.qualityProfile) setQualityProfile(workflow.qualityProfile);
    setSeedHint(workflow?.seedHint ?? "");
    if (workflow?.copies) setCopies(workflow.copies);
    if (workflow?.concurrency) setConcurrency(workflow.concurrency);
    restoreRegionalPrompts(workflow?.regionalPrompts);
    if (workflow?.referenceImages?.length) {
      const rolesByName = Object.fromEntries(workflow.referenceImages.map((image) => [image.name, image.role]));
      onReferenceImagesChange(referenceImages.map((image) => {
        const role = rolesByName[image.name];
        return role ? { ...image, role } : image;
      }));
    }
    setLeftPanelTab("prompt");
    setRestoreConfigMessage("已恢复最近任务。");
  };

  // ── 引导 ────────────────────────────────────────────────────────────────

  const startTour = async () => {
    if (typeof window === "undefined") return;
    // driver.js 仅在引导播放时需要，按需加载，不占专业模式进场 chunk
    const { driver } = await import("driver.js");
    tourRef.current?.destroy();
    activateWorkspace("canvas");
    const tour = driver({
      showProgress: true,
      progressText: "第 {{current}} / {{total}} 步",
      nextBtnText: "下一步",
      prevBtnText: "上一步",
      doneBtnText: "完成",
      overlayOpacity: 0.4,
      stagePadding: 8,
      stageRadius: 16,
      popoverClass: "pro-tour-popover",
      onDestroyed: () => {
        window.localStorage.setItem(TOUR_STORAGE_KEY, "1");
      },
      steps: [
        {
          element: "#pro-tour-left-tabs",
          popover: {
            title: "三步生成",
            description: "先写画面描述，再加参考图，最后设置尺寸和数量。",
            side: "right",
            align: "start",
          },
          onHighlightStarted: () => setLeftPanelTab("prompt"),
        },
        {
          element: "#pro-tour-prompt",
          popover: {
            title: "画面描述",
            description: "描述你想要的画面。按 Ctrl/⌘ + Enter 生成。",
            side: "right",
            align: "start",
          },
          onHighlightStarted: () => setLeftPanelTab("prompt"),
        },
        {
          element: "#pro-tour-scenarios",
          popover: {
            title: "场景",
            description: "选择常见广告场景，快速补齐项目信息、避免内容、风格和尺寸。",
            side: "right",
            align: "start",
          },
          onHighlightStarted: () => setLeftPanelTab("prompt"),
        },
        {
          element: "#pro-tour-left-tabs",
          popover: {
            title: "参考图",
            description: "上传产品、人像或风格图，并设置用途和强度。",
            side: "right",
            align: "start",
          },
          onHighlightStarted: () => setLeftPanelTab("assets"),
        },
        {
          element: "#pro-tour-left-tabs",
          popover: {
            title: "参数",
            description: "选择尺寸、数量和品牌信息。",
            side: "right",
            align: "start",
          },
          onHighlightStarted: () => setLeftPanelTab("settings"),
        },
        {
          element: "#pro-tour-run",
          popover: {
            title: "生成",
            description: "运行当前任务。进度会显示在右侧。",
            side: "bottom",
            align: "end",
          },
        },
        {
          element: "#pro-tour-canvas-tools",
          popover: {
            title: "标注",
            description: "在图上圈出区域，再设为参考图。",
            side: "top",
            align: "center",
          },
          onHighlightStarted: () => activateWorkspace("canvas"),
        },
        {
          element: "#pro-tour-segment",
          popover: {
            title: "画布和成片墙",
            description: "画布看单张结果，成片墙浏览整批结果。",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: "#pro-tour-inspector",
          popover: {
            title: "队列、图库、历史",
            description: "查看进度，管理成片，恢复历史配置。",
            side: "left",
            align: "start",
          },
          onHighlightStarted: () => setInspectorTab("queue"),
        },
      ],
    });
    tourRef.current = tour;
    tour.drive();
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    setBrandKit(loadBrandKit());
    refreshBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    const missing = shots.filter((shot) => !shotUrls[shot.id] && !shotUrlPendingRef.current.has(shot.id));
    if (!missing.length) return;
    missing.forEach((shot) => shotUrlPendingRef.current.add(shot.id));
    (async () => {
      // 并行读 IndexedDB：30 张缩略图从串行 N×RTT 降到 ~max(RTT)
      const entries = (await Promise.all(missing.map(async (shot) => {
        const blob = await getShotBlob(shot.id);
        return blob ? ([shot.id, URL.createObjectURL(blob)] as const) : null;
      }))).filter((entry): entry is readonly [string, string] => !!entry);
      missing.forEach((shot) => shotUrlPendingRef.current.delete(shot.id));
      if (cancelled) {
        entries.forEach(([, url]) => URL.revokeObjectURL(url));
        return;
      }
      if (entries.length) {
        setShotUrls((current) => ({ ...current, ...Object.fromEntries(entries) }));
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shots]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(TOUR_STORAGE_KEY)) return;
    const timer = window.setTimeout(() => startTour(), 700);
    return () => {
      window.clearTimeout(timer);
      tourRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderBoardsPanel = () => (
    <BoardsPanel
      boards={boards}
      shots={filteredShots}
      shotUrls={shotUrls}
      shotCounts={shotCounts}
      totalShots={shots.length}
      activeBoardId={activeBoardId}
      newBoardName={newBoardName}
      hasActiveBoard={!!activeBoard}
      onSelectBoard={setActiveBoardId}
      onNameChange={setNewBoardName}
      onCreate={handleCreateBoard}
      onDeleteActive={handleDeleteActiveBoard}
      onExport={handleExportBoard}
      onMoveShot={handleMoveShot}
      onToggleStar={handleToggleStar}
      onDeleteShot={handleDeleteShot}
      onDownload={downloadShot}
    />
  );

  const runRef = useRef(run);
  runRef.current = run;
  useEffect(() => {
    // 原生 keydown 替代 react-hotkeys-hook：单一快捷键不值 ~4KB gz 依赖，
    // 且 ref 模式让热键永远拿到最新闭包、零重绑
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        runRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <section className="pro-studio-shell">
      <header className="pro-studio-topbar">
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className="truncate text-ios-subhead font-bold text-[rgba(0,0,0,0.84)]">生图工作站</h2>
          <p className="hidden truncate text-ios-caption1 font-semibold text-[rgba(0,0,0,0.40)] lg:block">{activeWorkspace.title}</p>
        </div>
        <div className="pro-mode-segment" id="pro-tour-segment" aria-label="中央视图切换">
          {WORKSPACE_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => activateWorkspace(mode.id)}
              className={cn(workspaceMode === mode.id && "is-active")}
              title={mode.title}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <div className="pro-topbar-chips" aria-label="队列速览">
          <span data-state="done">已完成 {completedSlots}</span>
          <span data-state="running">进行中 {runningSlots}</span>
          <span data-state="failed">失败 {failedSlots}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={startTour}
            className="inline-flex items-center gap-1.5 rounded-ios-xl bg-white/56 px-3 py-1.5 text-ios-footnote font-semibold text-[rgba(0,0,0,0.56)] shadow-[0_8px_22px_rgba(45,49,66,0.06)] transition-all hover:bg-white/74"
          >
            <CircleHelp className="h-3.5 w-3.5" />
            播放引导
          </button>
          {onExitProfessionalMode && (
            <button
              type="button"
              onClick={onExitProfessionalMode}
              className="inline-flex items-center gap-2 rounded-ios-xl bg-white/56 px-3 py-1.5 text-ios-footnote font-semibold text-[rgba(0,0,0,0.56)] shadow-[0_8px_22px_rgba(45,49,66,0.06)] transition-all hover:bg-white/74"
            >
              返回普通模式
            </button>
          )}
          <button
            type="button"
            id="pro-tour-run"
            onClick={() => run()}
            disabled={!canRun}
            title={canRun ? "生成（⌘ Enter）" : "先写画面描述"}
            className="inline-flex items-center gap-2 rounded-ios-xl bg-[#007AFF] px-4 py-1.5 text-ios-footnote font-semibold text-white shadow-[0_8px_26px_rgba(0,122,255,0.38)] transition-all hover:bg-[#0066DD] disabled:bg-black/16 disabled:shadow-none"
          >
            <Play className="h-3.5 w-3.5" />
            {isLoading ? "正在生成" : `生成 ${copies} 张`}
          </button>
        </div>
      </header>

      <div className="pro-studio-body">
        <aside className="pro-left-panel pro-glass-panel">
          <div className="pro-side-tabs" id="pro-tour-left-tabs" role="tablist" aria-label="创作步骤">
            {LEFT_PANEL_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={leftPanelTab === tab.id}
                onClick={() => setLeftPanelTab(tab.id)}
                className={cn(leftPanelTab === tab.id && "is-active")}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="pro-panel-hint">{activeLeftTab.hint}</p>

          {leftPanelTab === "prompt" && (
            <div className="pro-panel-stack">
              <div className="pro-accordion" id="pro-tour-prompt">
                <span className="pro-panel-title">
                  <Sparkles className="h-4 w-4" />
                  画面描述
                </span>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="例如：奶白色护肤精华放在哑光石台上，柔和晨光，背景虚化。"
                  className="min-h-[128px] w-full resize-none rounded-ios-2xl border-0 bg-white/42 px-3.5 py-3 text-ios-footnote text-[rgba(0,0,0,0.78)] outline-none ring-0 transition-all focus:bg-white/64 focus:ring-2 focus:ring-[rgba(0,122,255,0.18)]"
                />
                <div className="pro-prompt-meter">
                  <span>{promptStats.chars} 字符</span>
                  <span>预估长度 {promptStats.estimatedTokens}</span>
                  <strong>{promptStats.state}</strong>
                  <span>⌘ Enter 生成</span>
                </div>
              </div>

              <details className="pro-accordion" open id="pro-tour-scenarios">
                <summary>
                  <span className="pro-panel-title">
                    <Wand2 className="h-4 w-4" />
                    场景
                    <em className="pro-title-count">{SCENARIO_TEMPLATES.length}</em>
                  </span>
                </summary>
                <p className="pro-section-note">选一个场景，自动补齐项目信息、避免内容、风格和尺寸。</p>
                <ScenarioGrid activeId={scenarioId} onApply={applyScenario} />
              </details>

              <details className="pro-accordion" open>
                <summary>
                  <span className="pro-panel-title">
                    <Palette className="h-4 w-4" />
                    风格
                    {activeStyle && <em className="pro-title-count">{activeStyle.name}</em>}
                  </span>
                </summary>
                <p className="pro-section-note">选择风格后，生成时会加入对应提示词。</p>
                <StyleGrid
                  category={styleCategory}
                  selectedId={styleTemplateId}
                  onCategoryChange={setStyleCategory}
                  onToggle={handleToggleStyle}
                />
                {activeStyle && (
                  <button type="button" onClick={() => setStyleTemplateId(null)} className="pro-add-row-button">
                    取消风格「{activeStyle.name}」
                  </button>
                )}
              </details>

              <details className="pro-accordion" open>
                <summary>
                  <span className="pro-panel-title">
                    <Library className="h-4 w-4" />
                    预设
                  </span>
                </summary>
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
                  预设会补充描述和避免内容：{activePreset.note}
                </div>
              </details>

              <details className="pro-accordion" open>
                <summary>
                  <span className="pro-panel-title">
                    <Layers3 className="h-4 w-4" />
                    局部要求
                    <em className="pro-title-count">{activeRegionalPrompts.length}</em>
                  </span>
                </summary>
                <p className="pro-section-note">为画面局部补充要求，例如留白、人物位置或商品大小。</p>
                <div className="pro-regional-list">
                  {regionalPrompts.map((item) => (
                    <div key={item.id} className={cn("pro-regional-row", !item.enabled && "is-muted")}>
                      <button
                        type="button"
                        onClick={() => updateRegionalPrompt(item.id, { enabled: !item.enabled })}
                        className={cn("pro-layer-toggle", item.enabled && "is-active")}
                        title={item.enabled ? "停用这条要求（不发送）" : "启用这条要求"}
                        aria-label={item.enabled ? "停用这条要求" : "启用这条要求"}
                      />
                      <div className="min-w-0">
                        <input
                          value={item.text}
                          onChange={(event) => updateRegionalPrompt(item.id, { text: event.target.value })}
                          placeholder="例如：左上角留出干净的文案空间"
                          className="w-full rounded-ios-xl border-0 bg-white/40 px-2.5 py-1.5 text-[11px] font-semibold text-[rgba(0,0,0,0.68)] outline-none transition-all focus:bg-white/60 focus:ring-2 focus:ring-[rgba(0,122,255,0.16)]"
                        />
                        <label className="pro-regional-weight">
                          <span>强度</span>
                          <input
                            min={10}
                            max={100}
                            step={5}
                            type="range"
                            value={item.weight}
                            onChange={(event) => updateRegionalPrompt(item.id, { weight: Number(event.target.value) })}
                          />
                          <strong>{item.weight}%</strong>
                        </label>
                      </div>
                      <button type="button" onClick={() => removeRegionalPrompt(item.id)} className="pro-layer-remove">
                        移除
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => addRegionalPrompt()} className="pro-add-row-button">
                  <Plus className="h-3 w-3" />
                  添加要求
                </button>
              </details>

              <details className="pro-accordion">
                <summary>
                  <span className="pro-panel-title">
                    <Braces className="h-4 w-4" />
                    项目信息
                  </span>
                </summary>
                <p className="pro-section-note">写下品牌、角色、画风或投放限制。</p>
                <textarea
                  value={contextPrompt}
                  onChange={(event) => setContextPrompt(event.target.value)}
                  placeholder="例如：新车上市海报，面向 25-35 岁城市用户，需要科技感。"
                  className="min-h-[96px] w-full resize-none rounded-ios-2xl border-0 bg-white/38 px-3.5 py-3 text-ios-footnote text-[rgba(0,0,0,0.72)] outline-none ring-0 transition-all focus:bg-white/58 focus:ring-2 focus:ring-[rgba(0,122,255,0.16)]"
                />
              </details>

              <details className="pro-accordion">
                <summary>
                  <span className="pro-panel-title">
                    <Braces className="h-4 w-4" />
                    避免内容
                  </span>
                </summary>
                <p className="pro-section-note">写下不希望出现的内容。</p>
                <textarea
                  value={negativePrompt}
                  onChange={(event) => setNegativePrompt(event.target.value)}
                  placeholder="例如：水印、畸形手指、文字乱码、低清晰度。"
                  className="min-h-[80px] w-full resize-none rounded-ios-2xl border-0 bg-white/38 px-3.5 py-3 text-ios-footnote text-[rgba(0,0,0,0.72)] outline-none ring-0 transition-all focus:bg-white/58 focus:ring-2 focus:ring-[rgba(0,122,255,0.16)]"
                />
              </details>

              <details className="pro-accordion">
                <summary>
                  <span className="pro-panel-title">
                    <Library className="h-4 w-4" />
                    灵感
                  </span>
                </summary>
                <p className="pro-section-note">点一下加入画面描述。</p>
                <SuggestionList suggestions={suggestions} onPick={handlePickSuggestion} />
              </details>
            </div>
          )}

          {leftPanelTab === "assets" && (
            <div className="pro-panel-stack">
              <details className="pro-accordion" open>
                <summary>
                  <span className="pro-panel-title">
                    <ImagePlus className="h-4 w-4" />
                    参考图
                  </span>
                </summary>
                <ReferenceImageUpload value={referenceImages} onChange={onReferenceImagesChange} compact />
              </details>

              <details className="pro-accordion" open>
                <summary>
                  <span className="pro-panel-title">
                    <Images className="h-4 w-4" />
                    参考设置
                    <em className="pro-title-count">{referenceImages.length}</em>
                  </span>
                </summary>
                <p className="pro-section-note">为每张图选择用途，并调整影响强度。</p>
                <div className="grid grid-cols-2 gap-2">
                  {referenceImages.map((image) => (
                    <DraggableReferenceTile
                      key={image.id}
                      image={image}
                      onRoleChange={updateReferenceRole}
                      onStrengthChange={updateReferenceStrength}
                    />
                  ))}
                </div>
                {referenceImages.length === 0 && (
                  <p className="rounded-ios-xl bg-white/30 px-3 py-2 text-[11px] font-semibold text-[rgba(0,0,0,0.38)]">
                    还没有参考图。可直接生成，也可以上传产品图或人物图。
                  </p>
                )}
              </details>
            </div>
          )}

          {leftPanelTab === "settings" && (
            <div className="pro-panel-stack">
              <details className="pro-accordion" open>
                <summary>
                  <span className="pro-panel-title">
                    <SlidersHorizontal className="h-4 w-4" />
                    尺寸
                  </span>
                </summary>
                <p className="pro-section-note">选择一个或多个版位。多选时，每张图会轮流使用不同尺寸。</p>
                <div className="pro-size-options">
                  {AD_SIZE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleImageSize(option.id)}
                      className={cn(imageSizes.includes(option.id) && "is-active")}
                      title={option.usage}
                    >
                      <strong>{option.label}</strong>
                      <small>{option.usage}</small>
                    </button>
                  ))}
                </div>
                <label className="pro-control-row">
                  <span>质量</span>
                  <select value={qualityProfile} onChange={(event) => setQualityProfile(event.target.value)}>
                    {QUALITY_PROFILE_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                  <strong>{qualityProfileLabel}</strong>
                </label>
                <label className="pro-control-row">
                  <span>用途</span>
                  <select value={productionIntent} onChange={(event) => setProductionIntent(event.target.value)}>
                    {PRODUCTION_INTENT_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                  <strong>{productionIntentLabel}</strong>
                </label>
                <input
                  value={seedHint}
                  onChange={(event) => setSeedHint(event.target.value)}
                  placeholder="固定随机种子，可留空"
                  className="mt-2 w-full rounded-ios-xl border-0 bg-white/38 px-3 py-2 text-[11px] font-semibold text-[rgba(0,0,0,0.62)] outline-none ring-0 transition-all focus:bg-white/58 focus:ring-2 focus:ring-[rgba(0,122,255,0.16)]"
                />
              </details>

              <details className="pro-accordion" open>
                <summary>
                  <span className="pro-panel-title">
                    <Gauge className="h-4 w-4" />
                    数量
                  </span>
                </summary>
                <p className="pro-section-note">批量是生成张数。并发是同时生成的任务数。</p>
                <label className="pro-control-row">
                  <span>张数</span>
                  <input min={1} max={8} type="range" value={copies} onChange={(event) => setCopies(Number(event.target.value))} />
                  <strong>{copies} 张</strong>
                </label>
                <label className="pro-control-row">
                  <span>并发</span>
                  <input min={1} max={4} type="range" value={concurrency} onChange={(event) => setConcurrency(Number(event.target.value))} />
                  <strong>{concurrency}</strong>
                </label>
                <div className="mt-3 rounded-ios-2xl bg-white/38 px-3 py-2 text-ios-caption1 font-semibold text-[rgba(0,0,0,0.54)]">
                  预计消耗 {estimatedCredits} 张 · {imageSizeLabel}
                </div>
              </details>

              <details className="pro-accordion" open>
                <summary>
                  <span className="pro-panel-title">
                    <Braces className="h-4 w-4" />
                    品牌
                    {hasBrandKit(brandKit) && <em className="pro-title-count">已启用</em>}
                  </span>
                </summary>
                <p className="pro-section-note">保存品牌名、主色、语气和禁用元素。仅保存在本机。</p>
                <div className="pro-brand-form">
                  <input
                    value={brandKit.brandName}
                    onChange={(event) => setBrandKit((current) => ({ ...current, brandName: event.target.value }))}
                    placeholder="品牌名称，如：山雾茶舍"
                  />
                  <input
                    value={brandKit.colors}
                    onChange={(event) => setBrandKit((current) => ({ ...current, colors: event.target.value }))}
                    placeholder="品牌主色，如：#1A4D2E 墨绿 + 米白"
                  />
                  <input
                    value={brandKit.tone}
                    onChange={(event) => setBrandKit((current) => ({ ...current, tone: event.target.value }))}
                    placeholder="语气，如：东方极简、克制高级"
                  />
                  <input
                    value={brandKit.bannedWords}
                    onChange={(event) => setBrandKit((current) => ({ ...current, bannedWords: event.target.value }))}
                    placeholder="禁止出现，如：竞品包装、英文标语"
                  />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleSaveBrandKit}
                    className="inline-flex items-center justify-center gap-1.5 rounded-ios-xl bg-white/52 px-3 py-2 text-[11px] font-bold text-[rgba(0,0,0,0.58)] transition-colors hover:bg-white/74"
                  >
                    保存品牌
                  </button>
                  <button
                    type="button"
                    onClick={handleClearBrandKit}
                    className="inline-flex items-center justify-center gap-1.5 rounded-ios-xl bg-white/52 px-3 py-2 text-[11px] font-bold text-[rgba(0,0,0,0.58)] transition-colors hover:bg-white/74"
                  >
                    清空
                  </button>
                </div>
                {brandKitMessage && (
                  <p className="mt-2 truncate text-[11px] font-semibold text-[rgba(0,0,0,0.42)]">{brandKitMessage}</p>
                )}
              </details>
            </div>
          )}
        </aside>

        <main className="pro-canvas-stage pro-glass-panel" data-workspace-mode={workspaceMode}>
          <div className="pro-canvas-header">
            <div className="pro-panel-title">
              <Layers3 className="h-4 w-4" />
              {activeWorkspace.title}
            </div>
            {canvasNotice && <em className="pro-canvas-notice">{canvasNotice}</em>}
          </div>

          <div className="pro-canvas-preview" data-canvas-tool={activeCanvasTool} data-zoom={canvasZoom}>
            {workspaceMode === "viewer" ? (
              <div className="pro-viewer-grid">
                <div className="pro-gallery-toolbar">
                  <button type="button" onClick={() => setGalleryMode("images")} className={cn(galleryMode === "images" && "is-active")}>
                    成片
                  </button>
                  <button type="button" onClick={() => setGalleryMode("assets")} className={cn(galleryMode === "assets" && "is-active")}>
                    参考图
                  </button>
                  <button type="button" onClick={() => setGalleryMode("boards")} className={cn(galleryMode === "boards" && "is-active")}>
                    <FolderOpen className="mr-1 inline h-3 w-3" />
                    文件夹 {shots.length > 0 && shots.length}
                  </button>
                </div>
                {galleryMode === "boards" ? renderBoardsPanel() : (
                <div className="pro-gallery-grid">
                  {galleryMode === "images" && images.map((image, index) => (
                    <button
                      key={image.slotId ?? index}
                      type="button"
                      onClick={() => openResultOnCanvas(image)}
                      disabled={!image.image && !image.imageUrl}
                      title={image.image || image.imageUrl ? "打开这张成片" : "等待生成"}
                      className={cn("pro-gallery-card", !!image.slotId && image.slotId === selectedSlotId && "is-selected")}
                    >
                      {image.image || image.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={resultSrc(image)} alt="生成结果" />
                      ) : (
                        <div className="pro-gallery-empty">等待生成</div>
                      )}
                      <span>{SLOT_STATE_LABELS[slotItems[index]?.state ?? "queued"]}</span>
                    </button>
                  ))}
                  {galleryMode === "assets" && referenceImages.map((image) => (
                    <div key={image.id} className="pro-gallery-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.previewUrl} alt={image.name} />
                      <span>{image.name}</span>
                    </div>
                  ))}
                </div>
                )}
                {((galleryMode === "images" && images.length === 0) || (galleryMode === "assets" && referenceImages.length === 0)) && (
                  <div className="pro-canvas-empty">
                    <Images className="h-8 w-8 text-[rgba(0,0,0,0.28)]" />
                    <span>{galleryMode === "images" ? "还没有成片" : "还没有参考图"}</span>
                    <button type="button" onClick={() => activateWorkspace("canvas")} className="pro-empty-cta">
                      回到画布
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {visibleResult ? (
                  canvasZoom === "actual" ? (
                    <div className="pro-canvas-actual">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={resultSrc(visibleResult)} alt="生成结果" />
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img ref={baseImageRef} src={resultSrc(visibleResult)} alt="生成结果" className="h-full w-full object-contain" />
                  )
                ) : (
                  <div className="pro-canvas-empty">
                    <Bot className="h-8 w-8 text-[rgba(0,0,0,0.28)]" />
                    <span>在左侧描述画面，然后生成。</span>
                  </div>
                )}
                {canvasZoom === "fit" && (
                  <canvas
                    ref={annotationCanvasRef}
                    className="pro-annotate-layer"
                    data-active={activeCanvasTool !== "select"}
                    onPointerDown={handleAnnotationPointerDown}
                    onPointerMove={handleAnnotationPointerMove}
                    onPointerUp={handleAnnotationPointerUp}
                    onPointerCancel={handleAnnotationPointerUp}
                    aria-label="画布标注层"
                  />
                )}
                {visibleResult && (
                  <div className="pro-zoom-toggle" aria-label="画布缩放">
                    <button type="button" onClick={() => setCanvasZoom("fit")} className={cn(canvasZoom === "fit" && "is-active")}>
                      适应
                    </button>
                    <button type="button" onClick={() => setCanvasZoom("actual")} className={cn(canvasZoom === "actual" && "is-active")}>
                      原图大小
                    </button>
                  </div>
                )}
                {visibleResult && (
                  <div className="pro-canvas-meta">
                    <span>{visibleResult.endpointLabel ? (ENDPOINT_LABELS[visibleResult.endpointLabel] ?? visibleResult.endpointLabel) : "主渠道"} · {visibleResult.modelId}</span>
                    <button type="button" onClick={() => sendResultToAssets(visibleResult)}>
                      设为参考
                    </button>
                    <button type="button" onClick={() => saveResultToBoard(visibleResult)} title="保存到文件夹">
                      存入文件夹
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="pro-canvas-dock" id="pro-tour-canvas-tools">
            <div className="pro-tool-strip" role="group" aria-label="画布工具">
              {CANVAS_TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => {
                    setActiveCanvasTool(tool.id);
                    if (workspaceMode !== "canvas") activateWorkspace("canvas");
                    if (canvasZoom !== "fit") setCanvasZoom("fit");
                    setCanvasNotice(tool.id === "select" ? "" : tool.hint);
                  }}
                  className={cn(activeCanvasTool === tool.id && "is-active")}
                  title={tool.hint}
                >
                  {tool.label}
                </button>
              ))}
            </div>
            <div className="pro-dock-actions">
              <button
                type="button"
                onClick={exportAnnotationToReference}
                disabled={!hasAnnotation}
                title={hasAnnotation ? "把标注设为参考图" : "先用标注笔圈出区域"}
              >
                <ImagePlus className="h-3 w-3" />
                设为参考
              </button>
              <button type="button" onClick={clearAnnotation} disabled={!hasAnnotation} title="清空画布上的标注">
                清空标注
              </button>
              <button type="button" onClick={() => copyProvenanceConfig(visibleResult)} title="复制当前配置，可稍后导入。">
                <Clipboard className="h-3 w-3" />
                复制配置
              </button>
              <button
                type="button"
                onClick={() => sendResultToAssets(visibleResult)}
                disabled={!visibleResult}
                title={visibleResult ? "把当前成片设为参考图" : "还没有成片"}
              >
                设为参考
              </button>
            </div>
          </div>
        </main>

        <aside className="pro-inspector pro-glass-panel">
          <div className="pro-inspector-tabs" id="pro-tour-inspector" role="tablist" aria-label="产出面板">
            {INSPECTOR_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={inspectorTab === tab.id}
                onClick={() => setInspectorTab(tab.id)}
                className={cn(inspectorTab === tab.id && "is-active")}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="pro-panel-hint">{activeInspectorTab.hint}</p>

          {inspectorTab === "queue" && (
            <div className="pro-panel-stack">
              <details className="pro-accordion" open>
                <summary>
                  <span className="pro-panel-title">
                    <Gauge className="h-4 w-4" />
                    队列
                  </span>
                </summary>
                <div className="pro-metric-grid">
                  <div className="pro-metric-card">
                    <span>任务</span>
                    <strong>{copies}</strong>
                  </div>
                  <div className="pro-metric-card">
                    <span>进行中</span>
                    <strong>{runningSlots}</strong>
                  </div>
                  <div className="pro-metric-card">
                    <span>已完成</span>
                    <strong>{completedSlots}</strong>
                  </div>
                  <div className="pro-metric-card">
                    <span>失败</span>
                    <strong>{failedSlots}</strong>
                  </div>
                </div>
                <QueueSlotList slots={slotItems} />
                <div className="mt-2 flex items-center justify-between rounded-ios-2xl bg-white/34 px-3 py-2 text-[11px] font-semibold text-[rgba(0,0,0,0.50)]">
                  <span>已切换备用渠道</span>
                  <span className={cn("rounded-full px-2 py-0.5", fallbackSlots ? "bg-[#FF9500]/18 text-[#B45F00]" : "bg-[#34C759]/14 text-[#207A37]")}>
                    {fallbackSlots}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => run(Math.max(1, failedSlotCount))}
                  disabled={!canRun || failedSlotCount === 0}
                  title={failedSlotCount ? `用当前配置重新生成 ${failedSlotCount} 个失败任务` : "没有失败任务"}
                  className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-ios-xl bg-white/46 px-3 py-2 text-[11px] font-bold text-[rgba(0,0,0,0.56)] transition-colors hover:bg-white/70 disabled:text-[rgba(0,0,0,0.24)]"
                >
                  <RotateCcw className="h-3 w-3" />
                  重试失败任务
                </button>
              </details>

              <details className="pro-accordion">
                <summary>
                  <span className="pro-panel-title">
                    <Layers3 className="h-4 w-4" />
                    生成步骤
                  </span>
                </summary>
                <p className="pro-section-note">生成时会按这些步骤处理。</p>
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
              </details>
            </div>
          )}

          {inspectorTab === "gallery" && (
            <div className="pro-panel-stack">
              <details className="pro-accordion" open>
                <summary>
                  <span className="pro-panel-title">
                    <Images className="h-4 w-4" />
                    图库
                  </span>
                </summary>
                <div className="pro-gallery-toolbar">
                  <button type="button" onClick={() => setGalleryMode("images")} className={cn(galleryMode === "images" && "is-active")}>
                    成片
                  </button>
                  <button type="button" onClick={() => setGalleryMode("assets")} className={cn(galleryMode === "assets" && "is-active")}>
                    参考图
                  </button>
                  <button type="button" onClick={() => setGalleryMode("boards")} className={cn(galleryMode === "boards" && "is-active")}>
                    文件夹
                  </button>
                </div>
                {galleryMode === "boards" ? renderBoardsPanel() : (
                <div className="grid max-h-[420px] grid-cols-2 gap-2 overflow-y-auto pr-1">
                  {galleryMode === "images" && images.map((image, index) => (
                    <div key={image.slotId ?? index} className={cn("pro-provenance-card", !!image.slotId && image.slotId === selectedSlotId && "is-selected")}>
                      <div className={cn("aspect-square overflow-hidden rounded-ios-xl bg-white/42", !image.image && !image.imageUrl && "flex items-center justify-center")}>
                        {image.image || image.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={resultSrc(image)} alt="生成结果" className="h-full w-full object-cover" />
                        ) : (
                          <Bot className="h-5 w-5 text-[rgba(0,0,0,0.28)]" />
                        )}
                      </div>
                      <div className="mt-2 space-y-1 text-[10px] font-semibold text-[rgba(0,0,0,0.46)]">
                        <div className="flex items-center gap-1">
                          <Clipboard className="h-3 w-3" />
                          <span className="truncate">生成信息</span>
                        </div>
                        <p className="truncate">{image.workflow?.workflowPresetLabel ?? activePreset.label}</p>
                        <p className="truncate">{image.endpointLabel ? (ENDPOINT_LABELS[image.endpointLabel] ?? image.endpointLabel) : "排队中"} · {image.modelId}</p>
                        <p className="truncate">{image.referenceImageNames?.join("、") || "未使用参考图"}</p>
                        <div className="grid grid-cols-2 gap-1">
                          <button
                            type="button"
                            onClick={() => openResultOnCanvas(image)}
                            disabled={!image.image && !image.imageUrl}
                            className="mt-1 inline-flex items-center justify-center gap-1 rounded-lg bg-white/46 px-2 py-1 text-[10px] font-bold text-[rgba(0,0,0,0.56)] transition-colors hover:bg-white/70 disabled:text-[rgba(0,0,0,0.24)]"
                          >
                            打开
                          </button>
                          <button
                            type="button"
                            onClick={() => copyProvenanceConfig(image)}
                            className="mt-1 inline-flex items-center justify-center gap-1 rounded-lg bg-white/46 px-2 py-1 text-[10px] font-bold text-[rgba(0,0,0,0.56)] transition-colors hover:bg-white/70"
                          >
                            <Clipboard className="h-3 w-3" />
                            复制配置
                          </button>
                          <button
                            type="button"
                            onClick={() => saveResultToBoard(image)}
                            disabled={!image.image && !image.imageUrl}
                            title="保存到文件夹"
                            className="col-span-2 mt-1 inline-flex items-center justify-center gap-1 rounded-lg bg-white/46 px-2 py-1 text-[10px] font-bold text-[rgba(0,0,0,0.56)] transition-colors hover:bg-white/70 disabled:text-[rgba(0,0,0,0.24)]"
                          >
                            <FolderOpen className="h-3 w-3" />
                            存入文件夹
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {galleryMode === "assets" && referenceImages.map((image) => (
                    <div key={image.id} className="pro-provenance-card">
                      <div className="aspect-square overflow-hidden rounded-ios-xl bg-white/42">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.previewUrl} alt={image.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="mt-2 space-y-1 text-[10px] font-semibold text-[rgba(0,0,0,0.46)]">
                        <p className="truncate">参考图</p>
                        <p className="truncate">{image.name}</p>
                        <p className="truncate">
                          {REFERENCE_IMAGE_ROLES.find((role) => role.id === (image.role ?? "general"))?.label} · 强度 {image.strength ?? 80}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                )}
                {((galleryMode === "images" && images.length === 0) || (galleryMode === "assets" && referenceImages.length === 0)) && (
                  <div className="mt-2 rounded-ios-2xl bg-white/34 px-3 py-3 text-[11px] font-medium leading-relaxed text-[rgba(0,0,0,0.46)]">
                    <RotateCcw className="mr-1.5 inline h-3 w-3" />
                    {galleryMode === "images" ? "生成后，这里会显示模型、渠道和可导入配置。" : "添加参考图后，这里会显示素材。"}
                  </div>
                )}
              </details>
            </div>
          )}

          {inspectorTab === "history" && (
            <div className="pro-panel-stack">
              <details className="pro-accordion" open>
                <summary>
                  <span className="pro-panel-title">
                    <RotateCcw className="h-4 w-4" />
                    最近任务
                  </span>
                </summary>
                <p className="pro-section-note">点击记录，恢复当时的提示词和参数。</p>
                <div className="pro-recent-list">
                  {recentWorkflows.length > 0 ? recentWorkflows.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => restoreHistoryEntry(entry)}
                      className="pro-recent-item"
                    >
                      <span>{entry.workflow?.workflowPresetLabel ?? "历史配置"}</span>
                      <small>{new Date(entry.generatedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</small>
                    </button>
                  )) : (
                    <p className="rounded-ios-xl bg-white/30 px-3 py-2 text-[11px] font-semibold text-[rgba(0,0,0,0.38)]">还没有历史记录。生成后会显示在这里。</p>
                  )}
                </div>
              </details>

              <details className="pro-accordion" open>
                <summary>
                  <span className="pro-panel-title">
                    <FileJson className="h-4 w-4" />
                    导入配置
                  </span>
                </summary>
                <p className="pro-section-note">粘贴从“复制配置”得到的内容，恢复提示词和参数。</p>
                <textarea
                  value={restoreConfigText}
                  onChange={(event) => setRestoreConfigText(event.target.value)}
                  placeholder='{"prompt": "...", "workflowPreset": "product-shot", ...}'
                  className="min-h-[82px] w-full resize-none rounded-ios-2xl border-0 bg-white/38 px-3.5 py-3 text-[11px] text-[rgba(0,0,0,0.68)] outline-none ring-0 transition-all focus:bg-white/58 focus:ring-2 focus:ring-[rgba(0,122,255,0.16)]"
                />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={restoreProvenanceConfig}
                    className="inline-flex items-center justify-center gap-1.5 rounded-ios-xl bg-white/52 px-3 py-2 text-[11px] font-bold text-[rgba(0,0,0,0.58)] transition-colors hover:bg-white/74"
                  >
                    <FileJson className="h-3 w-3" />
                    导入
                  </button>
                  <button
                    type="button"
                    onClick={() => copyProvenanceConfig(visibleResult)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-ios-xl bg-white/52 px-3 py-2 text-[11px] font-bold text-[rgba(0,0,0,0.58)] transition-colors hover:bg-white/74"
                  >
                    <Clipboard className="h-3 w-3" />
                    复制当前配置
                  </button>
                </div>
                {restoreConfigMessage && (
                  <p className="mt-2 truncate text-[11px] font-semibold text-[rgba(0,0,0,0.42)]">{restoreConfigMessage}</p>
                )}
              </details>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
