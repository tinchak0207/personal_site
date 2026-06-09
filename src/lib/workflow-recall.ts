import type { ReferenceImageRole } from "./image-types";

export interface WorkflowRecallConfig {
  prompt?: string;
  contextPrompt?: string;
  negativePrompt?: string;
  workflowPreset?: string;
  copies?: number;
  concurrency?: number;
  referenceImageRolesByName?: Record<string, ReferenceImageRole>;
}

export type WorkflowRecallParseResult =
  | { ok: true; config: WorkflowRecallConfig }
  | { ok: false; error: string };

const VALID_REFERENCE_ROLES = new Set<ReferenceImageRole>([
  "style",
  "character",
  "composition",
  "product",
  "face",
  "general",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function clampRange(value: unknown, min: number, max: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function readReferenceRoles(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  const entries = value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const name = cleanText(item.name);
    const role = item.role;
    if (!name || typeof role !== "string" || !VALID_REFERENCE_ROLES.has(role as ReferenceImageRole)) return [];
    return [[name, role as ReferenceImageRole] as const];
  });
  return entries.length ? Object.fromEntries(entries) : undefined;
}

export function parseWorkflowRecallConfig(raw: string): WorkflowRecallParseResult {
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return { ok: false, error: "配置 JSON 无法解析" };
  }

  if (!isRecord(payload)) return { ok: false, error: "没有可导入的工作站配置" };
  const prompt = cleanText(payload.prompt);
  const contextPrompt = cleanText(payload.contextPrompt);
  const negativePrompt = cleanText(payload.negativePrompt);
  const workflowPreset = cleanText(payload.workflowPreset);
  const copies = clampRange(payload.copies, 1, 8);
  const concurrency = clampRange(payload.concurrency, 1, 4);
  const referenceImageRolesByName = readReferenceRoles(payload.referenceImages);

  const config: WorkflowRecallConfig = {
    ...(prompt ? { prompt } : {}),
    ...(contextPrompt ? { contextPrompt } : {}),
    ...(negativePrompt ? { negativePrompt } : {}),
    ...(workflowPreset ? { workflowPreset } : {}),
    ...(copies ? { copies } : {}),
    ...(concurrency ? { concurrency } : {}),
    ...(referenceImageRolesByName ? { referenceImageRolesByName } : {}),
  };

  return Object.keys(config).length
    ? { ok: true, config }
    : { ok: false, error: "没有可导入的工作站配置" };
}

export function extractPromptSection(prompt: string) {
  const trimmed = prompt.trim();
  const match = trimmed.match(/(?:^|\n\n)Prompt:\n([\s\S]*?)(?:\n\n(?:Workflow preset:|Preset guidance:|Reference images:|Avoid:)|$)/);
  return (match?.[1] ?? trimmed).trim();
}
