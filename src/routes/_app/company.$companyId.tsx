import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { api, streamChat } from "@/lib/api/backend";
import { useProfile, type ChatMessage } from "@/lib/store";
import {
  ArrowLeft, Send, Sparkles, Mail, TrendingUp, Users,
  ExternalLink, Building2, Handshake, Activity, Info, MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/company/$companyId")({
  head: () => ({
    meta: [
      { title: "Company — Merantix Portfolio" },
      { name: "description", content: "Portfolio company profile" },
    ],
  }),
  component: CompanyPage,
});

type Company = {
  id: string;
  name: string;
  tagline: string;
  category: string;
  stage: string;
  website: string;
  status: "Active" | "Exited" | "Stealth";
  logo: string;
  color: string;
};

function CompanyPage() {
  const { companyId } = Route.useParams();
  const navigate = useNavigate();
  const profile = useProfile();

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api<Company>(`/api/lp/companies/${companyId}`)
      .then(setCompany)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [companyId]);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  // Reset chat when company loads
  useEffect(() => {
    if (!company) return;
    setMessages([{
      role: "assistant",
      ts: Date.now(),
      content: `Hi${profile?.name ? " " + profile.name.split(" ")[0] : ""} — I'm focused exclusively on **${company.name}**. Ask me about their product, market, differentiation, or thesis. For broader portfolio questions, use the main AI Analyst.`,
    }]);
    setSessionId(null);
  }, [company?.id]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = async (text: string) => {
    if (!text.trim() || !company) return;
    const userMsg: ChatMessage = { role: "user", content: text, ts: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setThinking(true);
    setStreamingText("");

    let accumulated = "";
    try {
      for await (const event of streamChat(text, sessionId, company.name)) {
        if (event.type === "session") setSessionId(event.session_id);
        else if (event.type === "token") {
          accumulated += event.text;
          setStreamingText(accumulated);
        } else if (event.type === "done") break;
      }
    } catch {
      accumulated = accumulated || "⚠️ Could not reach the AI analyst. Please try again.";
    }
    setMessages([...next, { role: "assistant", content: accumulated, ts: Date.now() }]);
    setStreamingText("");
    setThinking(false);
  };

  const [emailing, setEmailing] = useState(false);

  const emailSummary = async () => {
    if (!company || !sessionId) { toast.info('Start a conversation first before emailing the summary.'); return; }
    setEmailing(true);
    try {
      await api(`/api/lp/chat/sessions/${sessionId}/email-summary`, { method: 'POST' });
      toast.success(`Summary emailed to ${profile?.email}`, { description: `A digest of your conversation on ${company.name} is on its way.` });
    } catch { toast.error('Failed to send email. Please try again.'); }
    finally { setEmailing(false); }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8 space-y-6 animate-pulse">
        <div className="h-4 w-32 rounded-full bg-secondary" />
        <div className="h-40 rounded-2xl bg-card border border-border" />
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            {[0, 1, 2].map((i) => <div key={i} className="h-32 rounded-2xl bg-card border border-border" />)}
          </div>
          <div className="h-[78vh] rounded-2xl bg-card border border-border" />
        </div>
      </div>
    );
  }

  if (notFound || !company) {
    return (
      <div className="p-10 text-center">
        <p className="text-muted-foreground">Company not found.</p>
        <Link to="/companies" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
          ← Back to portfolio
        </Link>
      </div>
    );
  }

  const about = `${company.name} is a ${company.category.toLowerCase()} company partnered with Merantix Capital. The team focuses on ${company.tagline.toLowerCase()}, working with enterprise customers and research institutions across Europe.`;
  const partners = ["Merantix Capital", "Merantix AI Campus", "Berlin AI ecosystem", "Selected European LPs"];
  const currentActivity = [
    `Scaling ${company.category.toLowerCase()} product across European enterprise customers`,
    `Expanding the engineering and go-to-market team`,
    `Deepening partnerships and research collaborations within the Merantix AI Campus`,
  ];
  const websiteUrl = company.website && company.website !== "tbd" ? `https://${company.website}` : null;
  const suggestedPrompts = [
    `What does ${company.name} do?`,
    `What makes ${company.name} differentiated?`,
    `What is ${company.name}'s market opportunity?`,
    `What stage is ${company.name} at?`,
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <Link
          to="/chat"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold transition hover:border-foreground/30"
        >
          <MessageSquare className="h-3 w-3" /> Open full AI Analyst
        </Link>
      </div>

      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative h-28" style={{ background: company.color }} />
        <div className="px-6 pb-6 pt-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div
                className="-mt-12 grid h-20 w-20 place-items-center rounded-xl border-4 border-card font-display text-3xl font-bold text-primary-foreground shadow-elegant"
                style={{ background: company.color }}
              >
                {company.logo}
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{company.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground md:text-base">{company.tagline}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                company.status === "Active" ? "bg-highlight text-highlight-foreground" :
                company.status === "Exited" ? "bg-primary text-primary-foreground" :
                "bg-secondary text-muted-foreground"
              }`}>{company.status}</span>
              {websiteUrl && (
                <a href={websiteUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90">
                  Visit website <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-y-4 border-t border-border pt-5 text-xs md:grid-cols-4">
            <DetailRow icon={Users} label="Sector" value={company.category} />
            <DetailRow icon={TrendingUp} label="Stage" value={company.stage} />
          </dl>
        </div>
      </section>

      {/* Body: content + chat */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-5">
          <Section icon={Info} title="About">
            <p className="text-sm leading-relaxed text-foreground/90">{about}</p>
          </Section>

          <Section icon={Handshake} title="Partners & backers">
            <div className="flex flex-wrap gap-2">
              {partners.map((p) => (
                <span key={p} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium">{p}</span>
              ))}
            </div>
          </Section>

          <Section icon={Activity} title="What they're working on now">
            <ul className="space-y-2">
              {currentActivity.map((c, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span className="text-foreground/90">{c}</span>
                </li>
              ))}
            </ul>
          </Section>

          {websiteUrl && (
            <Section icon={Building2} title="Links">
              <a href={websiteUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
                {company.website} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Section>
          )}
        </div>

        {/* Side chat */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="flex h-[78vh] flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-highlight" />
                </div>
                <div className="text-sm font-semibold">Ask about {company.name}</div>
              </div>
              <button onClick={emailSummary} disabled={emailing}
                className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
                <Mail className="h-3 w-3" /> {emailing ? 'Sending...' : 'Email summary'}
              </button>
            </div>

            <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-background"
                  }`}>
                    {m.role === "user" ? profile?.name?.[0]?.toUpperCase() ?? "Y" : "✦"}
                  </div>
                  <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"
                  }`}>
                    <FormattedText text={m.content} />
                  </div>
                </div>
              ))}
              {thinking && !streamingText && (
                <div className="flex gap-2.5">
                  <div className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-background text-xs">✦</div>
                  <div className="flex items-center gap-1 rounded-2xl bg-secondary px-3.5 py-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 pulse-dot" />
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 pulse-dot" style={{ animationDelay: "0.2s" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 pulse-dot" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              )}
              {thinking && streamingText && (
                <div className="flex gap-2.5">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border bg-background text-xs">✦</div>
                  <div className="max-w-[82%] rounded-2xl bg-secondary px-3.5 py-2.5 text-sm leading-relaxed">
                    <FormattedText text={streamingText} />
                    <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-foreground/60" />
                  </div>
                </div>
              )}
            </div>

            {messages.length <= 1 && (
              <div className="border-t border-border px-4 py-3">
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Try asking</div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedPrompts.map((p) => (
                    <button key={p} onClick={() => send(p)}
                      className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] transition hover:border-foreground/30 hover:bg-secondary">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-center gap-2 border-t border-border bg-background/60 px-3 py-2.5">
              <input value={input} onChange={(e) => setInput(e.target.value)} disabled={thinking}
                placeholder={`Ask about ${company.name}…`}
                className="flex-1 rounded-full border border-border bg-card px-3.5 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30" />
              <button type="submit" disabled={!input.trim() || thinking}
                className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent" />
        <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function inlineFormat(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/).map((seg, j) => {
    if (seg.startsWith("**") && seg.endsWith("**")) return <strong key={j}>{seg.slice(2, -2)}</strong>;
    if (seg.startsWith("`") && seg.endsWith("`")) return <code key={j} className="rounded bg-border/60 px-1 py-0.5 font-mono text-[11px]">{seg.slice(1, -1)}</code>;
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
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { tableLines.push(lines[i].trim()); i++; }
      const rows = tableLines.filter(r => !r.match(/^\|[-| :]+\|$/));
      const parseRow = (r: string) => r.slice(1, -1).split("|").map(c => c.trim());
      const [header, ...body] = rows;
      output.push(
        <div key={`t${i}`} className="my-2 overflow-x-auto rounded border border-border">
          <table className="w-full text-[11px]">
            <thead className="bg-secondary">
              <tr>{parseRow(header).map((c, ci) => <th key={ci} className="border-b border-border px-2 py-1.5 text-left font-semibold">{inlineFormat(c)}</th>)}</tr>
            </thead>
            <tbody>{body.map((row, ri) => <tr key={ri} className={ri % 2 === 0 ? "bg-background" : "bg-secondary/40"}>{parseRow(row).map((c, ci) => <td key={ci} className="border-b border-border/50 px-2 py-1.5">{inlineFormat(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) { output.push(<p key={i} className="mt-3 font-bold text-sm">{inlineFormat(trimmed.slice(3))}</p>); }
    else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) { output.push(<li key={i} className="ml-4 list-disc text-[13px]">{inlineFormat(trimmed.slice(2))}</li>); }
    else if (trimmed === "") { output.push(<div key={i} className="h-1.5" />); }
    else { output.push(<p key={i} className="empty:hidden">{inlineFormat(trimmed)}</p>); }
    i++;
  }
  return <div className="space-y-1">{output}</div>;
}
