import { NextRequest } from "next/server";

export interface ServerUserIdentity {
  id: number;
}

export function getStoredUserFromHeaders(req: NextRequest): ServerUserIdentity | null {
  const userIdHeader = req.headers.get("x-user-id");
  if (!userIdHeader) return null;

  const userId = Number(userIdHeader);
  if (!Number.isFinite(userId)) return null;

  return { id: userId };
}
