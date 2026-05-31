// GET /api/user/aff — get referral code
import { makeProxy } from "@/lib/proxy";
export const GET = makeProxy({ upstreamPath: "/api/user/aff" });
