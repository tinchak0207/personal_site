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

  const config: WorkflowRecallConfig = {
    ...(cleanText(payload.prompt) ? { prompt: cleanText(payload.prompt) } : {}),
    ...(cleanText(payload.contextPrompt) ? { contextPrompt: cleanText(payload.contextPrompt) } : {}),
    ...(cleanText(payload.negativePrompt) ? { negativePrompt: cleanText(payload.negativePrompt) } : {}),
    ...(cleanText(payload.workflowPreset) ? { workflowPreset: cleanText(payload.workflowPreset) } : {}),
    ...(clampRange(payload.copies, 1, 8) ? { copies: clampRange(payload.copies, 1, 8) } : {}),
    ...(clampRange(payload.concurrency, 1, 4) ? { concurrency: clampRange(payload.concurrency, 1, 4) } : {}),
    ...(readReferenceRoles(payload.referenceImages) ? { referenceImageRolesByName: readReferenceRoles(payload.referenceImages) } : {}),
  };

  return Object.keys(config).length
    ? { ok: true, config }
    : { ok: false, error: "没有可导入的工作站配置" };
}
