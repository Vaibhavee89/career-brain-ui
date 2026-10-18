import Link from "next/link";
import { listPages } from "@/lib/pages";
import type { PageSummary } from "@/lib/config";

function Card({ page }: { page: PageSummary }) {
  return (
    <li className="rounded-lg border border-line bg-surface p-4">
      <Link href={`/p/${page.slug}`} className="font-semibold hover:underline">
        {page.title}
      </Link>
    </li>
  );
}

export default async function Home() {
  let pages: PageSummary[] = [];
  let error: string | null = null;
  try {
    pages = await listPages();
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load pages.";
  }

  const projects = pages.filter((page) => page.type === "project");

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Career Brain</h1>
        <p className="max-w-xl text-muted">
          A living record of what I&apos;ve built, cited straight from the source.
          Browse the public pages below, or ask the brain directly.
        </p>
        <Link
          href="/chat"
          className="inline-flex w-fit items-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          Ask me anything →
        </Link>
      </section>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {projects.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Projects</h2>
            <Link href="/projects" className="text-sm text-accent hover:underline">
              View all
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {projects.map((page) => (
              <Card key={page.slug} page={page} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
