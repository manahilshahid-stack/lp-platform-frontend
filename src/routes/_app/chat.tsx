import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useProfile, type ChatMessage } from "@/lib/store";
import { Send, Mail, SquarePen } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/backend";

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

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionParam ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: "assistant",
    ts: Date.now(),
    content: `Hi${profile?.name ? " " + profile.name.split(" ")[0] : ""} — ask me anything. When you're done, hit *End & email summary* and the key insights go to ${profile?.email ?? "your inbox"}.`,
  }]);
  const [loadingSession, setLoadingSession] = useState(!!sessionParam);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  // Load existing session if coming from history
  useEffect(() => {
    if (!sessionParam) return;
    setLoadingSession(true);
    api<SessionResponse>(`/api/lp/chat/sessions/${sessionParam}`)
      .then((data) => {
        if (data.messages.length > 0) {
          setMessages(data.messages.map((m) => ({
            role: m.role,
            content: m.content,
            ts: m.ts,
          })));
          setCurrentSessionId(data.id);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingSession(false));
  }, [sessionParam]);

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
    let reply = "";
    try {
      const res = await api<{ ok: boolean; session_id: string; reply: string; citations: any[] }>("/api/lp/chat", {
        method: "POST",
        body: { message: text, session_id: currentSessionId },
      });
      // Pin session ID in URL so refresh restores this conversation
      if (!sessionParam && res.session_id) {
        window.history.replaceState({}, "", `/chat?session=${res.session_id}`);
      }
      setCurrentSessionId(res.session_id);
      reply = res.reply;
    } catch (err) {
      reply = `⚠️ Backend error: ${err instanceof Error ? err.message : String(err)}`;
    }
    setMessages([...next, { role: "assistant", content: reply, ts: Date.now() }]);
    setThinking(false);
  };

  const endAndEmail = () => {
    if (messages.length <= 1) {
      toast.info("Ask at least one question before generating a summary.");
      return;
    }
    toast.success(`Summary emailed to ${profile?.email}`, {
      description: `Key insights from your session on "${topic}" are on their way.`,
    });
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
            onClick={() => navigate({ to: "/chat" })}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold transition hover:border-foreground/30"
            title="New chat"
          >
            <SquarePen className="h-3 w-3" /> New chat
          </button>
          <button onClick={endAndEmail}
            className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90">
            <Mail className="h-3 w-3" /> End &amp; email summary
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
            {thinking && (
              <div className="flex gap-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-background text-xs">✦</div>
                <div className="flex items-center gap-1 rounded-2xl bg-secondary px-4 py-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 pulse-dot" />
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 pulse-dot" style={{ animationDelay: "0.2s" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 pulse-dot" style={{ animationDelay: "0.4s" }} />
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

function FormattedText({ text }: { text: string }) {
  const parts = text.split(/\n/).map((line, i) => {
    const bullet = line.trim().startsWith("- ");
    const inner = (bullet ? line.trim().slice(2) : line).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((seg, j) => {
      if (seg.startsWith("**") && seg.endsWith("**")) return <strong key={j}>{seg.slice(2, -2)}</strong>;
      if (seg.startsWith("*") && seg.endsWith("*")) return <em key={j}>{seg.slice(1, -1)}</em>;
      return <span key={j}>{seg}</span>;
    });
    return bullet
      ? <li key={i} className="ml-4 list-disc">{inner}</li>
      : <p key={i} className="empty:hidden">{inner}</p>;
  });
  return <div className="space-y-1.5">{parts}</div>;
}
