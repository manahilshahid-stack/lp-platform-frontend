import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useProfile, type ChatMessage } from "@/lib/store";
import { Send, Mail, SquarePen } from "lucide-react";
import { toast } from "sonner";
import { api, streamChat } from "@/lib/api/backend";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({
    meta: [
      { title: "Laura — Merantix AI Analyst" },
      { name: "description", content: "Ask anything — portfolio, market, or general research." },
    ],
  }),
  component: ChatPage,
});

const SUGGESTED = [
  "What is Vara and what makes it different?",
  "How is the European Industrial AI market evolving?",
  "Compare Cambrium with other materials AI startups",
  "Which sectors is Merantix most active in right now?",
];

type SessionResponse = {
  id: string;
  messages: { role: "user" | "assistant"; content: string; ts: number }[];
};

function ChatPage() {
  const profile = useProfile();
  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false }) as Record<string, unknown>;
  const sessionParam = typeof rawSearch?.session === "string" ? rawSearch.session : undefined;

  const LAST_SESSION_KEY = "mx_last_chat_session";
  const sessionToLoad = sessionParam ?? (typeof window !== "undefined" ? localStorage.getItem(LAST_SESSION_KEY) : null);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionToLoad);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: "assistant",
    ts: Date.now(),
    content: `Hi${profile?.name ? " " + profile.name.split(" ")[0] : ""} — ask me anything. When you're done, hit *End & email summary* and the key insights go to ${profile?.email ?? "your inbox"}.`,
  }]);
  const [loadingSession, setLoadingSession] = useState(!!sessionToLoad);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [statusText, setStatusText] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  // Load last active session on mount (from URL param or localStorage)
  useEffect(() => {
    if (!sessionToLoad) return;
    setLoadingSession(true);
    api<SessionResponse>(`/api/lp/chat/sessions/${sessionToLoad}`)
      .then((data) => {
        if (data.messages.length > 0) {
          setMessages(data.messages.map((m) => ({
            role: m.role,
            content: m.content,
            ts: m.ts,
          })));
          setCurrentSessionId(data.id);
          localStorage.setItem(LAST_SESSION_KEY, data.id);
        }
      })
      .catch(() => localStorage.removeItem(LAST_SESSION_KEY))
      .finally(() => setLoadingSession(false));
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const topic = useMemo(() => {
    const firstUser = messages.find((m) => m.role === "user");
    if (!firstUser) return "General conversation";
    return firstUser.content.slice(0, 48) + (firstUser.content.length > 48 ? "…" : "");
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: text, ts: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setThinking(true);
    setStreamingText("");
    setStatusText("");

    let accumulated = "";
    try {
      for await (const event of streamChat(text, currentSessionId)) {
        if (event.type === "session") {
          setCurrentSessionId(event.session_id);
          localStorage.setItem(LAST_SESSION_KEY, event.session_id);
          window.history.replaceState({}, "", `/chat?session=${event.session_id}`);
        } else if (event.type === "status") {
          setStatusText(event.text);
        } else if (event.type === "token") {
          setStatusText("");
          accumulated += event.text;
          setStreamingText(accumulated);
        } else if (event.type === "done") {
          break;
        }
      }
    } catch (err) {
      accumulated = accumulated || `⚠️ Error: ${err instanceof Error ? err.message : String(err)}`;
    }

    setMessages([...next, { role: "assistant", content: accumulated, ts: Date.now() }]);
    setStreamingText("");
    setStatusText("");
    setThinking(false);
  };

  const [emailing, setEmailing] = useState(false);

  const endAndEmail = async () => {
    if (messages.length <= 1) {
      toast.info("Ask at least one question before generating a summary.");
      return;
    }
    if (!currentSessionId) { toast.error('No active session to summarise.'); return; }
    setEmailing(true);
    try {
      await api(`/api/lp/chat/sessions/${currentSessionId}/email-summary`, { method: 'POST' });
      toast.success(`Summary emailed to ${profile?.email}`, { description: 'Key insights from your session are on their way.' });
    } catch { toast.error('Failed to send email. Please try again.'); }
    finally { setEmailing(false); }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-6 py-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Merantix AI Analyst: Laura</h1>
          <p className="text-xs text-muted-foreground">
            {sessionParam ? "Continuing a previous conversation." : "Ask anything — a company, a sector, or general research."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { localStorage.removeItem(LAST_SESSION_KEY); navigate({ to: "/chat" }); }}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold transition hover:border-foreground/30"
            title="New chat"
          >
            <SquarePen className="h-3 w-3" /> New chat
          </button>
          <button onClick={endAndEmail} disabled={emailing}
            className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
            <Mail className="h-3 w-3" /> {emailing ? 'Sending...' : 'End & email summary'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scroller} className="flex-1 space-y-5 overflow-y-auto rounded-2xl border border-border bg-card p-5">
        {loadingSession ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading conversation…
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-background"
                }`}>
                  {m.role === "user" ? (profile?.name?.[0]?.toUpperCase() ?? "Y") : "✦"}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"
                }`}>
                  <FormattedText text={m.content} />
                </div>
              </div>
            ))}
            {thinking && !streamingText && (
              <div className="flex gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-background text-xs">✦</div>
                <div className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3">
                  {statusText ? (
                    <span className="text-xs text-muted-foreground italic">{statusText}</span>
                  ) : (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 pulse-dot" />
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 pulse-dot" style={{ animationDelay: "0.2s" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 pulse-dot" style={{ animationDelay: "0.4s" }} />
                    </>
                  )}
                </div>
              </div>
            )}
            {thinking && streamingText && (
              <div className="flex gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-background text-xs">✦</div>
                <div className="max-w-[80%] rounded-2xl bg-secondary px-4 py-3 text-sm leading-relaxed">
                  <FormattedText text={streamingText} />
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-foreground/60" />
                </div>
              </div>
            )}
            {messages.length <= 1 && !sessionParam && (
              <div className="pt-2">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Try asking</div>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED.map((s) => (
                    <button key={s} onClick={() => send(s)}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs transition hover:border-foreground/30 hover:bg-secondary">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="mt-3 flex items-center gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} disabled={thinking || loadingSession}
          placeholder={sessionParam ? "Continue the conversation…" : "Type your question…"}
          className="flex-1 rounded-full border border-border bg-card px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30" />
        <button type="submit" disabled={!input.trim() || thinking || loadingSession}
          className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

function inlineFormat(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/).map((seg, j) => {
    if (seg.startsWith("**") && seg.endsWith("**")) return <strong key={j}>{seg.slice(2, -2)}</strong>;
    if (seg.startsWith("`") && seg.endsWith("`")) return <code key={j} className="rounded bg-border/60 px-1 py-0.5 font-mono text-xs">{seg.slice(1, -1)}</code>;
    if (seg.startsWith("*") && seg.endsWith("*")) return <em key={j}>{seg.slice(1, -1)}</em>;
    return <span key={j}>{seg}</span>;
  });
}

function FormattedText({ text }: { text: string }) {
  const lines = text.split(/\n/);
  const output: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Markdown table — collect all consecutive pipe lines
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      // Parse: first row = header, second row = separator, rest = body
      const rows = tableLines.filter(r => !r.match(/^\|[-| :]+\|$/));
      const parseRow = (r: string) => r.slice(1, -1).split("|").map(c => c.trim());
      const [header, ...body] = rows;
      output.push(
        <div key={`table-${i}`} className="my-3 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="bg-secondary">
              <tr>
                {parseRow(header).map((cell, ci) => (
                  <th key={ci} className="border-b border-border px-3 py-2 text-left font-semibold text-foreground">
                    {inlineFormat(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "bg-background" : "bg-secondary/40"}>
                  {parseRow(row).map((cell, ci) => (
                    <td key={ci} className="border-b border-border/50 px-3 py-2 text-foreground/90">
                      {inlineFormat(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Heading: ## or ###
    if (trimmed.startsWith("### ")) {
      output.push(<h4 key={i} className="mt-3 mb-1 font-display text-sm font-bold tracking-tight">{inlineFormat(trimmed.slice(4))}</h4>);
    } else if (trimmed.startsWith("## ")) {
      output.push(<h3 key={i} className="mt-4 mb-1 font-display text-base font-bold tracking-tight">{inlineFormat(trimmed.slice(3))}</h3>);
    } else if (trimmed.startsWith("**") && trimmed.endsWith("**") && !trimmed.slice(2, -2).includes("**")) {
      // Standalone bold line = section heading
      output.push(<p key={i} className="mt-3 mb-0.5 font-semibold">{trimmed.slice(2, -2)}</p>);
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      output.push(<li key={i} className="ml-4 list-disc">{inlineFormat(trimmed.slice(2))}</li>);
    } else if (trimmed === "") {
      output.push(<div key={i} className="h-2" />);
    } else {
      output.push(<p key={i} className="leading-relaxed">{inlineFormat(trimmed)}</p>);
    }
    i++;
  }

  return <div className="space-y-1">{output}</div>;
}
