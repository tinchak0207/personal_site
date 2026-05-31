"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, User } from "lucide-react";
import { WalletBadge } from "@/components/WalletBadge";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const { user, isLoggedIn, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  const openLogin    = () => { setAuthTab("login");    setAuthOpen(true); };
  const openRegister = () => { setAuthTab("register"); setAuthOpen(true); };

  return (
    <>
      <header
        className={cn(
          "pointer-events-none fixed inset-x-0 top-3 z-40 flex justify-center px-3 sm:top-4 sm:px-4",
          className,
        )}
      >
        <nav
          className="lg-bar pointer-events-auto flex w-full max-w-[1660px] items-center justify-between rounded-ios-3xl px-4 py-2.5 sm:px-5"
          aria-label="主導航"
        >
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 lg-transition hover:opacity-70"
            aria-label="回到首頁"
          >
            {/* iOS-style app icon grid */}
            <div className="lg-float flex h-8 w-8 items-center justify-center rounded-ios-lg">
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
          <div className="flex items-center gap-3">
            {isLoggedIn && user ? (
              <>
                <WalletBadge showTopUp />

                {/* User pill */}
                <div className="lg-float flex items-center gap-1.5 rounded-full px-3 py-1.5">
                  <User className="h-3.5 w-3.5 text-[rgba(0,0,0,0.44)]" aria-hidden="true" />
                  <span className="max-w-[88px] truncate text-ios-footnote font-medium text-[rgba(0,0,0,0.56)]">
                    {user.display_name || user.username}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="lg-float flex h-8 w-8 items-center justify-center rounded-full text-[rgba(0,0,0,0.44)] lg-transition hover:text-[rgba(0,0,0,0.72)] cursor-pointer"
                  aria-label="登出"
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
                  登錄
                </button>
                <button
                  type="button"
                  onClick={openRegister}
                  className="rounded-full bg-[#007AFF] px-4 py-2 text-ios-footnote font-semibold text-white shadow-[0_4px_16px_rgba(0,122,255,0.28)] lg-transition hover:bg-[#0066DD] hover:shadow-[0_6px_20px_rgba(0,122,255,0.36)] cursor-pointer"
                >
                  免費注冊
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab={authTab}
      />
    </>
  );
}
