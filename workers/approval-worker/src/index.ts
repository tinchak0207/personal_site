export interface Env {
  GITHUB_TOKEN: string;
  GITHUB_REPOSITORY: string;
  APPROVAL_SHARED_SECRET: string;
}

interface ApprovalPayload {
  text?: string;
  sharedSecret?: string;
}

function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {}),
    },
  });
}

function parseApprovalCommand(text: string): number | null {
  const normalized = text.trim();
  const match = normalized.match(/^(?:√|批准)\s+PR-(\d+)$/i);
  if (!match) {
    return null;
  }

  return Number.parseInt(match[1], 10);
}

async function mergePullRequest(env: Env, pullNumber: number): Promise<Response> {
  const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/pulls/${pullNumber}/merge`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "agent-graph-approval-worker",
    },
    body: JSON.stringify({ merge_method: "squash" }),
  });

  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true });
    }

    if (request.method === "POST" && url.pathname === "/approve") {
      const payload = (await request.json()) as ApprovalPayload;
      if (payload.sharedSecret !== env.APPROVAL_SHARED_SECRET) {
        return json({ ok: false, error: "unauthorized" }, { status: 401 });
      }

      const pullNumber = parseApprovalCommand(payload.text ?? "");
      if (!pullNumber) {
        return json({ ok: false, error: "invalid_command" }, { status: 400 });
      }

      return mergePullRequest(env, pullNumber);
    }

    return json({ ok: false, error: "not_found" }, { status: 404 });
  },
};
