import { NextRequest, NextResponse } from "next/server";
import { MOCK_MODE, mockLogin } from "@/lib/mock";

const GATEWAY_BASE = process.env.GATEWAY_BASE_URL ?? "http://localhost:3001";

export async function POST(req: NextRequest) {
  const body = await req.json() as { username?: string; password?: string };

  if (!body.username || !body.password) {
    return NextResponse.json({ success: false, message: "請填寫帳號和密碼" }, { status: 400 });
  }

  // ── Mock mode ──────────────────────────────────────────────────────────────
  if (MOCK_MODE) {
    const result = mockLogin(body.username, body.password);
    return NextResponse.json(result, { status: result.success ? 200 : 401 });
  }

  // ── Real mode ──────────────────────────────────────────────────────────────
  try {
    const upstream = await fetch(`${GATEWAY_BASE}/api/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: body.username, password: body.password }),
    });
    const data = await upstream.json();
    if (!upstream.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message ?? "登錄失敗，請重試" },
        { status: 401 },
      );
    }
    const token: string = data.data;
    const userRes = await fetch(`${GATEWAY_BASE}/api/user/self`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userData = await userRes.json();
    return NextResponse.json({ success: true, message: "登錄成功", data: { token, user: userData.data } });
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ success: false, message: "服務暫時不可用" }, { status: 503 });
  }
}
