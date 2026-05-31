// GET /api/log/self/search — search user logs
import { makeProxy } from "@/lib/proxy";
export const GET = makeProxy({ upstreamPath: "/api/log/self/search" });
