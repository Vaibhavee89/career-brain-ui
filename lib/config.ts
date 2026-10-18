export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export function requireApiUrl(): string {
  if (!API_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Add it to .env.local (see .env.example)."
    );
  }
  return API_URL;
}

export type PageSummary = {
  path: string;
  slug: string;
  title: string;
  type: string;
};

export type PageDetail = PageSummary & {
  links: string[];
  html: string;
};
