import { NextResponse } from "next/server";

export const preferredRegion = "hkg1";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "image.tinchak0207.xyz",
    timestamp: new Date().toISOString(),
  });
}
