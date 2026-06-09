import type {
  GenerationWorkflowMetadata,
  ReferenceImage,
  ReferenceImageRole,
} from "@/lib/image-types";

export interface GenerationWorkflowOptions {
  schemaVersion?: number;
  contextPrompt?: string;
  negativePrompt?: string;
  negativeHint?: string;
  workflowPreset?: string;
  workflowPresetLabel?: string;
  promptHint?: string;
  estimatedCredits?: number;
  copies?: number;
  concurrency?: number;
  referenceImageRoles?: Record<string, ReferenceImageRole>;
}

export const WORKFLOW_SCHEMA_VERSION = 2;

function cleanText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function clampInteger(value: number | undefined, min: number, max: number) {
  if (!Number.isFinite(value)) return undefined;
  return Math.max(min, Math.min(max, Math.round(value as number)));
}

function normalizeCredits(value: number | undefined, copies: number | undefined) {
  return clampInteger(value ?? copies ?? 1, 1, 8) ?? 1;
}

export function normalizeGenerationWorkflowMetadata(
  workflow?: GenerationWorkflowMetadata,
): GenerationWorkflowMetadata | undefined {
  if (!workflow || Object.keys(workflow).length === 0) return undefined;
  const copies = clampInteger(workflow.copies, 1, 8);
  const concurrency = clampInteger(workflow.concurrency, 1, 4);
  return {
    ...workflow,
    schemaVersion: workflow.schemaVersion ?? WORKFLOW_SCHEMA_VERSION,
    ...(copies ? { copies } : {}),
    ...(concurrency ? { concurrency } : {}),
    estimatedCredits: normalizeCredits(workflow.estimatedCredits, copies),
  };
}

export function createGenerationWorkflow(
  options: GenerationWorkflowOptions = {},
  referenceImages: ReferenceImage[] = [],
): GenerationWorkflowMetadata | undefined {
  const contextPrompt = cleanText(options.contextPrompt);
  const negativePrompt = cleanText(options.negativePrompt);
  const negativeHint = cleanText(options.negativeHint);
  const workflowPreset = cleanText(options.workflowPreset);
  const workflowPresetLabel = cleanText(options.workflowPresetLabel);
  const promptHint = cleanText(options.promptHint);
  const copies = clampInteger(options.copies, 1, 8);
  const concurrency = clampInteger(options.concurrency, 1, 4);
  const imageMetadata = referenceImages.map((image) => ({
    name: image.name,
    role: image.role ?? options.referenceImageRoles?.[image.id] ?? options.referenceImageRoles?.[image.name] ?? "general",
    size: image.size,
  }));

  const workflow: GenerationWorkflowMetadata = {
    schemaVersion: options.schemaVersion ?? WORKFLOW_SCHEMA_VERSION,
    ...(contextPrompt ? { contextPrompt } : {}),
    ...(negativePrompt ? { negativePrompt } : {}),
    ...(negativeHint ? { negativeHint } : {}),
    ...(workflowPreset ? { workflowPreset } : {}),
    ...(workflowPresetLabel ? { workflowPresetLabel } : {}),
    ...(promptHint ? { promptHint } : {}),
    ...(imageMetadata.length ? { referenceImages: imageMetadata } : {}),
    estimatedCredits: normalizeCredits(options.estimatedCredits, copies),
    ...(copies ? { copies } : {}),
    ...(concurrency ? { concurrency } : {}),
  };

  return Object.keys(workflow).length ? workflow : undefined;
}

export function buildWorkflowPrompt(
  prompt: string,
  workflow?: GenerationWorkflowMetadata,
) {
  const basePrompt = prompt.trim();
  if (!workflow) return basePrompt;

  const sections = [
    workflow.contextPrompt?.trim() ? `Project context:\n${workflow.contextPrompt.trim()}` : "",
    basePrompt ? `Prompt:\n${basePrompt}` : "",
    workflow.workflowPreset?.trim()
      ? `Workflow preset: ${(workflow.workflowPresetLabel ?? workflow.workflowPreset).trim()}`
      : "",
    workflow.promptHint?.trim() ? `Preset guidance:\n${workflow.promptHint.trim()}` : "",
    workflow.referenceImages?.length
      ? `Reference images:\n${workflow.referenceImages
          .map((image) => `- ${image.name} as ${image.role}`)
          .join("\n")}`
      : "",
    [workflow.negativeHint, workflow.negativePrompt].some((item) => item?.trim())
      ? `Avoid:\n${[workflow.negativeHint, workflow.negativePrompt]
          .map((item) => item?.trim())
          .filter(Boolean)
          .join("\n")}`
      : "",
  ].filter(Boolean);

  return sections.join("\n\n");
}
