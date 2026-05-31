// GET /api/token/ — list user's API tokens
// POST /api/token/ — create a new token
import { makeProxy } from "@/lib/proxy";
const proxy = makeProxy({ upstreamPath: "/api/token/" });
export const GET = proxy;
export const POST = proxy;
