// GET /api/log/self — paginated usage logs
import { makeProxy } from "@/lib/proxy";
export const GET = makeProxy({ upstreamPath: "/api/log/self" });
