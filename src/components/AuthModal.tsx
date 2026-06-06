"use client";

import { useState } from "react";
import { X, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { login, register } from "@/lib/auth-client";
import { useAuth } from "@/hooks/use-auth";
import { useTurnstile } from "@/hooks/use-turnstile";
import { cn } from "@/lib/utils";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({ open, onClose, defaultTab = "login" }: AuthModalProps) {
  const { setAuth } = useAuth();
  const { containerRef: turnstileRef, token: turnstileToken, reset: resetTurnstile, enabled: turnstileEnabled } = useTurnstile();
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setUsername(""); setPassword(""); setEmail("");
    setError(null); setIsLoading(false);
    resetTurnstile();
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("请填写账号和密码");
      return;
    }
    setIsLoading(true);
    setError(null);

    const result = tab === "login"
      ? await login(username, password)
      : await register(username, password, email || undefined, turnstileToken ?? undefined);

    setIsLoading(false);

    if (!result.ok) {
      setError(result.error ?? "操作失败");
      return;
    }

    if (result.token && result.user) setAuth(result.token, result.user);
    handleClose();
  };

  return (
    /* iOS-style sheet presentation */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-0 sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-label={tab === "login" ? "登录" : "注册"}
    >
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Sheet — slides up from bottom on mobile, centered on desktop */}
      <div className="lg-sheet relative w-full max-w-[440px] rounded-t-ios-4xl sm:rounded-ios-4xl px-6 pb-10 pt-6 sm:px-8 sm:py-8 animate-lg-appear">

        {/* Drag handle (mobile) */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[rgba(0,0,0,0.18)] sm:hidden" aria-hidden="true" />

        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-5 top-5 lg-float flex h-8 w-8 items-center justify-center rounded-full text-[rgba(0,0,0,0.44)] lg-transition hover:text-[rgba(0,0,0,0.72)] cursor-pointer"
          aria-label="关闭"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Tab switcher — iOS segmented control style */}
        <div className="lg-float mb-6 inline-flex rounded-full p-1">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(null); }}
              className={cn(
                "rounded-full px-5 py-2 text-ios-footnote font-semibold lg-transition cursor-pointer",
                tab === t
                  ? "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.10)] text-[rgba(0,0,0,0.85)]"
                  : "text-[rgba(0,0,0,0.44)] hover:text-[rgba(0,0,0,0.72)]",
              )}
            >
              {t === "login" ? "登录" : "注册"}
            </button>
          ))}
        </div>

        <div className="mb-4 space-y-3">
          <a
            href="/api/auth/github/start"
            className="inline-flex w-full items-center justify-center gap-2 rounded-ios-xl border border-[rgba(0,0,0,0.10)] bg-[rgba(0,0,0,0.03)] px-5 py-3.5 text-ios-body font-semibold text-[rgba(0,0,0,0.78)] transition-all duration-200 hover:bg-[rgba(0,0,0,0.06)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.58 2 12.24c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-1.03-.01-1.87-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.64-1.38-2.22-.26-4.55-1.14-4.55-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.72 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85 0 1.71.12 2.51.36 1.91-1.33 2.75-1.05 2.75-1.05.55 1.42.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.95-2.33 4.82-4.56 5.08.36.32.69.94.69 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.07 10.07 0 0 0 22 12.24C22 6.58 17.52 2 12 2Z" />
            </svg>
            用 GitHub 登录
          </a>
          <p className="text-center text-ios-caption2 text-[rgba(0,0,0,0.36)]">
            新用户可直接用 GitHub 登录，账号密码登录照常保留
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          {/* Username */}
          <div className="space-y-1.5">
            <label htmlFor="auth-username" className="text-ios-caption1 font-semibold uppercase tracking-widest text-[rgba(0,0,0,0.36)]">
              账号
            </label>
            <input
              id="auth-username"
              type="text"
              autoComplete={tab === "login" ? "username" : "new-password"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入你的账号"
              className="w-full rounded-ios-xl border-0 bg-[rgba(0,0,0,0.04)] px-4 py-3.5 text-ios-body text-[rgba(0,0,0,0.85)] placeholder:text-[rgba(0,0,0,0.28)] outline-none focus:bg-[rgba(0,122,255,0.06)] focus:ring-2 focus:ring-[rgba(0,122,255,0.28)] transition-all duration-200"
            />
          </div>

          {/* Email (register only) */}
          {tab === "register" && (
            <div className="space-y-1.5">
              <label htmlFor="auth-email" className="text-ios-caption1 font-semibold uppercase tracking-widest text-[rgba(0,0,0,0.36)]">
                邮箱（选填）
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-ios-xl border-0 bg-[rgba(0,0,0,0.04)] px-4 py-3.5 text-ios-body text-[rgba(0,0,0,0.85)] placeholder:text-[rgba(0,0,0,0.28)] outline-none focus:bg-[rgba(0,122,255,0.06)] focus:ring-2 focus:ring-[rgba(0,122,255,0.28)] transition-all duration-200"
              />
            </div>
          )}

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="auth-password" className="text-ios-caption1 font-semibold uppercase tracking-widest text-[rgba(0,0,0,0.36)]">
              密码
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPw ? "text" : "password"}
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                className="w-full rounded-ios-xl border-0 bg-[rgba(0,0,0,0.04)] px-4 py-3.5 pr-12 text-ios-body text-[rgba(0,0,0,0.85)] placeholder:text-[rgba(0,0,0,0.28)] outline-none focus:bg-[rgba(0,122,255,0.06)] focus:ring-2 focus:ring-[rgba(0,122,255,0.28)] transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(0,0,0,0.30)] hover:text-[rgba(0,0,0,0.56)] lg-transition cursor-pointer"
                aria-label={showPw ? "隐藏密码" : "显示密码"}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Turnstile widget — register only */}
          {tab === "register" && turnstileEnabled && (
            <div className="flex justify-center">
              <div ref={turnstileRef} />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="lg-tint-red rounded-ios-lg px-4 py-3" role="alert">
              <p className="text-ios-footnote font-medium text-[#FF3B30]">{error}</p>
            </div>
          )}

          {/* Submit — iOS blue button */}
          <button
            type="submit"
            disabled={isLoading || (tab === "register" && turnstileEnabled && !turnstileToken)}
            className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-ios-xl bg-[#007AFF] px-5 py-4 text-ios-body font-semibold text-white shadow-[0_4px_16px_rgba(0,122,255,0.28)] lg-transition hover:bg-[#0066DD] hover:shadow-[0_6px_20px_rgba(0,122,255,0.36)] disabled:cursor-not-allowed disabled:bg-[rgba(0,0,0,0.18)] disabled:shadow-none cursor-pointer"
          >
            {isLoading && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {tab === "login" ? "登录" : "创建账号"}
          </button>
        </form>

        {/* Store link */}
        <p className="mt-5 text-center text-ios-footnote text-[rgba(0,0,0,0.36)]">
          需要充值？前往{" "}
          <a
            href="https://store.tinchak0207.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#007AFF] hover:text-[#0066DD] lg-transition"
          >
            store.tinchak0207.xyz
          </a>
        </p>
      </div>
    </div>
  );
}
