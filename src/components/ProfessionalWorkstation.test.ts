import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(relPath: string) {
  return readFileSync(join(process.cwd(), relPath), "utf8");
}

test("professional workstation copy follows the Apple-style simplified Chinese contract", () => {
  const source = read("src/components/pro-workstation/InvokeInspiredWorkstation.tsx");

  [
    "生图工作站",
    "画面描述",
    "项目信息",
    "避免内容",
    "参考设置",
    "张数",
    "品牌",
    "生成步骤",
    "生成信息",
    "导入配置",
    "播放引导",
    "返回普通模式",
    "正在生成",
    "已完成",
    "进行中",
    "任务",
    "重试失败任务",
    "设为参考",
    "清空标注",
  ].forEach((copy) => assert.match(source, new RegExp(copy)));

  [
    "专业生图工作站",
    "主提示词",
    "场景模板",
    "风格模板",
    "工作流预设",
    "项目上下文",
    "反向提示词",
    "上传参考图",
    "用途与强度",
    "生产配置",
    "队列参数",
    "品牌资产",
    "队列检查器",
    "图库与生成溯源",
    "生成溯源",
    "配置召回 / JSON",
    "执行流程",
    "标注转参考图",
    "转入素材",
    "预估词元",
    "槽位",
    "开箱即用",
    "一键就绪",
    "完整参数",
    "架构校验",
    "自动把风格语言包裹",
    "AI 会主动避开",
    "生成中...",
  ].forEach((copy) => assert.doesNotMatch(source, new RegExp(copy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))));
});

