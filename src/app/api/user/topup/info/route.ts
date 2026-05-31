// GET /api/user/topup/info — top-up config (min amount, exchange rate, etc.)
import { makeProxy } from "@/lib/proxy";
export const GET = makeProxy({ upstreamPath: "/api/user/topup/info" });
