// GET /api/data/self — daily quota consumption trend
import { makeProxy } from "@/lib/proxy";
export const GET = makeProxy({ upstreamPath: "/api/data/self" });
