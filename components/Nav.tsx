import Link from "next/link";
import { StatusBadge } from "./StatusBadge";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/chat", label: "Ask Me" },
];

export function Nav() {
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="font-semibold">
          Career Brain
        </Link>
        <div className="flex items-center gap-5">
          <nav className="flex gap-4 text-sm">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <StatusBadge />
        </div>
      </div>
    </header>
  );
}
