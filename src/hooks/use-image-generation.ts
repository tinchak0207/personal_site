import { useEffect, useRef, useState } from "react";
import {
  ImageError,
  ImageResult,
  ProviderTiming,
  ReferenceImage,
  ReferenceImageRole,
} from "@/lib/image-types";
import { initializeProviderRecord, ProviderKey } from "@/lib/provider-config";
import {
  fetchStoredHistory,
  getStoredToken,
  getStoredUser,
  type StoredHistoryEntry,
} from "@/lib/new-api-client";
import {
  mergePersistedHistory,
  type PersistedGenerationEntry,
  readGenerationCache,
  recordGenerationResult,
  selectPersistedHistoryForUser,
  writeGenerationCache,
} from "@/lib/generation-cache";
import {
  WORKFLOW_SCHEMA_VERSION,
  buildWorkflowPrompt,
  createGenerationWorkflow,
} from "@/lib/generation-workflow";
import { LOCAL_TEST_MODE } from "@/lib/sub2api";

interface UseImageGenerationReturn {
  images: ImageResult[];
  errors: ImageError[];
  timings: Record<ProviderKey, ProviderTiming>;
  failedProviders: ProviderKey[];
  isLoading: boolean;
  recentWorkflows: PersistedGenerationEntry[];
  startGeneration: (
    prompt: string,
    providers: ProviderKey[],
    providerToModel: Record<ProviderKey, string>,
    options?: GenerationOptions,
  ) => Promise<ImageResult[]>;
  resetState: () => void;
  activePrompt: string;
}

type GenerationResponse = {
  image?: string | null;
  imageUrl?: string | null;
  endpointLabel?: string;
  error?: string;
};

interface GenerationOptions {
  referenceImages?: ReferenceImage[];
  copies?: number;
  concurrency?: number;
  contextPrompt?: string;
  negativePrompt?: string;
  negativeHint?: string;
  workflowPreset?: string;
  workflowPresetLabel?: string;
  promptHint?: string;
  productionIntent?: string;
  imageSize?: string;
  imageSizes?: string[];
  styleTemplate?: string;
  qualityProfile?: string;
  seedHint?: string;
  regionalPrompts?: Array<{ text: string; weight?: number }>;
  estimatedCredits?: number;
  referenceImageRoles?: Record<string, ReferenceImageRole>;
}

const MAX_RECENT_WORKFLOWS = 6;

function selectRecentWorkflowEntries(entries: PersistedGenerationEntry[]) {
  return entries.filter((entry) => entry.workflow).slice(0, MAX_RECENT_WORKFLOWS);
}

function getGenerationCacheUser() {
  const storedUser = getStoredUser();
  if (storedUser) return { id: storedUser.id, username: storedUser.username };
  if (LOCAL_TEST_MODE) return { id: 0, username: "local-test" };
  return null;
}

function selectLocalHistory(cache: ReturnType<typeof readGenerationCache>, userId?: number) {
  if (userId !== undefined) return selectPersistedHistoryForUser(cache, userId);
  if (!LOCAL_TEST_MODE) return [];
  return Object.values(cache.historyByUser).flat().sort((a, b) => b.generatedAt - a.generatedAt);
}

function mapStoredHistoryEntry(entry: StoredHistoryEntry): PersistedGenerationEntry {
  return {
    id: entry.id,
    prompt: entry.prompt,
    generatedAt: entry.generatedAt,
    results: entry.results.map((result) => ({
      provider: result.provider as ProviderKey,
      modelId: result.modelId,
      image: result.image ?? null,
      imageUrl: result.imageUrl ?? null,
    })),
    source: "server",
    workflow: entry.workflow,
  };
}

async function readGenerationResponse(response: Response): Promise<GenerationResponse> {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as GenerationResponse;
  } catch {
    if (!response.ok) {
      return { error: text.slice(0, 300) };
    }
    throw new Error("Server returned a non-JSON response.");
  }
}

interface UseImageGenerationOptions {
  /** 是否拉取服务端历史（recentWorkflows 仅专业模式使用，可按需关闭以减少首页请求）。默认 true 保持兼容。 */
  enableServerHistory?: boolean;
}

