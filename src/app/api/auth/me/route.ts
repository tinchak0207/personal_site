import { NextRequest, NextResponse } from "next/server";
import { MOCK_MODE, mockGetSelf } from "@/lib/mock";

const GATEWAY_BASE = process.env.GATEWAY_BASE_URL ?? "http://localhost:3001";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ success: false, message: "未授權" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  // ── Mock mode ──────────────────────────────────────────────────────────────
  if (MOCK_MODE) {
    const result = mockGetSelf(token);
    return NextResponse.json(result, { status: result.success ? 200 : 401 });
  }

  // ── Real mode ──────────────────────────────────────────────────────────────
  try {
    const upstream = await fetch(`${GATEWAY_BASE}/api/user/self`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (upstream.status === 401) {
      return NextResponse.json({ success: false, message: "session_expired" }, { status: 401 });
    }
    const data = await upstream.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[auth/me]", err);
    return NextResponse.json({ success: false, message: "服務暫時不可用" }, { status: 503 });
  }
}
