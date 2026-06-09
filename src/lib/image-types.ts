import { ProviderKey } from "./provider-config";

export interface GeneratedImage {
  provider: ProviderKey;
  image: string | null;
  imageUrl?: string | null;
  modelId?: string;
  endpointLabel?: string;
}

export interface ImageResult {
  provider: ProviderKey;
  image: string | null;
  imageUrl?: string | null;
  modelId?: string;
  endpointLabel?: string;
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