export function useImageGeneration(options?: UseImageGenerationOptions): UseImageGenerationReturn {
  const enableServerHistory = options?.enableServerHistory ?? true;
  const [images, setImages] = useState<ImageResult[]>([]);
  const [errors, setErrors] = useState<ImageError[]>([]);
  const [timings, setTimings] = useState<Record<ProviderKey, ProviderTiming>>(
    initializeProviderRecord<ProviderTiming>(),
  );
  const [failedProviders, setFailedProviders] = useState<ProviderKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activePrompt, setActivePrompt] = useState("");
  const [recentWorkflows, setRecentWorkflows] = useState<PersistedGenerationEntry[]>([]);
  const serverHistorySyncedRef = useRef(false);

  useEffect(() => {
    const cache = readGenerationCache();
    const user = getGenerationCacheUser();
    setRecentWorkflows(selectRecentWorkflowEntries(selectLocalHistory(cache, user?.id)));
    if (!user) return;

    const current = cache.current;
    if (!current || current.userId !== user.id) return;

    setActivePrompt(current.prompt);
    setImages(
      current.results.map((result) => ({
        provider: result.provider,
        image: result.image,
        imageUrl: result.imageUrl,
        modelId: result.modelId,
        endpointLabel: result.endpointLabel,
        workflow: current.workflow,
      })),
    );
  }, []);

  useEffect(() => {
    if (!enableServerHistory || serverHistorySyncedRef.current) return;
    const user = getGenerationCacheUser();
    if (!user) return;
    const token = getStoredToken();
    if (!token) return;

    let cancelled = false;
    fetchStoredHistory(token)
      .then((storedHistory) => {
        if (cancelled || !Array.isArray(storedHistory.data)) return;
        serverHistorySyncedRef.current = true;
        setRecentWorkflows(selectRecentWorkflowEntries(
          mergePersistedHistory(readGenerationCache(), user.id, storedHistory.data.map(mapStoredHistoryEntry)),
        ));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [enableServerHistory]);

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
    options: GenerationOptions = {},
  ) => {
    const referenceImages = options.referenceImages ?? [];
    const copies = Math.max(1, Math.min(8, options.copies ?? 1));
    const concurrency = Math.max(1, Math.min(4, options.concurrency ?? providers.length));
    const workflow = createGenerationWorkflow({
      ...options,
      schemaVersion: WORKFLOW_SCHEMA_VERSION,
      estimatedCredits: options.estimatedCredits ?? copies,
      copies,
      concurrency,
    }, referenceImages);
    const workflowPrompt = buildWorkflowPrompt(prompt, workflow);
    // 多尺寸投放：按槽位轮替分配尺寸，每个槽位携带自己的 workflow（含 imageSize）
    const sizeVariants = (options.imageSizes ?? []).filter((size, index, list) => list.indexOf(size) === index);
    const workflowForSlot = (copyIndex: number) =>
      workflow && sizeVariants.length > 0
        ? { ...workflow, imageSize: sizeVariants[copyIndex % sizeVariants.length] }
        : workflow;
    setActivePrompt(workflowPrompt);
    try {
      setIsLoading(true);
      const slots = providers.flatMap((provider) =>
        Array.from({ length: copies }, (_, copyIndex) => ({
          provider,
          copyIndex,
          slotId: `${provider}-${Date.now()}-${copyIndex}`,
        })),
      );
      // Initialize images array with null values
      setImages(
        slots.map(({ provider, slotId, copyIndex }) => ({
          provider,
          slotId,
          image: null,
          imageUrl: null,
          modelId: providerToModel[provider],
          referenceImageNames: referenceImages.map((image) => image.name),
          workflow: workflowForSlot(copyIndex),
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
      const generateImage = async (
        provider: ProviderKey,
        modelId: string,
        slotId: string,
        slotWorkflow = workflow,
      ) => {
        const startTime = now;
        console.log(
          `Generate image request [provider=${provider}, modelId=${modelId}]`,
        );
        try {
          const request = {
            prompt,
            provider,
            modelId,
            workflow: slotWorkflow,
          };
          const token = getStoredToken();
          const user = getStoredUser();
          const authHeaders: Record<string, string> = {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(user?.id ? { "x-user-id": String(user.id) } : {}),
          };
          let requestBody: BodyInit;
          let requestHeaders: Record<string, string>;

          if (referenceImages.length > 0) {
            const body = new FormData();
            body.append("prompt", prompt);
            body.append("provider", provider);
            body.append("modelId", modelId);
            if (slotWorkflow) {
              body.append("workflow", JSON.stringify(slotWorkflow));
            }
            for (const image of referenceImages) {
              body.append("referenceImages", image.file, image.name);
            }
            requestBody = body;
            requestHeaders = authHeaders;
          } else {
            requestBody = JSON.stringify(request);
            requestHeaders = { ...authHeaders, "Content-Type": "application/json" };
          }

          const response = await fetch("/api/generate-images", {
            method: "POST",
            headers: requestHeaders,
            body: requestBody,
          });
          const data = await readGenerationResponse(response);
          if (!response.ok) {
            throw new Error(
              data.error ||
                (response.status === 504
                  ? "生成超时，请稍后重试。"
                  : `Server error: ${response.status}`),
            );
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
            slotId,
            image: data.image ?? null,
            imageUrl: data.imageUrl ?? null,
            modelId,
            endpointLabel: data.endpointLabel,
            referenceImageNames: referenceImages.map((image) => image.name),
            workflow: slotWorkflow,
          };
          setImages((prevImages) =>
            prevImages.map((item) =>
              item.slotId === slotId ? { ...item, ...result } : item,
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
            slotId,
            image: null,
            imageUrl: null,
            modelId,
            referenceImageNames: referenceImages.map((image) => image.name),
            workflow: slotWorkflow,
          };
          setImages((prevImages) =>
            prevImages.map((item) =>
              item.slotId === slotId ? { ...item, ...result } : item,
            ),
          );
          return result;
        }
      };

      const tasks = slots.map(({ provider, slotId, copyIndex }) => () =>
        generateImage(provider, providerToModel[provider], slotId, workflowForSlot(copyIndex)),
      );
      const completedResults: ImageResult[] = [];
      for (let index = 0; index < tasks.length; index += concurrency) {
        completedResults.push(...await Promise.all(tasks.slice(index, index + concurrency).map((task) => task())));
      }

      const user = getGenerationCacheUser();
      if (user) {
        const updatedCache = recordGenerationResult(readGenerationCache(), {
          userId: user.id,
          username: user.username,
          prompt: workflowPrompt,
          generatedAt: Date.now(),
          results: completedResults,
          workflow,
        });
        writeGenerationCache(updatedCache);
        setRecentWorkflows(selectRecentWorkflowEntries(selectPersistedHistoryForUser(updatedCache, user.id)));
      }
      return completedResults;
    } catch (error) {
      console.error("Error fetching images:", error);
      return [];
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
    recentWorkflows,
    startGeneration,
    resetState,
    activePrompt,
  };
}
