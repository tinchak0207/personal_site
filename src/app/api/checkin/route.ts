// GET  /api/checkin — checkin status
// POST /api/checkin — do daily checkin
import { makeProxy } from "@/lib/proxy";
const proxy = makeProxy({ upstreamPath: "/api/user/checkin" });
export const GET = proxy;
export const POST = proxy;
