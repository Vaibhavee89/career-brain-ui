"use client";

import { useEffect, useState } from "react";
import { getHealth } from "@/lib/chat";

export function StatusBadge() {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHealth().then((result) => {
      if (!cancelled) setOk(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (ok === null) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
        ok
          ? "border-accent/30 bg-accent-soft text-accent"
          : "border-red-300 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-accent" : "bg-red-500"}`} />
      {ok ? "Live Sync" : "Offline"}
    </span>
  );
}
