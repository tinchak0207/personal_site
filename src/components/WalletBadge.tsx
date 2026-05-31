"use client";

import { useState, useEffect } from "react";
import { Coins, ExternalLink, Gift, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { quotaToCoins, fetchCheckinStatus, doCheckin } from "@/lib/new-api-client";
import { cn } from "@/lib/utils";

interface WalletBadgeProps {
  className?: string;
  showTopUp?: boolean;
}

export function WalletBadge({ className, showTopUp = true }: WalletBadgeProps) {
  const { user, token, isLoggedIn, refresh } = useAuth();
  const [canCheckin, setCanCheckin] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinDone, setCheckinDone] = useState(false);

  // Check checkin status on mount
  useEffect(() => {
    if (!token) return;
    fetchCheckinStatus(token)
      .then((res) => { if (res.success && res.data) setCanCheckin(res.data.can_checkin); })
      .catch(() => {});
  }, [token]);

  if (!isLoggedIn || !user) return null;

  const coins = quotaToCoins(user.quota);

  const handleCheckin = async () => {
    if (!token || checkinLoading || !canCheckin) return;
    setCheckinLoading(true);
    try {
      const res = await doCheckin(token);
      if (res.success) {
        setCanCheckin(false);
        setCheckinDone(true);
        // Refresh quota display
        await refresh();
      }
    } catch { /* ignore */ }
    finally { setCheckinLoading(false); }
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {/* Coin balance */}
      <div className="coin-badge cursor-default select-none" aria-label={`餘額 ${coins} 硬幣`}>
        <Coins className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="tabular-nums">{coins.toLocaleString()}</span>
        <span className="text-[rgba(184,134,11,0.6)] text-[0.7rem]">幣</span>
      </div>

      {/* Daily checkin button */}
      {canCheckin && !checkinDone && (
        <button
          type="button"
          onClick={handleCheckin}
          disabled={checkinLoading}
          className="lg-tint-green inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-ios-caption1 font-semibold text-[#34C759] lg-transition hover:opacity-80 cursor-pointer disabled:opacity-50"
          aria-label="每日簽到領取硬幣"
          title="每日簽到"
        >
          <Gift className="h-3 w-3" aria-hidden="true" />
          簽到
        </button>
      )}

      {/* Checkin done indicator (fades after 3s) */}
      {checkinDone && (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-ios-caption2 text-[#34C759]">
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
          已簽到
        </span>
      )}

      {/* Top-up link */}
      {showTopUp && (
        <a
          href="https://store.tinchak0207.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="lg-float inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-ios-caption1 font-semibold text-[#007AFF] lg-transition hover:text-[#0066DD] cursor-pointer"
          aria-label="前往充值"
        >
          充值
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
