import { ProviderKey } from "./provider-config";

export interface ReferenceImage {
  id: string;
  name: string;
  file: File;
  previewUrl: string;
  size: number;
  role?: ReferenceImageRole;
}

export type ReferenceImageRole =
  | "style"
  | "character"
  | "composition"
  | "product"
  | "face"
  | "general";

export interface ReferenceImageMetadata {
  name: string;
  role: ReferenceImageRole;
  size?: number;
}

export interface GenerationWorkflowMetadata {
  contextPrompt?: string;
  negativePrompt?: string;
  workflowPreset?: string;
  referenceImages?: ReferenceImageMetadata[];
  copies?: number;
  concurrency?: number;
}

export interface GeneratedImage {
  provider: ProviderKey;
  slotId?: string;
  image: string | null;
  imageUrl?: string | null;
  modelId?: string;
  endpointLabel?: string;
  referenceImageNames?: string[];
  workflow?: GenerationWorkflowMetadata;
}

export interface ImageResult {
  provider: ProviderKey;
  slotId?: string;
  image: string | null;
  imageUrl: string | null;
  modelId: string;
  endpointLabel?: string;
  referenceImageNames?: string[];
  workflow?: GenerationWorkflowMetadata;
}

export interface ImageError {
  provider: ProviderKey;
  message: string;
}

export interface ProviderTiming {
  startTime?: number;
  completionTime?: number;
  elapsed?: number;
  durationMs?: number;
}