test("professional workstation is based on open-source workstation patterns", () => {
  const source = read("src/components/pro-workstation/InvokeInspiredWorkstation.tsx");
  const sources = read("src/components/pro-workstation/workstation-sources.ts");
  const design = read("docs/plans/2026-06-09-pro-workstation-platform-design.md");
  const refactor = read("docs/plans/2026-06-10-pro-workstation-ux-refactor.md");
  const playground = read("src/components/ImagePlayground.tsx");
  const pkg = read("package.json");

  assert.match(sources, /github\.com\/invoke-ai\/InvokeAI/);
  assert.match(sources, /Apache-2\.0/);
  assert.match(sources, /github\.com\/Stability-AI\/StableStudio/);
  assert.match(sources, /MIT/);
  assert.match(sources, /github\.com\/Comfy-Org\/ComfyUI_frontend/);
  assert.match(sources, /github\.com\/comfyanonymous\/ComfyUI/);
  assert.match(sources, /github\.com\/lllyasviel\/Fooocus/);
  assert.match(sources, /github\.com\/AUTOMATIC1111\/stable-diffusion-webui/);
  assert.match(sources, /AGPL-3\.0/);
  assert.match(sources, /product-reference/);
  assert.match(sources, /Unified Canvas/);
  assert.match(sources, /Control Layers/);
  assert.match(sources, /Board & Gallery Management/);
  assert.match(sources, /Queue/);
  assert.match(sources, /Prompt Library/);
  assert.match(sources, /Image Prompt/);
  assert.match(sources, /PNG Info/);
  assert.match(design, /\/api\/generate-images/);
  assert.match(design, /quota/);
  assert.match(design, /history/);
  assert.match(design, /Mobile should keep normal mode/);
  assert.match(design, /No fake node execution engine/);
  assert.match(refactor, /regionalPrompts/);
  assert.match(refactor, /driver\.js/);
  assert.match(source, /WORKSTATION_SOURCES/);
  assert.match(source, /WORKFLOW_PRESETS/);
  assert.match(source, /WORKFLOW_SCHEMA_VERSION/);
  assert.match(source, /REFERENCE_IMAGE_ROLES/);
  assert.match(source, /promptHint/);
  assert.match(source, /negativeHint/);
  assert.match(source, /estimatedCredits/);
  assert.match(source, /negativePrompt/);
  assert.match(source, /workflowPreset/);
  assert.match(source, /role/);
  assert.match(source, /预计消耗/);
  assert.match(source, /队列/);
  assert.match(source, /生成信息/);
  assert.match(source, /pro-studio-shell/);
  assert.match(source, /pro-studio-topbar/);
  assert.match(source, /pro-mode-segment/);
  assert.match(source, /pro-side-tabs/);
  assert.match(source, /pro-canvas-stage/);
  assert.match(source, /pro-inspector-tabs/);
  assert.match(source, /pro-accordion/);
  assert.match(source, /workspaceMode/);
  assert.match(source, /activateWorkspace/);
  assert.match(source, /leftPanelTab/);
  assert.match(source, /inspectorTab/);
  assert.match(source, /activeCanvasTool/);
  assert.match(source, /galleryMode/);
  assert.doesNotMatch(source, /pro-workstation-grid/);
  assert.doesNotMatch(source, /pro-command-rail/);
  assert.doesNotMatch(source, /pro-launchpad-grid/);
  assert.match(source, /copyProvenanceConfig/);
  assert.match(source, /restoreProvenanceConfig/);
  assert.match(source, /restoreHistoryEntry/);
  assert.match(source, /parseWorkflowRecallConfig/);
  assert.match(source, /extractPromptSection/);
  assert.match(source, /recentWorkflows/);
  assert.match(source, /navigator\.clipboard\.writeText/);
  assert.match(source, /复制配置/);
  assert.match(source, /导入配置/);
  assert.match(source, /最近任务/);
  assert.match(source, /promptStats/);
  assert.match(source, /预估长度/);
  assert.match(source, /pro-slot-list/);
  assert.match(source, /data-slot-state/);
  assert.match(source, /applyWorkflowPreset/);
  assert.match(source, /尺寸/);
  assert.match(source, /imageSize/);
  assert.match(source, /qualityProfile/);
  assert.match(source, /productionIntent/);
  assert.match(source, /seedHint/);
  assert.match(source, /重试失败任务/);
  assert.match(source, /selectedSlotId/);
  assert.match(source, /openResultOnCanvas/);
  assert.match(source, /sendResultToAssets/);
  assert.match(source, /MAX_REFERENCE_IMAGES/);
  assert.match(source, /canvasZoom/);
  assert.match(source, /data-canvas-tool/);
  assert.match(source, /pro-topbar-chips/);
  assert.match(source, /pro-zoom-toggle/);
  assert.match(source, /pro-canvas-meta/);
  assert.match(source, /is-selected/);
  assert.match(source, /设为参考/);
  assert.match(source, /打开/);
  assert.match(source, /返回普通模式/);
  assert.match(source, /生成（⌘ Enter）/);
  [
    "Canvas",
    "Viewer",
    "Launchpad",
    "Prompt Lab",
    "Image Prompt",
    "Control Layers",
    "Production Profile",
    "Queue",
    "Unified Canvas",
    "Canvas Tools",
    "Run",
    "Boards",
    "Layers",
    "History",
    "Board & Gallery Management",
    "Provenance",
    "Queue Inspector",
    "Slots",
    "Running",
    "Done",
    "Failed",
    "Fallback used",
    "Workflow Plan",
    "Recent Runs",
    "PNG Info",
    "JSON Recall",
    "Prompt Library",
    "Estimated tokens",
    "Retry failed slots",
    "Annotate",
    "Tour",
    "Gallery",
  ].forEach((label) => assert.doesNotMatch(source, new RegExp(`>${label}<|title="${label}"|aria-label="${label}"`)));
  assert.match(pkg, /"@atlaskit\/pragmatic-drag-and-drop"/);
  assert.match(pkg, /"driver\.js"/);
  assert.match(source, /draggable\(/);
  assert.match(source, /SuggestionList/);
  assert.match(source, /concurrency/);
  assert.match(source, /contextPrompt/);
  assert.match(playground, /dynamic\(\(\) => import\("@\/components\/pro-workstation\/InvokeInspiredWorkstation"\)/);
  assert.match(playground, /showProfessionalMode/);
  assert.match(playground, /recentWorkflows=\{recentWorkflows\}/);
  assert.match(playground, /hidden md:inline-flex/);
  assert.match(playground, /regionalPrompts: config\.regionalPrompts/);
});

test("professional workstation guides beginners with a three-step layered flow", () => {
  const source = read("src/components/pro-workstation/InvokeInspiredWorkstation.tsx");

  // 左栏三步 + 右栏三面板，每个面板自带一行说明
  assert.match(source, /label: "提示词"/);
  assert.match(source, /label: "参考图"/);
  assert.match(source, /label: "参数"/);
  assert.match(source, /LEFT_PANEL_TABS/);
  assert.match(source, /INSPECTOR_TABS/);
  assert.match(source, /pro-panel-hint/);
  assert.match(source, /pro-section-note/);
  assert.match(source, /描述画面，选择场景和风格。/);
  assert.match(source, /添加产品、人物或风格参考。/);
  assert.match(source, /设置尺寸、数量和品牌信息。/);
  assert.match(source, /队列/);
  assert.match(source, /图库/);
  assert.match(source, /历史/);
  assert.match(source, /成片墙/);

  // driver.js 交互式引导：首次自动播放 + 顶栏可重播
  assert.match(source, /from "driver\.js"/);
  assert.match(source, /driver\.js\/dist\/driver\.css/);
  assert.match(source, /startTour/);
  assert.match(source, /TOUR_STORAGE_KEY/);
  assert.match(source, /localStorage\.getItem\(TOUR_STORAGE_KEY\)/);
  assert.match(source, /localStorage\.setItem\(TOUR_STORAGE_KEY/);
  assert.match(source, /播放引导/);
  assert.match(source, /三步生成/);
  assert.match(source, /画面描述/);
  assert.match(source, /第 \{\{current\}\} \/ \{\{total\}\} 步/);
  assert.match(source, /下一步/);
  assert.match(source, /onHighlightStarted/);
  assert.match(source, /pro-tour-popover/);
});

test("professional workstation has no decorative controls", () => {
  const source = read("src/components/pro-workstation/InvokeInspiredWorkstation.tsx");
  const workflowLib = read("src/lib/generation-workflow.ts");
  const recallLib = read("src/lib/workflow-recall.ts");
  const types = read("src/lib/image-types.ts");

  // 局部要求真实写入生成请求，并可由 JSON / 历史召回
  assert.match(source, /regionalPrompts/);
  assert.match(source, /addRegionalPrompt/);
  assert.match(source, /updateRegionalPrompt/);
  assert.match(source, /removeRegionalPrompt/);
  assert.match(source, /restoreRegionalPrompts/);
  assert.match(source, /局部要求/);
  assert.match(types, /RegionalPromptMetadata/);
  assert.match(workflowLib, /normalizeRegionalPrompts/);
  assert.match(workflowLib, /Regional requirements/);
  assert.match(recallLib, /regionalPrompts/);

  // 参考图强度真实进入 workflow 元数据与最终提示词
  assert.match(source, /updateReferenceStrength/);
  assert.match(source, /强度/);
  assert.match(types, /strength\?: number/);
  assert.match(workflowLib, /strength/);
  assert.match(workflowLib, /influence/);

  // 画布标注是真实的绘制层，可合成原图导出为参考图
  assert.match(source, /annotationCanvasRef/);
  assert.match(source, /handleAnnotationPointerDown/);
  assert.match(source, /handleAnnotationPointerMove/);
  assert.match(source, /clearAnnotation/);
  assert.match(source, /exportAnnotationToReference/);
  assert.match(source, /destination-out/);
  assert.match(source, /设为参考/);
  assert.match(source, /标注笔/);
  assert.match(source, /pro-annotate-layer/);
  assert.match(source, /toBlob/);

  // 装饰性的旧三类图层与启动台已删除
  assert.doesNotMatch(source, /rasterLayers/);
  assert.doesNotMatch(source, /addRasterLayer/);
  assert.doesNotMatch(source, /启动台/);
});

test("professional workstation ships an application layer for real ad workflows", () => {
  const source = read("src/components/pro-workstation/InvokeInspiredWorkstation.tsx");
  const styleLib = read("src/lib/style-library.ts");
  const scenarioLib = read("src/lib/scenario-templates.ts");
  const boardsLib = read("src/lib/boards-store.ts");
  const brandLib = read("src/lib/brand-kit.ts");
  const formatsLib = read("src/lib/ad-formats.ts");
  const zipLib = read("src/lib/export-zip.ts");
  const recallLib = read("src/lib/workflow-recall.ts");
  const hook = read("src/hooks/use-image-generation.ts");
  const pkg = read("package.json");

  // 开源模板库（不造轮子）：106 种风格逐字 vendored 自 MIT 项目
  assert.match(styleLib, /twri\/sdxl_prompt_styler/);
  assert.match(styleLib, /MIT/);
  assert.match(styleLib, /\{prompt\}/);
  assert.ok((styleLib.match(/id: "/g) ?? []).length >= 106, "风格库应有至少 106 条");
  assert.match(source, /STYLE_CATEGORIES/);
  assert.match(source, /applyStyleToPrompt/);
  assert.match(source, /mergeStyleNegative/);
  assert.match(source, /风格/);

  // 场景模板：填好项目信息 / 避免内容 / 风格 / 尺寸（冷启动核心）
  assert.match(scenarioLib, /SCENARIO_TEMPLATES/);
  assert.ok((scenarioLib.match(/contextPrompt:/g) ?? []).length >= 14, "场景模板应有至少 14 条");
  assert.match(source, /applyScenario/);
  assert.match(source, /场景/);

  // 成片文件夹：IndexedDB 持久化 + 星标评审 + 移动 + 删除 + ZIP 导出（B 端资产管理）
  assert.match(boardsLib, /idb-keyval/);
  assert.match(boardsLib, /DEFAULT_BOARD_NAME/);
  assert.match(zipLib, /jszip/i);
  assert.match(source, /saveResultToBoard/);
  assert.match(source, /存入文件夹/);
  assert.match(source, /handleExportBoard/);
  assert.match(source, /导出打包文件/);
  assert.match(source, /handleToggleStar/);
  assert.match(source, /handleMoveShot/);
  assert.match(source, /renderBoardsPanel/);

  // 品牌信息：本机持久化并在生成时注入上下文
  assert.match(brandLib, /buildBrandContext/);
  assert.match(source, /品牌/);
  assert.match(source, /saveBrandKit/);
  assert.match(source, /buildBrandContext/);

  // 多尺寸投放：任务轮替分配，一次出齐方 / 横 / 竖
  assert.match(formatsLib, /sizeForSlot/);
  assert.match(source, /toggleImageSize/);
  assert.match(source, /imageSizes/);
  assert.match(hook, /workflowForSlot/);
  assert.match(hook, /imageSizes/);
  assert.match(recallLib, /imageSizes/);
  assert.match(recallLib, /styleTemplate/);

  assert.match(pkg, /"idb-keyval"/);
  assert.match(pkg, /"jszip"/);
});

test("professional workstation stays fast on low-end hardware", () => {
  const source = read("src/components/pro-workstation/InvokeInspiredWorkstation.tsx");
  const zipLib = read("src/lib/export-zip.ts");
  const cacheLib = read("src/lib/generation-cache.ts");

  // 重子树有 memo 边界，键击不再重渲染整棵树
  assert.match(source, /useEventCallback/);
  assert.match(source, /memo\(function ScenarioGrid/);
  assert.match(source, /memo\(function StyleGrid/);
  assert.match(source, /memo\(function SuggestionList/);
  assert.match(source, /memo\(function QueueSlotList/);
  assert.match(source, /memo\(function BoardsPanel/);
  assert.match(source, /memo\(function DraggableReferenceTile/);
  assert.match(source, /useMemo/);

  // base64 data URL 按对象身份缓存，不再每次渲染重新分配多 MB 字符串
  assert.match(source, /resultSrcCache/);
  assert.match(source, /WeakMap<ImageResult, string>/);

  // 重依赖按需加载：jszip 仅在导出时、driver.js 仅在引导时
  assert.match(zipLib, /await import\("jszip"\)/);
  assert.doesNotMatch(zipLib, /^import JSZip/m);
  assert.match(source, /await import\("driver\.js"\)/);
  assert.match(source, /import type \{ Driver \} from "driver\.js"/);

  // 工作站专用 CSS 随懒加载 chunk 下发，不阻塞首页首屏
  assert.match(source, /import "\.\/workstation\.css"/);

  // base64 不写入 localStorage（生成结束时的主线程卡顿来源）
  assert.match(cacheLib, /image: null/);

  // 快捷键走稳定 ref 的原生 keydown，不再随键击重绑
  assert.match(source, /runRef/);
  assert.match(source, /metaKey/);
  assert.doesNotMatch(source, /from "react-hotkeys-hook"/);
  assert.doesNotMatch(source, /from "react-virtuoso"/);
});

test("professional workstation keeps a compact single-screen liquid glass layout", () => {
  const globals = read("src/app/globals.css");
  const styles = read("src/components/pro-workstation/workstation.css");

  assert.match(globals, /\.pro-app-shell \{[^}]*height: 100svh/);
  assert.match(globals, /\.pro-app-shell \{[^}]*overflow: hidden/);
  assert.doesNotMatch(globals, /\.pro-studio-shell/);
  assert.match(styles, /\.pro-app-shell \.pro-canvas-stage \{[^}]*grid-template-rows: auto minmax\(0, 1fr\) auto/);
  assert.match(styles, /--pro-spring: cubic-bezier\(0\.34, 1\.56, 0\.64, 1\)/);
  assert.match(styles, /\.pro-glass-panel \{[^}]*backdrop-filter: blur\(40px\) saturate\(1\.8\) brightness\(1\.08\)/);
  assert.match(styles, /\.pro-studio-topbar \{[^}]*backdrop-filter: blur\(48px\) saturate\(2\)/);
  assert.match(styles, /\.pro-studio-topbar::before,\r?\n\.pro-glass-panel::before/);
  assert.match(styles, /\.pro-panel-hint/);
  assert.match(styles, /\.pro-section-note/);
  assert.match(styles, /\.pro-topbar-chips/);
  assert.match(styles, /\.pro-canvas-dock/);
  assert.match(styles, /\.pro-dock-actions/);
  assert.match(styles, /\.pro-zoom-toggle/);
  assert.match(styles, /\.pro-canvas-meta/);
  assert.match(styles, /\.pro-canvas-actual/);
  assert.match(styles, /\.pro-canvas-notice/);
  assert.match(styles, /\.pro-annotate-layer/);
  assert.match(styles, /\.pro-regional-row/);
  assert.match(styles, /\.pro-reference-tile/);
  assert.match(styles, /\.pro-chip-grid/);
  assert.match(styles, /\.pro-style-grid/);
  assert.match(styles, /\.pro-size-options/);
  assert.match(styles, /\.pro-brand-form/);
  assert.match(styles, /\.pro-board-chips/);
  assert.match(styles, /\.pro-shot-grid/);
  assert.match(styles, /\.pro-gallery-card\.is-selected/);
  assert.match(styles, /\.pro-canvas-preview\[data-canvas-tool="annotate"\]/);
  assert.match(styles, /\.driver-popover\.pro-tour-popover/);
  assert.doesNotMatch(styles, /\.pro-command-rail/);
  assert.doesNotMatch(styles, /\.pro-launchpad-grid/);
});
