import { NextRequest, NextResponse } from "next/server";
import { MOCK_MODE, mockLogin } from "@/lib/mock";
import { getGatewayBaseUrl, loginViaNewApi } from "@/lib/new-api-auth-server";

export const preferredRegion = "hkg1";

export async function POST(req: NextRequest) {
  const body = await req.json() as { username?: string; password?: string };

  if (!body.username || !body.password) {
    return NextResponse.json({ success: false, message: "请填写账号和密码" }, { status: 400 });
  }

  // ── Mock mode ──────────────────────────────────────────────────────────────
  if (MOCK_MODE) {
    const result = mockLogin(body.username, body.password);
    return NextResponse.json(result, { status: result.success ? 200 : 401 });
  }

  // ── Real mode ──────────────────────────────────────────────────────────────
  try {
    const result = await loginViaNewApi(getGatewayBaseUrl(), body.username, body.password);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status },
      );
    }
    return NextResponse.json({
      success: true,
      message: "登录成功",
      data: { token: result.token, user: result.user },
    });
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ success: false, message: "服务暂时不可用" }, { status: 503 });
  }
}
