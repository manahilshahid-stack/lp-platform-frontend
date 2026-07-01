import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api/backend";
import { MessageSquare, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/_app/history")({
  head: () => ({
    meta: [
      { title: "Conversations — Merantix LP Portal" },
      { name: "description", content: "Your past portfolio conversations and interests." },
    ],
  }),
  component: HistoryPage,
});

type ChatSession = {
  id: string;
  title: string;
  message_count: number;
  updated_at: string | null;
  last_message: string;
};

function HistoryPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<ChatSession[]>("/api/lp/chat/sessions")
      .then((data) => setSessions(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-4xl font-bold tracking-tight">History</h1>
      <p className="mt-2 text-muted-foreground">Every AI analyst session you've had — pick one back up, or start a new one.</p>

      <div className="mt-8 space-y-3">
        {loading && (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse h-20 rounded-2xl border border-border bg-card" />
            ))}
          </>
        )}

        {!loading && sessions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <MessageSquare className="mx-auto h-7 w-7 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No conversations yet — open the AI Analyst to begin.</p>
            <Link to="/chat" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
              Start chatting <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {!loading && sessions.map((s) => (
          <Link key={s.id} to="/chat" search={{ session: s.id }}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-foreground/30">
            <div className="grid h-12 w-12 place-items-center rounded-lg font-display font-bold text-primary-foreground"
              style={{ background: "var(--color-primary)" }}>✦</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-semibold">{s.title}</div>
                <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-highlight text-highlight-foreground">
                  General
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.updated_at ? new Date(s.updated_at).toLocaleDateString() : "—"} · {s.message_count} messages
                </span>
              </div>
              <div className="mt-0.5 truncate text-sm text-muted-foreground">
                {s.last_message.slice(0, 110)}{s.last_message.length > 110 ? "…" : ""}
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
