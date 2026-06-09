import { put } from "@vercel/blob";
import type { GenerationWorkflowMetadata } from "./image-types";

export interface ServerHistoryImageResult {
  provider: string;
  modelId: string;
  image?: string | null;
  imageUrl?: string | null;
  endpointLabel?: string;
}

export interface ServerHistoryEntry {
  id: string;
  userId: number;
  prompt: string;
  generatedAt: number;
  results: ServerHistoryImageResult[];
  workflow?: GenerationWorkflowMetadata;
}

const memoryStore = new Map<number, ServerHistoryEntry[]>();
const MAX_HISTORY_PER_USER = 20;

function hasBlobStore() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function historyBlobPath(userId: number) {
  return `history/${userId}.json`;
}

function imageBlobPath(userId: number, entryId: string, provider: string) {
  return `history/${userId}/${entryId}-${provider}.png`;
}

async function readBlobHistory(userId: number): Promise<ServerHistoryEntry[]> {
  const response = await fetch(`https://blob.vercel-storage.com/${historyBlobPath(userId)}`, {
    headers: {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    },
    cache: "no-store",
  });

  if (!response.ok) return [];
  return response.json() as Promise<ServerHistoryEntry[]>;
}

async function writeBlobHistory(userId: number, entries: ServerHistoryEntry[]): Promise<void> {
  await put(historyBlobPath(userId), JSON.stringify(entries), {
    access: "public",
    contentType: "application/json",
    allowOverwrite: true,
  });
}

async function persistImages(entry: ServerHistoryEntry): Promise<ServerHistoryEntry> {
  const nextResults = await Promise.all(entry.results.map(async (result) => {
    if (!result.image) return result;

    const bytes = Buffer.from(result.image, "base64");
    const blob = await put(imageBlobPath(entry.userId, entry.id, result.provider), bytes, {
      access: "public",
      contentType: "image/png",
      allowOverwrite: true,
    });

    return {
      ...result,
      image: null,
      imageUrl: blob.url,
    };
  }));

  return {
    ...entry,
    results: nextResults,
  };
}

export async function saveGeneratedHistoryEntry(entry: ServerHistoryEntry): Promise<void> {
  if (!hasBlobStore()) {
    const items = memoryStore.get(entry.userId) ?? [];
    memoryStore.set(entry.userId, [entry, ...items].slice(0, MAX_HISTORY_PER_USER));
    return;
  }

  const persistedEntry = await persistImages(entry);
  const current = await readBlobHistory(entry.userId);
  const next = [persistedEntry, ...current]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, MAX_HISTORY_PER_USER);
  await writeBlobHistory(entry.userId, next);
}

export async function listGeneratedHistoryEntries(userId: number): Promise<ServerHistoryEntry[]> {
  if (!hasBlobStore()) {
    return memoryStore.get(userId) ?? [];
  }

  return readBlobHistory(userId);
}
