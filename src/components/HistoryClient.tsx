"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Image as ImageIcon, Clock, Coins, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "@/components/AuthModal";

interface LogEntry {
  id: number;
  created_at: number;
  type: number;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  quota: number;
  channel_id: number;
  channel_name?: string;
}

interface LogStat {
  quota: number;
  rpm: number;
  tpm: number;
}

const PAGE_SIZE = 20;
const QUOTA_PER_COIN = 500_000;

function formatTime(ts: number) {
  return new Date(ts * 1000).toLocaleString("zh-HK", {
    month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function quotaToCoins(quota: number) {
  return (quota / QUOTA_PER_COIN).toFixed(3);
}

export function HistoryClient() {
  const { token, isLoggedIn } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stat, setStat] = useState<LogStat | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async (p: number, kw: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        p: String(p), page_size: String(PAGE_SIZE),
        ...(kw ? { model_name: kw } : {}),
      });
      const res = await fetch(`/api/log/self?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLogs(json.data);
        setHasMore(json.data.length === PAGE_SIZE);
      }
    } finally { setLoading(false); }
  }, [token]);

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

  return (
    <>
      <div className="min-h-screen bg-transparent px-4 pb-24 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-4xl">

          <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-ios-footnote text-[rgba(0,0,0,0.44)] lg-transition hover:text-[rgba(0,0,0,0.72)]">
            <ArrowLeft className="h-3.5 w-3.5" />返回做圖
          </Link>

          <div className="mb-8">
            <h1 className="text-ios-large-title font-bold tracking-tight text-[rgba(0,0,0,0.85)]">生成歷史</h1>
            <p className="mt-1 text-ios-body text-[rgba(0,0,0,0.44)]">查看你的所有生成記錄與消耗明細</p>
          </div>

          {stat && (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: "累計消耗", value: quotaToCoins(stat.quota), unit: "張", icon: <Coins className="h-4 w-4 text-[rgba(120,90,20,0.60)]" /> },
                { label: "請求速率", value: stat.rpm, unit: "rpm", icon: null },
                { label: "Token 速率", value: stat.tpm.toLocaleString(), unit: "tpm", icon: null, wide: true },
              ].map(({ label, value, unit, icon, wide }) => (
                <div key={label} className={`lg-card relative overflow-hidden rounded-ios-3xl p-4${wide ? " col-span-2 sm:col-span-1" : ""}`}>
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
                  <p className="text-ios-caption1 text-[rgba(0,0,0,0.36)]">{label}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    {icon}
                    <span className="text-ios-title2 font-bold text-[rgba(0,0,0,0.85)]">{value}</span>
                    <span className="text-ios-caption1 text-[rgba(0,0,0,0.36)]">{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[rgba(0,0,0,0.28)]" />
              <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="搜尋模型名稱…"
                className="w-full rounded-ios-xl border-0 bg-[rgba(0,0,0,0.04)] py-2.5 pl-9 pr-4 text-ios-footnote text-[rgba(0,0,0,0.85)] placeholder:text-[rgba(0,0,0,0.24)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,122,255,0.20)] [background-image:none]"
              />
            </div>
            <button type="button" onClick={handleSearch}
              className="rounded-ios-xl bg-[rgba(0,0,0,0.06)] px-4 py-2.5 text-ios-footnote font-medium text-[rgba(0,0,0,0.56)] transition-all hover:bg-[rgba(0,0,0,0.10)]">
              搜尋
            </button>
          </div>

          {/* Log list */}
          <section className="lg-card relative overflow-hidden rounded-ios-4xl">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[rgba(0,122,255,0.30)] border-t-[#007AFF]" />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <ImageIcon className="h-10 w-10 text-[rgba(0,0,0,0.16)]" />
                <p className="text-ios-body text-[rgba(0,0,0,0.36)]">還沒有生成記錄</p>
                <Link href="/" className="text-ios-footnote text-[rgba(0,122,255,0.80)] hover:text-[#007AFF]">去做圖 →</Link>
              </div>
            ) : (
              <div className="divide-y divide-[rgba(0,0,0,0.05)]">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[rgba(0,0,0,0.02)] transition-colors">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ios-lg bg-[rgba(0,122,255,0.08)]">
                      <ImageIcon className="h-4 w-4 text-[rgba(0,122,255,0.60)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-ios-footnote font-medium text-[rgba(0,0,0,0.72)]">{log.model}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Clock className="h-3 w-3 text-[rgba(0,0,0,0.28)]" />
                        <span className="text-ios-caption2 text-[rgba(0,0,0,0.36)]">{formatTime(log.created_at)}</span>
                        {log.channel_name && <span className="text-ios-caption2 text-[rgba(0,0,0,0.28)]">· {log.channel_name}</span>}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1">
                      <Coins className="h-3 w-3 text-[rgba(120,90,20,0.50)]" />
                      <span className="text-ios-caption1 font-semibold text-[rgba(0,0,0,0.56)]">{quotaToCoins(log.quota)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Pagination */}
          {(page > 0 || hasMore) && (
            <div className="mt-4 flex items-center justify-between">
              <button type="button" onClick={prevPage} disabled={page === 0}
                className="flex items-center gap-1.5 rounded-ios-xl px-4 py-2 text-ios-footnote font-medium text-[rgba(0,0,0,0.44)] transition-all hover:text-[rgba(0,0,0,0.72)] disabled:opacity-30">
                <ChevronLeft className="h-4 w-4" />上一頁
              </button>
              <span className="text-ios-caption1 text-[rgba(0,0,0,0.36)]">第 {page + 1} 頁</span>
              <button type="button" onClick={nextPage} disabled={!hasMore}
                className="flex items-center gap-1.5 rounded-ios-xl px-4 py-2 text-ios-footnote font-medium text-[rgba(0,0,0,0.44)] transition-all hover:text-[rgba(0,0,0,0.72)] disabled:opacity-30">
                下一頁<ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultTab="login" />
    </>
  );
}
