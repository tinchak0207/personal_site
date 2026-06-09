import type {
  GenerationWorkflowMetadata,
  ReferenceImage,
  ReferenceImageRole,
} from "@/lib/image-types";

export interface GenerationWorkflowOptions {
  contextPrompt?: string;
  negativePrompt?: string;
  workflowPreset?: string;
  copies?: number;
  concurrency?: number;
  referenceImageRoles?: Record<string, ReferenceImageRole>;
}

function cleanText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function clampInteger(value: number | undefined, min: number, max: number) {
  if (!Number.isFinite(value)) return undefined;
  return Math.max(min, Math.min(max, Math.round(value as number)));
}

export function createGenerationWorkflow(
  options: GenerationWorkflowOptions = {},
  referenceImages: ReferenceImage[] = [],
): GenerationWorkflowMetadata | undefined {
  const contextPrompt = cleanText(options.contextPrompt);
  const negativePrompt = cleanText(options.negativePrompt);
  const workflowPreset = cleanText(options.workflowPreset);
  const copies = clampInteger(options.copies, 1, 8);
  const concurrency = clampInteger(options.concurrency, 1, 4);
  const imageMetadata = referenceImages.map((image) => ({
    name: image.name,
    role: image.role ?? options.referenceImageRoles?.[image.id] ?? options.referenceImageRoles?.[image.name] ?? "general",
    size: image.size,
  }));

  const workflow: GenerationWorkflowMetadata = {
    ...(contextPrompt ? { contextPrompt } : {}),
    ...(negativePrompt ? { negativePrompt } : {}),
    ...(workflowPreset ? { workflowPreset } : {}),
    ...(imageMetadata.length ? { referenceImages: imageMetadata } : {}),
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
    workflow.workflowPreset?.trim() ? `Workflow preset: ${workflow.workflowPreset.trim()}` : "",
    workflow.referenceImages?.length
      ? `Reference images:\n${workflow.referenceImages
          .map((image) => `- ${image.name} as ${image.role}`)
          .join("\n")}`
      : "",
    workflow.negativePrompt?.trim() ? `Avoid:\n${workflow.negativePrompt.trim()}` : "",
  ].filter(Boolean);

  return sections.join("\n\n");
}
