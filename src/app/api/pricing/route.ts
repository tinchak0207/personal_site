// GET /api/pricing — public model pricing (no auth required)
import { makeProxy } from "@/lib/proxy";

export const preferredRegion = "hkg1";

export const GET = makeProxy({ upstreamPath: "/api/pricing", public: true, revalidate: 300 });
