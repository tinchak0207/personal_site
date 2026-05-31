// GET /api/user/self/groups — groups this user belongs to
import { makeProxy } from "@/lib/proxy";
export const GET = makeProxy({ upstreamPath: "/api/user/self/groups" });
