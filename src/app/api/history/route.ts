import { NextRequest, NextResponse } from "next/server";
import { getStoredUserFromHeaders } from "@/lib/server-user";
import { listGeneratedHistoryEntries, saveGeneratedHistoryEntry } from "@/lib/server-history-store";

export const preferredRegion = "hkg1";

export async function GET(req: NextRequest) {
  const user = getStoredUserFromHeaders(req);
  if (!user) {
    return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
  }

  const data = await listGeneratedHistoryEntries(user.id);
  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  const user = getStoredUserFromHeaders(req);
  if (!user) {
    return NextResponse.json({ success: false, message: "未登录" }, { status: 401 });
  }

  const body = await req.json();
  await saveGeneratedHistoryEntry({
    ...body,
    userId: user.id,
  });

  return NextResponse.json({ success: true });
}
