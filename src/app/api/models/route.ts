// GET /api/models — public model list (no auth required)
// GET /api/user/models — user-specific model list (auth required, handled by /api/user/models)
import { makeProxy } from "@/lib/proxy";

export const preferredRegion = "hkg1";

export const GET = makeProxy({ upstreamPath: "/api/models", public: true, revalidate: 300 });
