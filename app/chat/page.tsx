"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ask, getOrCreateUserId, type AskResult } from "@/lib/chat";

const SUGGESTIONS = [
  "What's your strongest project?",
  "Tell me about your experience.",
  "Can I get your resume?",
  "What are your skills?",
];

type Message =
  | { role: "you"; text: string }
  | { role: "bot"; text: string }
  | { role: "sources"; paths: string[] };

function slugify(path: string): string {
  return path.replace(/\.md$/, "").split("/").join("--");
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");
  const [userId] = useState(() => getOrCreateUserId());
  const logEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEnd.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function send(question: string) {
    const text = question.trim();
    if (!text || !userId) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "you", text }]);
    setStatus("Thinking...");
    const result: AskResult = await ask(userId, text);
    if (result.kind === "rate_limited") {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: `Too many questions. Try again in about ${Math.ceil(result.retry_after)}s.`,
        },
      ]);
    } else if (result.kind === "error") {
      setMessages((prev) => [...prev, { role: "bot", text: result.detail }]);
    } else {
      setMessages((prev) => [
        ...prev,
        ...result.chunks.map((chunk) => ({ role: "bot" as const, text: chunk })),
        ...(result.sources.length
          ? [{ role: "sources" as const, paths: result.sources }]
          : []),
      ]);
    }
    setStatus("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ask me</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Answers come only from public pages.
        </p>
      </div>

      <div className="flex min-h-[280px] flex-col gap-3">
        {messages.map((message, index) => {
          if (message.role === "sources") {
            return (
              <div
                key={index}
                className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"
              >
                <span>Sources:</span>
                {message.paths.map((path) => (
                  <Link
                    key={path}
                    href={`/p/${slugify(path)}`}
                    className="rounded-full border border-black/10 px-2.5 py-0.5 hover:underline dark:border-white/10"
                  >
                    {path}
                  </Link>
                ))}
              </div>
            );
          }
          const isYou = message.role === "you";
          return (
            <div
              key={index}
              className={`flex max-w-[85%] items-start gap-2 ${isYou ? "self-end flex-row-reverse" : ""}`}
            >
              <div
                className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-[11px] font-bold ${
                  isYou
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {isYou ? "You" : "AI"}
              </div>
              <div
                className={`rounded-xl px-3 py-2 whitespace-pre-wrap ${
                  isYou
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800"
                }`}
              >
                {message.text}
              </div>
            </div>
          );
        })}
        <div ref={logEnd} />
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => send(text)}
            className="rounded-full border border-black/10 px-3 py-1.5 text-xs hover:border-blue-500 hover:text-blue-600 dark:border-white/10 dark:hover:text-blue-400"
          >
            {text}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={2000}
          placeholder="Ask about my work"
          aria-label="Question"
          className="flex-1 rounded-lg border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Ask
        </button>
      </form>
      <div className="min-h-[1.25em] text-sm text-zinc-500 dark:text-zinc-400">
        {status}
      </div>
    </div>
  );
}
