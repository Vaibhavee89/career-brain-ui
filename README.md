# Career Brain UI

The frontend for [Career Brain](https://github.com/Vaibhavee89/Career-Brain). A
Next.js app that talks to the `careerbrain-api` backend over HTTP — it has no
access to the data repo's files, only what the API exposes.

## Pages

- `/` — home, with a short pitch and featured projects
- `/projects` — every public project page
- `/p/[slug]` — a single public page (project, experience, decision, profile, resume)
- `/chat` — "Ask me", backed by `POST /ask` on the API

## Setup

```bash
npm install
cp .env.example .env.local   # then edit NEXT_PUBLIC_API_URL if needed
npm run dev
```

`NEXT_PUBLIC_API_URL` must point at a running `careerbrain-api` instance (see
the backend repo's `render.yaml`). The API's `CAREERBRAIN_CORS_ORIGINS` env
var needs this app's deployed origin added once it's live, or browser
requests from here will be blocked.

## API endpoints used

- `GET /healthz` — status badge in the nav
- `GET /pages` — page listing for the home and projects pages
- `GET /pages/{slug}` — single page content, rendered server-side as HTML
- `POST /ask` / `POST /reset` — chat

`/pages` and `/pages/{slug}` only exist on `careerbrain-api` builds from
[this commit onward](https://github.com/Vaibhavee89/Career-Brain/commit/fd8c877)
— they were added specifically to support this frontend.

## Notes on the Next.js setup

This app has Cache Components enabled (`cacheComponents: true` in
`next.config.ts`). `lib/pages.ts` holds the `"use cache"`-annotated data
fetchers and must stay server-only; `lib/chat.ts` holds the client-safe
chat/health helpers used from `"use client"` pages. Don't merge them back
into one file — Next.js refuses to build a `"use cache"` function that ends
up in a client bundle.

`/p/[slug]` sets `export const instant = false`, since the set of public
slugs is whatever's live in the data repo right now and can't be known at
build time.

## Deploying

Import this repo into Vercel and set `NEXT_PUBLIC_API_URL` as an environment
variable there. No other config is needed — Vercel auto-detects Next.js.
