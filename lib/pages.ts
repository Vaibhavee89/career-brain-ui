// Server-only: these use the "use cache" directive, which Next.js forbids in
// any file that also gets bundled into a Client Component. Keep client-safe
// helpers (chat, status) in lib/chat.ts instead.
import { cacheLife } from "next/cache";
import { requireApiUrl, type PageDetail, type PageSummary } from "./config";

export async function listPages(): Promise<PageSummary[]> {
  "use cache";
  cacheLife("minutes");
  const res = await fetch(`${requireApiUrl()}/pages`);
  if (!res.ok) throw new Error(`Failed to load pages (${res.status})`);
  return res.json();
}

export async function getPage(slug: string): Promise<PageDetail | null> {
  "use cache";
  cacheLife("minutes");
  const res = await fetch(`${requireApiUrl()}/pages/${slug}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load page (${res.status})`);
  return res.json();
}
