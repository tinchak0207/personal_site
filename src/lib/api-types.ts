import { ProviderKey } from "./provider-config";

export interface GenerateImageRequest {
  prompt: string;
  provider: ProviderKey;
  modelId: string;
}

export interface GenerateImageResponse {
  image?: string;
  imageUrl?: string;
  error?: string;
}
