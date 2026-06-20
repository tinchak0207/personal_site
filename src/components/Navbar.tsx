"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, User, History, CreditCard } from "lucide-react";
import { WalletBadge } from "@/components/WalletBadge";
import { CheckinCalendar } from "@/components/CheckinCalendar";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/hooks/use-auth";
import { LOCAL_TEST_MODE } from "@/lib/sub2api";
import { cn } from "@/lib/utils";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const { user, isLoggedIn, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMounted, setAuthMounted] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  const openLogin    = () => { setAuthTab("login");    setAuthMounted(true); setAuthOpen(true); };
  const openRegister = () => { setAuthTab("register"); setAuthMounted(true); setAuthOpen(true); };

  return (
    <>
      <header
        className={cn(
          "pointer-events-none fixed inset-x-0 top-3 z-40 flex justify-center px-3 sm:top-4 sm:px-4",
          className,
        )}
      >
        <nav
          className="lg-bar pointer-events-auto flex w-full max-w-[1660px] items-center justify-between gap-2 rounded-ios-3xl px-2.5 py-2 sm:px-5 sm:py-2.5"
          aria-label="主导航"
        >
          <Link
            href="/"
            className="flex min-w-0 shrink-0 items-center gap-2.5 lg-transition hover:opacity-70"
            aria-label="回到首页"
          >
            {/* iOS-style app icon grid */}
            <div className="lg-float flex h-9 w-9 shrink-0 items-center justify-center rounded-ios-lg sm:h-8 sm:w-8">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="1" y="1" width="6" height="6" rx="1.5" fill="#1d1d1f" opacity="0.85"/>
                <rect x="9" y="1" width="6" height="6" rx="1.5" fill="#007AFF" opacity="0.85"/>
                <rect x="1" y="9" width="6" height="6" rx="1.5" fill="#007AFF" opacity="0.45"/>
                <rect x="9" y="9" width="6" height="6" rx="1.5" fill="#1d1d1f" opacity="0.45"/>
              </svg>
            </div>
            <span className="hidden text-ios-subhead font-semibold tracking-tight text-[rgba(0,0,0,0.85)] sm:inline">
              Image Studio
            </span>
          </Link>

          {/* Right side */}
          <div
            className={cn(
              "mobile-nav-actions flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:flex-none sm:gap-3",
              isLoggedIn && user
                ? ""
                : "flex-none gap-2",
            )}
          >
            {LOCAL_TEST_MODE ? (
              <div className="lg-float rounded-full px-4 py-2 text-ios-footnote font-medium text-[rgba(0,0,0,0.56)]">
                Local Test Mode
              </div>
            ) : isLoggedIn && user ? (
              <>
                <WalletBadge showTopUp={false} showCheckin={false} className="mobile-wallet-balance min-w-0 flex-1 sm:flex-none" />
                <CheckinCalendar className="shrink-0" />

                {/* Nav links */}
                <Link
                  href="/history"
                  className="lg-float flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[rgba(0,0,0,0.52)] lg-transition hover:text-[rgba(0,0,0,0.78)] sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3 sm:py-1.5"
                  aria-label="历史"
                >
                  <History className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only sm:not-sr-only text-ios-footnote font-medium">历史</span>
                </Link>
                <Link
                  href="/pricing"
                  className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#007AFF] px-3 text-ios-footnote font-semibold text-white shadow-[0_4px_16px_rgba(0,122,255,0.26)] lg-transition hover:bg-[#0066DD] sm:h-auto sm:px-3 sm:py-1.5"
                >
                  <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
                  充值
                </Link>

                {/* User pill */}
                <div className="lg-float hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 sm:flex">
                  <User className="h-3.5 w-3.5 text-[rgba(0,0,0,0.44)]" aria-hidden="true" />
                  <span className="max-w-[88px] truncate text-ios-footnote font-medium text-[rgba(0,0,0,0.56)]">
                    {user.display_name || user.username}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="lg-float hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-[rgba(0,0,0,0.44)] lg-transition hover:text-[rgba(0,0,0,0.72)] cursor-pointer sm:flex"
                  aria-label="退出登录"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={openLogin}
                  className="lg-float rounded-full px-4 py-2 text-ios-footnote font-medium text-[rgba(0,0,0,0.56)] lg-transition hover:text-[rgba(0,0,0,0.85)] cursor-pointer"
                >
                  登录
                </button>
                <button
                  type="button"
                  onClick={openRegister}
                  className="rounded-full bg-[#007AFF] px-4 py-2 text-ios-footnote font-semibold text-white shadow-[0_4px_16px_rgba(0,122,255,0.28)] lg-transition hover:bg-[#0066DD] hover:shadow-[0_6px_20px_rgba(0,122,255,0.36)] cursor-pointer"
                >
                  免费注册
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      {authMounted && (
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          defaultTab={authTab}
        />
      )}
    </>
  );
}
