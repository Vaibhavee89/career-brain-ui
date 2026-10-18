"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ask, getOrCreateUserId, type AskResult } from "@/lib/chat";

const SUGGESTIONS = [
  { icon: "💡", text: "What's Vaibhavee's strongest project with LLMs?" },
  { icon: "💼", text: "Show me Vaibhavee's backend experience" },
  { icon: "🏆", text: "What are Vaibhavee's recent wins?" },
  { icon: "🧭", text: "What architectural decisions has Vaibhavee made?" },
];

type Message =
  | { role: "you"; text: string }
  | { role: "bot"; text: string }
  | { role: "sources"; paths: string[] };

// Matches http(s) URLs; a trailing sentence punctuation mark is excluded below.
const URL_PATTERN = /https?:\/\/[^\s<>"']+/g;
const TRAILING_PUNCTUATION = /[.,;:!?)\]]+$/;

// Turns bare URLs in plain text into real anchors. Built with React nodes,
// not innerHTML, so the text stays untrusted-safe.
function linkify(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const raw = match[0];
    const url = raw.replace(TRAILING_PUNCTUATION, "");
    const start = match.index ?? 0;
    if (start > last) nodes.push(text.slice(last, start));
    nodes.push(
      <a
        key={`${start}-${url}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all underline underline-offset-2 hover:opacity-80"
      >
        {url}
      </a>
    );
    last = start + url.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Ask Me — Career Assistant
        </h1>
        <p className="mt-1 text-sm text-muted">
          Answers come only from public pages. Ask me anything about my
          experience, projects, or decisions.
        </p>
      </div>

      <div className="flex min-h-[280px] flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            Ask a question, or try one of the suggestions below.
          </p>
        )}
        {messages.map((message, index) => {
          if (message.role === "sources") {
            return (
              <div
                key={index}
                className="flex flex-wrap items-center gap-2 pl-9 text-xs text-muted"
              >
                <span className="font-medium tracking-wide uppercase">
                  Citations
                </span>
                {message.paths.map((path) => (
                  <Link
                    key={path}
                    href={`/p/${slugify(path)}`}
                    className="rounded-full border border-accent/30 bg-accent-soft px-2.5 py-0.5 text-accent hover:underline"
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
                    ? "bg-accent text-accent-foreground"
                    : "bg-accent-soft text-accent"
                }`}
              >
                {isYou ? "You" : "AI"}
              </div>
              <div
                className={`rounded-2xl px-4 py-2.5 whitespace-pre-wrap ${
                  isYou
                    ? "rounded-tr-sm bg-accent text-accent-foreground"
                    : "rounded-tl-sm border-l-2 border-accent bg-background"
                }`}
              >
                {linkify(message.text)}
              </div>
            </div>
          );
        })}
        <div ref={logEnd} />
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map(({ icon, text }) => (
          <button
            key={text}
            type="button"
            onClick={() => send(text)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs hover:border-accent hover:text-accent"
          >
            <span aria-hidden>{icon}</span>
            {text}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={2000}
          placeholder="Ask Career Brain anything (e.g., &quot;Tell me more about experience at Scopely?&quot;)"
          aria-label="Question"
          className="flex-1 rounded-full border border-line bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          aria-label="Send"
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-accent text-accent-foreground hover:opacity-90"
        >
          ➤
        </button>
      </form>
      <div className="min-h-[1.25em] text-sm text-muted">{status}</div>
    </div>
  );
}
