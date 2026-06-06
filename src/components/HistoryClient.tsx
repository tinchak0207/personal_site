"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, ImageIcon, Clock, Coins,
  ChevronLeft, ChevronRight, Search, TrendingUp, Zap, BarChart3,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "@/components/AuthModal";
import {
  mergePersistedHistory,
  readGenerationCache,
  type PersistedGenerationEntry,
} from "@/lib/generation-cache";
import { fetchStoredHistory } from "@/lib/new-api-client";

interface LogEntry {
  id: number | string;
  created_at: number;
  model: string;
  quota: number;
  channel_name?: string;
  prompt?: string;
  image?: string | null;
  imageUrl?: string | null;
  source?: "server" | "local";
}

interface LogStat {
  quota: number;
  rpm: number;
  tpm: number;
}

const PAGE_SIZE = 20;
const QUOTA_PER_COIN = 500_000;

function formatTime(ts: number) {
  return new Date(ts * 1000).toLocaleString("zh-CN", {
    month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function quotaToCoins(quota: number) {
  return (quota / QUOTA_PER_COIN).toFixed(3);
}

export function HistoryClient() {
  const { token, isLoggedIn, user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stat, setStat] = useState<LogStat | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async (p: number, kw: string) => {
    if (!token || !user) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        p: String(p),
        page_size: String(PAGE_SIZE),
        ...(kw ? { model_name: kw } : {}),
      });
      const res = await fetch(`/api/log/self?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const [json, storedHistory] = await Promise.all([
        res.json(),
        fetchStoredHistory(token),
      ]);

      if (json.success && Array.isArray(json.data)) {
        const logEntries: PersistedGenerationEntry[] = json.data.map((item: LogEntry) => ({
          id: `server-${item.id}`,
          prompt: item.prompt ?? item.model,
          generatedAt: item.created_at * 1000,
          results: item.image || item.imageUrl ? [{
            provider: "image_tinchak",
            modelId: item.model,
            image: item.image ?? null,
            imageUrl: item.imageUrl ?? null,
          }] : [],
          source: "server",
        }));

        const persistedEntries: PersistedGenerationEntry[] = Array.isArray(storedHistory.data)
          ? storedHistory.data.map((entry) => ({
              id: entry.id,
              prompt: entry.prompt,
              generatedAt: entry.generatedAt,
              results: entry.results.map((result) => ({
                provider: result.provider as "image_tinchak",
                modelId: result.modelId,
                image: result.image ?? null,
                imageUrl: result.imageUrl ?? null,
              })),
              source: "server",
            }))
          : [];

        const merged = mergePersistedHistory(
          readGenerationCache(),
          user.id,
          [...persistedEntries, ...logEntries],
        );
        const visible = merged
          .filter((entry) => !kw || entry.prompt.includes(kw) || entry.results.some((result) => result.modelId.includes(kw)))
          .slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE)
          .map((entry) => ({
            id: entry.id,
            created_at: Math.floor(entry.generatedAt / 1000),
            model: entry.results[0]?.modelId ?? "gpt-image-2",
            quota: 0,
            prompt: entry.prompt,
            image: entry.results[0]?.image ?? null,
            imageUrl: entry.results[0]?.imageUrl ?? null,
            source: entry.source,
          }));

        setLogs(visible);
        setHasMore(merged.length > (p + 1) * PAGE_SIZE);
      }
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  const fetchStat = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/log/self/stat", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) setStat(json.data);
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => {
    if (!isLoggedIn) { setAuthOpen(true); return; }
    fetchLogs(page, search);
  }, [isLoggedIn, page, search, fetchLogs]);

  useEffect(() => {
    if (isLoggedIn) fetchStat();
  }, [isLoggedIn, fetchStat]);

  const handleSearch = () => { setPage(0); setSearch(keyword); };
  const prevPage = () => setPage((p) => Math.max(0, p - 1));
  const nextPage = () => { if (hasMore) setPage((p) => p + 1); };

  const statCards = [
    {
      label: "累计消耗",
      value: stat ? quotaToCoins(stat.quota) : "—",
      unit: "张",
      icon: <Coins className="h-4 w-4 text-[rgba(120,90,20,0.55)]" />,
    },
    {
      label: "请求速率",
      value: stat ? String(stat.rpm) : "—",
      unit: "rpm",
      icon: <Zap className="h-4 w-4 text-[rgba(0,122,255,0.55)]" />,
    },
    {
      label: "Token 速率",
      value: stat ? stat.tpm.toLocaleString() : "—",
      unit: "tpm",
      icon: <BarChart3 className="h-4 w-4 text-[rgba(52,199,89,0.65)]" />,
      wide: true,
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-transparent px-4 pb-24 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl">

          {/* Back */}
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-ios-footnote text-[rgba(0,0,0,0.40)] lg-transition hover:text-[rgba(0,0,0,0.65)] cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回做图
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-ios-xl bg-[rgba(0,122,255,0.10)]">
                <TrendingUp className="h-4.5 w-4.5 text-[#007AFF]" />
              </div>
              <h1 className="text-ios-large-title font-bold tracking-tight text-[rgba(0,0,0,0.85)]">生成历史</h1>
            </div>
            <p className="ml-12 text-ios-footnote text-[rgba(0,0,0,0.40)]">查看所有生成记录和消耗明细</p>
          </div>

          {/* Stat cards */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            {statCards.map(({ label, value, unit, icon, wide }) => (
              <div
                key={label}
                className={`lg-card relative overflow-hidden rounded-ios-3xl p-4${
                  wide ? " col-span-3 sm:col-span-1" : ""
                }`}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-70" />
                <div className="flex items-center gap-1.5 mb-2">
                  {icon}
                  <p className="text-ios-caption1 font-medium text-[rgba(0,0,0,0.40)]">{label}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[1.5rem] font-bold leading-none tracking-tight text-[rgba(0,0,0,0.82)]">{value}</span>
                  <span className="text-ios-caption1 text-[rgba(0,0,0,0.32)]">{unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[rgba(0,0,0,0.28)]" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="搜索模型名称…"
                className="w-full rounded-ios-xl border-0 bg-[rgba(0,0,0,0.05)] py-2.5 pl-9 pr-4 text-ios-footnote text-[rgba(0,0,0,0.85)] placeholder:text-[rgba(0,0,0,0.24)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,122,255,0.20)] [background-image:none]"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="rounded-ios-xl bg-[rgba(0,0,0,0.06)] px-4 py-2.5 text-ios-footnote font-medium text-[rgba(0,0,0,0.56)] transition-all duration-200 hover:bg-[rgba(0,0,0,0.10)] cursor-pointer"
            >
              搜索
            </button>
          </div>

          {/* Log list */}
          <section className="lg-card relative overflow-hidden rounded-ios-4xl">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-70" />

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[rgba(0,122,255,0.20)] border-t-[#007AFF]" />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-ios-2xl bg-[rgba(0,0,0,0.04)]">
                  <ImageIcon className="h-6 w-6 text-[rgba(0,0,0,0.20)]" />
                </div>
                <div>
                  <p className="text-ios-body font-medium text-[rgba(0,0,0,0.50)]">还没有生成记录</p>
                  <p className="mt-1 text-ios-footnote text-[rgba(0,0,0,0.30)]">做图后会显示在这里</p>
                </div>
                <Link
                  href="/"
                  className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#007AFF] px-5 py-2 text-ios-footnote font-semibold text-white shadow-[0_4px_16px_rgba(0,122,255,0.30)] transition-all hover:bg-[#0066DD] cursor-pointer"
                >
                  去做图
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[rgba(0,0,0,0.04)]">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-[rgba(0,0,0,0.015)]">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ios-lg bg-[rgba(0,122,255,0.08)]">
                      <ImageIcon className="h-3.5 w-3.5 text-[rgba(0,122,255,0.55)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-ios-footnote font-medium text-[rgba(0,0,0,0.75)]">{log.prompt || log.model}</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <Clock className="h-2.5 w-2.5 text-[rgba(0,0,0,0.25)]" />
                        <span className="text-ios-caption2 text-[rgba(0,0,0,0.35)]">{formatTime(log.created_at)}</span>
                        {log.channel_name && (
                          <span className="text-ios-caption2 text-[rgba(0,0,0,0.25)]">· {log.channel_name}</span>
                        )}
                        {log.source === "local" && (
                          <span className="text-ios-caption2 text-[rgba(0,0,0,0.25)]">· 本地缓存</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1">
                      {(log.image || log.imageUrl) ? (
                        <div className="h-10 w-10 overflow-hidden rounded-ios-lg border border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.03)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={log.image ? `data:image/png;base64,${log.image}` : (log.imageUrl ?? undefined)}
                            alt="历史图片预览"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <>
                          <Coins className="h-3 w-3 text-[rgba(120,90,20,0.45)]" />
                          <span className="text-ios-caption1 font-semibold tabular-nums text-[rgba(0,0,0,0.55)]">{quotaToCoins(log.quota)}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Pagination — only show when there's data */}
          {logs.length > 0 && (page > 0 || hasMore) && (
            <div className="mt-4 flex items-center justify-between px-1">
              <button
                type="button"
                onClick={prevPage}
                disabled={page === 0}
                className="flex items-center gap-1.5 rounded-ios-xl px-4 py-2 text-ios-footnote font-medium text-[rgba(0,0,0,0.44)] transition-all duration-200 hover:text-[rgba(0,0,0,0.72)] disabled:opacity-25 cursor-pointer disabled:cursor-default"
              >
                <ChevronLeft className="h-4 w-4" />上一页
              </button>
              <span className="text-ios-caption1 text-[rgba(0,0,0,0.32)]">第 {page + 1} 页</span>
              <button
                type="button"
                onClick={nextPage}
                disabled={!hasMore}
                className="flex items-center gap-1.5 rounded-ios-xl px-4 py-2 text-ios-footnote font-medium text-[rgba(0,0,0,0.44)] transition-all duration-200 hover:text-[rgba(0,0,0,0.72)] disabled:opacity-25 cursor-pointer disabled:cursor-default"
              >
                下一页<ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultTab="login" />
    </>
  );
}
