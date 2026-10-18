import { notFound } from "next/navigation";
import { getPage } from "@/lib/pages";

// The set of slugs is whatever is public in the data repo right now, which
// can change at any time, so this route can't be statically prerendered at
// build time; it renders on request (the cached fetch in getPage still
// keeps it fast).
export const instant = false;

export default async function PageDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <article className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">{page.title}</h1>
      {page.links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {page.links.map((link) => (
            <a
              key={link}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-sm text-accent hover:underline"
            >
              {link}
            </a>
          ))}
        </div>
      )}
      {/* The brain only serves markdown you wrote yourself and reviewed as
          public; this isn't third-party or user-submitted content. */}
      <div
        className="prose prose-zinc max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: page.html }}
      />
    </article>
  );
}
