import type { ProviderKey } from "./provider-config";

export interface PersistedGenerationResult {
  provider: ProviderKey;
  modelId: string;
  image: string | null;
  imageUrl: string | null;
  endpointLabel?: string;
}

export interface PersistedGenerationEntry {
  id: string;
  prompt: string;
  generatedAt: number;
  results: PersistedGenerationResult[];
  source: "local" | "server";
}

export interface PersistedGenerationCurrent extends PersistedGenerationEntry {
  userId: number;
  username: string;
}

export interface PersistedGenerationCache {
  current: PersistedGenerationCurrent | null;
  historyByUser: Record<string, PersistedGenerationEntry[]>;
}

interface RecordGenerationInput {
  userId: number;
  username: string;
  prompt: string;
  generatedAt: number;
  results: PersistedGenerationResult[];
}

const MAX_HISTORY_PER_USER = 20;
const STORAGE_KEY = "image_generation_cache_v1";

export function createEmptyGenerationCache(): PersistedGenerationCache {
  return {
    current: null,
    historyByUser: {},
  };
}

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readGenerationCache(): PersistedGenerationCache {
  if (!isBrowser()) return createEmptyGenerationCache();

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return createEmptyGenerationCache();

  try {
    return JSON.parse(raw) as PersistedGenerationCache;
  } catch {
    return createEmptyGenerationCache();
  }
}

export function writeGenerationCache(cache: PersistedGenerationCache): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stripImagePayloads(cache)));
    } catch {
      // Cache is best-effort; generation must not fail because localStorage is full.
    }
  }
}

function stripImagePayloads(cache: PersistedGenerationCache): PersistedGenerationCache {
  const stripEntry = <T extends PersistedGenerationEntry>(entry: T): T => ({
    ...entry,
    results: entry.results.map((result) => ({ ...result, image: null })),
  });

  return {
    current: cache.current ? stripEntry(cache.current) : null,
    historyByUser: Object.fromEntries(
      Object.entries(cache.historyByUser).map(([userId, entries]) => [
        userId,
        entries.map(stripEntry),
      ]),
    ),
  };
}

export function recordGenerationResult(
  cache: PersistedGenerationCache,
  input: RecordGenerationInput,
): PersistedGenerationCache {
  const entry: PersistedGenerationEntry = {
    id: `${input.userId}-${input.generatedAt}`,
    prompt: input.prompt,
    generatedAt: input.generatedAt,
    results: input.results,
    source: "local",
  };

  const userKey = String(input.userId);
  const nextUserHistory = [entry, ...(cache.historyByUser[userKey] ?? [])]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, MAX_HISTORY_PER_USER);

  return {
    current: {
      ...entry,
      userId: input.userId,
      username: input.username,
    },
    historyByUser: {
      ...cache.historyByUser,
      [userKey]: nextUserHistory,
    },
  };
}

export function selectPersistedHistoryForUser(
  cache: PersistedGenerationCache,
  userId: number,
): PersistedGenerationEntry[] {
  return cache.historyByUser[String(userId)] ?? [];
}

export function mergePersistedHistory(
  cache: PersistedGenerationCache,
  userId: number,
  serverEntries: PersistedGenerationEntry[],
): PersistedGenerationEntry[] {
  const localEntries = selectPersistedHistoryForUser(cache, userId);
  const merged = [...localEntries, ...serverEntries];

  return merged
    .filter((entry, index, entries) => entries.findIndex((candidate) => candidate.id === entry.id) === index)
    .sort((a, b) => b.generatedAt - a.generatedAt);
}
