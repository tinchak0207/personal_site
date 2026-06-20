// GET /api/user/topup/self — user's top-up history
import { makeProxy } from "@/lib/proxy";

export const preferredRegion = "hkg1";

export const GET = makeProxy({ upstreamPath: "/api/user/topup/self" });
