// GET/PUT /api/user/self — user info + quota, update profile
import { makeProxy } from "@/lib/proxy";
const proxy = makeProxy({ upstreamPath: "/api/user/self" });
export const GET = proxy;
export const PUT = proxy;
