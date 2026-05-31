// GET /api/log/self/stat — usage statistics
import { makeProxy } from "@/lib/proxy";
export const GET = makeProxy({ upstreamPath: "/api/log/self/stat" });
