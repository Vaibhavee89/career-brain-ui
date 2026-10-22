// Client-safe helpers: no "use cache", safe to import from "use client" pages.
import { API_URL, requireApiUrl } from "./config";

export type AskReply = {
  kind: "reply";
  chunks: string[];
  sources: string[];
};

export type AskRateLimited = {
  kind: "rate_limited";
  retry_after: number;
};

export type AskResult = AskReply | AskRateLimited | { kind: "error"; detail: string };

export async function getHealth(): Promise<boolean> {
  if (!API_URL) return false;
  try {
    const res = await fetch(`${API_URL}/healthz`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function ask(userId: string, message: string): Promise<AskResult> {
  const res = await fetch(`${requireApiUrl()}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, message }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 429) {
    return { kind: "rate_limited", retry_after: data.retry_after ?? 0 };
  }
  if (!res.ok) {
    return { kind: "error", detail: data.detail || "Something went wrong." };
  }
  return data as AskReply;
}

export function getOrCreateUserId(): string {
  try {
    const existing = window.localStorage.getItem("cb-user");
    if (existing) return existing;
    const id =
      window.crypto && "randomUUID" in window.crypto
        ? window.crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.localStorage.setItem("cb-user", id);
    return id;
  } catch {
    return "anonymous";
  }
}

// Clears the server-side conversation for this user id. Best effort: a failed
// reset only means old context may linger until the server restarts.
export async function resetConversation(userId: string): Promise<void> {
  try {
    await fetch(`${requireApiUrl()}/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
  } catch {}
}
