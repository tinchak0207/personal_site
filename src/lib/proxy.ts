import { NextRequest, NextResponse } from "next/server";

const GATEWAY_BASE = process.env.GATEWAY_BASE_URL ?? "http://localhost:3001";

interface ProxyOptions {
  upstreamPath?: string;
  public?: boolean;
  revalidate?: number;
}

type RouteContext = { params: Promise<Record<string, string>> };

export function makeProxy(opts: ProxyOptions = {}) {
  return async function handler(
    req: NextRequest,
    context: RouteContext,
  ): Promise<NextResponse> {
    const auth = req.headers.get("authorization") ?? "";

    if (!opts.public && !auth) {
      return NextResponse.json({ success: false, message: "未登錄" }, { status: 401 });
    }

    const params = context?.params ? await context.params : {};

    let upstreamPath = opts.upstreamPath ?? req.nextUrl.pathname;
    for (const [key, val] of Object.entries(params)) {
      upstreamPath = upstreamPath.replace(`:${key}`, val);
    }

    const qs = req.nextUrl.searchParams.toString();
    const url = `${GATEWAY_BASE}${upstreamPath}${qs ? `?${qs}` : ""}`;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (auth) headers["Authorization"] = auth;

    const fetchOpts: RequestInit = {
      method: req.method,
      headers,
      ...(opts.revalidate !== undefined
        ? { next: { revalidate: opts.revalidate } }
        : { cache: "no-store" }),
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      const body = await req.text();
      if (body) fetchOpts.body = body;
    }

    try {
      const upstream = await fetch(url, fetchOpts);
      const data = await upstream.json();
      return NextResponse.json(data, { status: upstream.status });
    } catch (err) {
      console.error(`[proxy ${upstreamPath}]`, err);
      return NextResponse.json({ success: false, message: "服務暫時不可用" }, { status: 503 });
    }
  };
}
