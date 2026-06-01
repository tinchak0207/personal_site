import { NextRequest, NextResponse } from "next/server";
import { MOCK_MODE, mockRegister } from "@/lib/mock";
import { getGatewayBaseUrl, loginViaNewApi } from "@/lib/new-api-auth-server";
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY ?? "";

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!TURNSTILE_SECRET) return true;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: TURNSTILE_SECRET, response: token, remoteip: ip }),
    });
    const data = await res.json() as { success: boolean };
    return data.success === true;
  } catch { return false; }
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    username?: string;
    password?: string;
    email?: string;
    turnstileToken?: string;
  };

  if (!body.username || !body.password) {
    return NextResponse.json({ success: false, message: "請填寫帳號和密碼" }, { status: 400 });
  }

  // ── Mock mode ──────────────────────────────────────────────────────────────
  if (MOCK_MODE) {
    const result = mockRegister(body.username, body.password, body.email);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  // ── Turnstile check ────────────────────────────────────────────────────────
  if (TURNSTILE_SECRET) {
    if (!body.turnstileToken) {
      return NextResponse.json({ success: false, message: "請完成人機驗證" }, { status: 400 });
    }
    const ip = req.headers.get("cf-connecting-ip")
      ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? "unknown";
    if (!await verifyTurnstile(body.turnstileToken, ip)) {
      return NextResponse.json({ success: false, message: "人機驗證失敗，請重試" }, { status: 400 });
    }
  }

  // ── Real mode ──────────────────────────────────────────────────────────────
  try {
    const gatewayBase = getGatewayBaseUrl();
    const upstream = await fetch(`${gatewayBase}/api/user/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: body.username, password: body.password, email: body.email ?? "" }),
    });
    const data = await upstream.json();
    if (!upstream.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message ?? "注冊失敗，帳號可能已存在" },
        { status: 400 },
      );
    }
    const loginResult = await loginViaNewApi(gatewayBase, body.username, body.password);
    if (!loginResult.ok) {
      return NextResponse.json({
        success: false,
        message: loginResult.message ?? "注冊成功，請手動登錄",
      });
    }
    return NextResponse.json({
      success: true,
      message: "注冊成功",
      data: { token: loginResult.token, user: loginResult.user },
    });
  } catch (err) {
    console.error("[auth/register]", err);
    return NextResponse.json({ success: false, message: "服務暫時不可用" }, { status: 503 });
  }
}
