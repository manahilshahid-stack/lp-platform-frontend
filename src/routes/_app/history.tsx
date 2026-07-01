import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api/backend";
import { MessageSquare, ArrowUpRight, Trash2 } from "lucide-react";

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
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    api<ChatSession[]>("/api/lp/chat/sessions")
      .then((data) => setSessions(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this conversation? This can't be undone.")) return;
    setDeleting(id);
    try {
      await api(`/api/lp/chat/sessions/${id}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert("Failed to delete. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">History</h1>
          <p className="mt-2 text-muted-foreground">Every AI analyst session — pick one back up or start fresh.</p>
        </div>
        <Link to="/chat" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90">
          + New chat
        </Link>
      </div>

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
          <div key={s.id} className="group relative flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-foreground/30">
            <Link to="/chat" search={{ session: s.id }} className="flex flex-1 items-center gap-4 min-w-0">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg font-display font-bold text-primary-foreground"
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
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
            </Link>

            {/* Delete button */}
            <button
              onClick={(e) => deleteSession(e, s.id)}
              disabled={deleting === s.id}
              className="ml-2 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-background text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:border-destructive hover:text-destructive disabled:opacity-50"
              title="Delete conversation"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
