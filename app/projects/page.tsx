import Link from "next/link";
import { listPages } from "@/lib/pages";

export default async function Projects() {
  const pages = await listPages();
  const projects = pages.filter((page) => page.type === "project");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
      {projects.length === 0 ? (
        <p className="text-muted">No public projects yet.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {projects.map((page) => (
            <li
              key={page.slug}
              className="rounded-lg border border-line bg-surface p-4"
            >
              <Link href={`/p/${page.slug}`} className="font-semibold hover:underline">
                {page.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
