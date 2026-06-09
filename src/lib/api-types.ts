import { ProviderKey } from "./provider-config";
import type { GenerationWorkflowMetadata } from "./image-types";

export interface GenerateImageRequest {
  prompt: string;
  provider: ProviderKey;
  modelId: string;
  referenceImages?: File[];
  workflow?: GenerationWorkflowMetadata;
}

export interface GenerateImageResponse {
  image?: string;
  imageUrl?: string;
  endpointLabel?: string;
  error?: string;
}
