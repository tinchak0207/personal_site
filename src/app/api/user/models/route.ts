// GET /api/user/models — models available to this user
import { makeProxy } from "@/lib/proxy";
export const GET = makeProxy({ upstreamPath: "/api/user/models", revalidate: 300 });
