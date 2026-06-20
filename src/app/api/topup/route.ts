// POST /api/topup — redeem a top-up code
import { makeProxy } from "@/lib/proxy";

export const preferredRegion = "hkg1";

export const POST = makeProxy({ upstreamPath: "/api/user/topup" });
