"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ask, getOrCreateUserId, resetConversation, type AskResult } from "@/lib/chat";

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

const MESSAGES_KEY = "cb-chat-messages";
const LAST_ACTIVE_KEY = "cb-chat-last-active";
const IDLE_LIMIT_MS = 15 * 60 * 1000;
const IDLE_CHECK_MS = 30 * 1000;

// Per-tab conversation. sessionStorage is cleared when the tab closes, so a
// reopened page starts fresh. Browsers that restore closed tabs can bring the
// messages back. The conversation also expires after 15 idle minutes. Storage
// can be blocked or full, so every access is guarded.
function loadMessages(): Message[] {
  try {
    const parsed: unknown = JSON.parse(window.sessionStorage.getItem(MESSAGES_KEY) || "[]");
    return Array.isArray(parsed) ? (parsed as Message[]) : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: Message[]): void {
  try {
    window.sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  } catch {}
}

function hasSavedMessages(): boolean {
  try {
    return window.sessionStorage.getItem(MESSAGES_KEY) !== null;
  } catch {
    return false;
  }
}

function touchActivity(): void {
  try {
    window.sessionStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  } catch {}
}

function isIdle(): boolean {
  try {
    const last = Number(window.sessionStorage.getItem(LAST_ACTIVE_KEY));
    return Boolean(last) && Date.now() - last > IDLE_LIMIT_MS;
  } catch {
    return false;
  }
}

function forgetLocalConversation(): void {
  try {
    window.sessionStorage.removeItem(MESSAGES_KEY);
    window.sessionStorage.removeItem(LAST_ACTIVE_KEY);
  } catch {}
}

function slugify(path: string): string {
  return path.replace(/\.md$/, "").split("/").join("--");
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");
  const [userId] = useState(() => getOrCreateUserId());
  const [restored, setRestored] = useState(false);
  const logEnd = useRef<HTMLDivElement>(null);

  // Restore after mount, not during render, so server and client markup match.
  // An expired conversation is dropped here and on the server.
  useEffect(() => {
    if (isIdle()) {
      forgetLocalConversation();
      void resetConversation(userId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([]);
    } else {
      // A fresh tab has no saved messages, so the server's history for this
      // user id is stale too. Reset it so the reopened page really starts over.
      if (!hasSavedMessages()) void resetConversation(userId);
      setMessages(loadMessages());
    }
    setRestored(true);
  }, [userId]);

  // Also expire while the page stays open and idle.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (isIdle()) {
        forgetLocalConversation();
        void resetConversation(userId);
        setMessages([]);
      }
    }, IDLE_CHECK_MS);
    return () => window.clearInterval(timer);
  }, [userId]);

  useEffect(() => {
    if (restored) saveMessages(messages);
  }, [messages, restored]);

  useEffect(() => {
    logEnd.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  function clearChat() {
    setMessages([]);
    forgetLocalConversation();
    void resetConversation(userId);
  }

  async function send(question: string) {
    const text = question.trim();
    if (!text || !userId) return;
    if (isIdle()) {
      forgetLocalConversation();
      void resetConversation(userId);
      setMessages([]);
    }
    touchActivity();
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
      <div className="flex min-h-[1.25em] items-center justify-between text-sm text-muted">
        <span>{status}</span>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            className="text-xs hover:text-accent hover:underline"
          >
            Clear chat
          </button>
        )}
      </div>
    </div>
  );
}
