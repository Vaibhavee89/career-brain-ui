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
    <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-2.5 py-1 text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-400">
      <span
        className={`h-2 w-2 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`}
      />
      {ok ? "LLM Wiki Active" : "Chat offline"}
    </span>
  );
}
