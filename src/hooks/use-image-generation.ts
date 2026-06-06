import { useEffect, useState } from "react";
import { ImageError, ImageResult, ProviderTiming } from "@/lib/image-types";
import { initializeProviderRecord, ProviderKey } from "@/lib/provider-config";
import { getStoredUser } from "@/lib/new-api-client";
import {
  readGenerationCache,
  recordGenerationResult,
  writeGenerationCache,
} from "@/lib/generation-cache";

interface UseImageGenerationReturn {
  images: ImageResult[];
  errors: ImageError[];
  timings: Record<ProviderKey, ProviderTiming>;
  failedProviders: ProviderKey[];
  isLoading: boolean;
  startGeneration: (
    prompt: string,
    providers: ProviderKey[],
    providerToModel: Record<ProviderKey, string>,
  ) => Promise<void>;
  resetState: () => void;
  activePrompt: string;
}

export function useImageGeneration(): UseImageGenerationReturn {
  const [images, setImages] = useState<ImageResult[]>([]);
  const [errors, setErrors] = useState<ImageError[]>([]);
  const [timings, setTimings] = useState<Record<ProviderKey, ProviderTiming>>(
    initializeProviderRecord<ProviderTiming>(),
  );
  const [failedProviders, setFailedProviders] = useState<ProviderKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activePrompt, setActivePrompt] = useState("");

  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;

    const cache = readGenerationCache();
    const current = cache.current;
    if (!current || current.userId !== user.id) return;

    setActivePrompt(current.prompt);
    setImages(
      current.results.map((result) => ({
        provider: result.provider,
        image: result.image,
        imageUrl: result.imageUrl,
        modelId: result.modelId,
      })),
    );
  }, []);

  const resetState = () => {
    setImages([]);
    setErrors([]);
    setTimings(initializeProviderRecord<ProviderTiming>());
    setFailedProviders([]);
    setIsLoading(false);
  };

  const startGeneration = async (
    prompt: string,
    providers: ProviderKey[],
    providerToModel: Record<ProviderKey, string>,
  ) => {
    setActivePrompt(prompt);
    try {
      setIsLoading(true);
      // Initialize images array with null values
      setImages(
        providers.map((provider) => ({
          provider,
          image: null,
          imageUrl: null,
          modelId: providerToModel[provider],
        })),
      );

      // Clear previous state
      setErrors([]);
      setFailedProviders([]);

      // Initialize timings with start times
      const now = Date.now();
      setTimings(
        Object.fromEntries(
          providers.map((provider) => [provider, { startTime: now }]),
        ) as Record<ProviderKey, ProviderTiming>,
      );

      // Helper to fetch a single provider
      const generateImage = async (provider: ProviderKey, modelId: string) => {
        const startTime = now;
        console.log(
          `Generate image request [provider=${provider}, modelId=${modelId}]`,
        );
        try {
          const request = {
            prompt,
            provider,
            modelId,
          };

          const response = await fetch("/api/generate-images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || `Server error: ${response.status}`);
          }

          const completionTime = Date.now();
          const elapsed = completionTime - startTime;
          setTimings((prev) => ({
            ...prev,
            [provider]: {
              startTime,
              completionTime,
              elapsed,
            },
          }));

          console.log(
            `Successful image response [provider=${provider}, modelId=${modelId}, elapsed=${elapsed}ms]`,
          );

          // Update image in state
          const result = {
            provider,
            image: data.image ?? null,
            imageUrl: data.imageUrl ?? null,
            modelId,
          };
          setImages((prevImages) =>
            prevImages.map((item) =>
              item.provider === provider ? { ...item, ...result } : item,
            ),
          );
          return result;
        } catch (err) {
          console.error(
            `Error [provider=${provider}, modelId=${modelId}]:`,
            err,
          );
          setFailedProviders((prev) => [...prev, provider]);
          setErrors((prev) => [
            ...prev,
            {
              provider,
              message:
                err instanceof Error
                  ? err.message
                  : "An unexpected error occurred",
            },
          ]);

          const result = {
            provider,
            image: null,
            imageUrl: null,
            modelId,
          };
          setImages((prevImages) =>
            prevImages.map((item) =>
              item.provider === provider ? { ...item, ...result } : item,
            ),
          );
          return result;
        }
      };

      // Generate images for all active providers
      const fetchPromises = providers.map((provider) => {
        const modelId = providerToModel[provider];
        return generateImage(provider, modelId);
      });

      const completedResults = await Promise.all(fetchPromises);

      const user = getStoredUser();
      if (user) {
        const updatedCache = recordGenerationResult(readGenerationCache(), {
          userId: user.id,
          username: user.username,
          prompt,
          generatedAt: Date.now(),
          results: completedResults,
        });
        writeGenerationCache(updatedCache);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    images,
    errors,
    timings,
    failedProviders,
    isLoading,
    startGeneration,
    resetState,
    activePrompt,
  };
}
