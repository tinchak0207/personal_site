// GET /api/data/self — daily quota consumption trend
import { makeProxy } from "@/lib/proxy";

export const preferredRegion = "hkg1";

export const GET = makeProxy({ upstreamPath: "/api/data/self" });
