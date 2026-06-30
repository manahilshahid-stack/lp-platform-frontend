import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { saveProfile, useProfile } from "@/lib/store";
import { CATEGORIES } from "@/lib/mockData";
import { ArrowUpRight, Camera, Check, LayoutGrid, MessageSquare, Pencil, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/home")({
  head: () => ({
    meta: [
      { title: "Home — Merantix LP Portal" },
      { name: "description", content: "Your private LP home — chat, sectors, portfolio." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const profile = useProfile();
  if (!profile) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="h-5 w-28 rounded-full bg-secondary" />
        <div className="mt-4 h-12 w-full max-w-md rounded-2xl bg-secondary" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-48 rounded-3xl border border-border bg-card" />)}
        </div>
      </div>
    );
  }

  const firstName = profile.firstName || profile.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-12">
      {/* Greeting */}
      <header>
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">LP Portal</div>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight md:text-5xl">
          Welcome back, {firstName}<span className="text-accent">.</span>
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Pick where you'd like to go. Everything here is private to you.
        </p>
      </header>

      {/* Funnel cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <FunnelCard
          to="/chat"
          tone="dark"
          eyebrow="01 · Conversational"
          icon={Sparkles}
          title="Chat with the Merantix Analyst"
          body="Ask anything — a Merantix company, a sector, or a wider market question. Email yourself the summary."
        />
        <FunnelCard
          to="/portfolio"
          tone="highlight"
          eyebrow="02 · Thesis"
          icon={LayoutGrid}
          title="Merantix Thesis Sectors"
          body="See the sectors we back, with the companies and the deals we're evaluating in each."
        />
        <FunnelCard
          to="/companies"
          tone="default"
          eyebrow="03 · Directory"
          icon={MessageSquare}
          title="Browse the portfolio"
          body="A clean directory of every Merantix Capital company. Click in for the profile and a dedicated chat."
        />
      </section>

      {/* Profile */}
      <ProfileCard profile={profile} />
    </div>
  );
}

function FunnelCard({
  to, tone, eyebrow, icon: Icon, title, body,
}: {
  to: "/chat" | "/portfolio" | "/companies";
  tone: "dark" | "highlight" | "default";
  eyebrow: string;
  icon: React.ElementType;
  title: string;
  body: string;
}) {
  const cls =
    tone === "dark"
      ? "border-foreground/10 bg-foreground text-background"
      : tone === "highlight"
        ? "border-foreground/10 bg-highlight text-highlight-foreground"
        : "border-border bg-card";
  const muted = tone === "dark" ? "text-background/70" : tone === "highlight" ? "text-foreground/75" : "text-muted-foreground";
  const chip = tone === "dark" ? "bg-background/10" : tone === "highlight" ? "bg-foreground/10" : "bg-secondary";

  return (
    <Link to={to}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border p-7 transition hover:-translate-y-0.5 hover:shadow-elegant ${cls}`}>
      <div className="flex items-start justify-between">
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${chip}`}>
          <Icon className="h-5 w-5" />
        </div>
        <ArrowUpRight className={`h-4 w-4 ${muted} transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5`} />
      </div>
      <div className={`mt-6 text-[10px] font-semibold uppercase tracking-[0.22em] ${muted}`}>{eyebrow}</div>
      <h3 className="mt-1 font-display text-xl font-bold tracking-tight">{title}</h3>
      <p className={`mt-2 text-sm leading-relaxed ${muted}`}>{body}</p>
    </Link>
  );
}

function ProfileCard({ profile }: { profile: NonNullable<ReturnType<typeof useProfile>> }) {
  const [editing, setEditing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(profile.firstName ?? profile.name.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(profile.lastName ?? profile.name.split(" ").slice(1).join(" ") ?? "");
  const [company, setCompany] = useState(profile.company ?? "");
  const [interests, setInterests] = useState<string[]>(profile.interests ?? []);
  const [lookingFor, setLookingFor] = useState(profile.lookingFor ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatar, setAvatar] = useState<string | undefined>(profile.avatar);

  const initials = (firstName[0] ?? profile.email[0] ?? "?").toUpperCase() + (lastName[0] ?? "").toUpperCase();

  const onUpload = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      setAvatar(result);
      if (!editing) {
        // Save immediately if not in edit mode
        saveProfile({ ...profile, avatar: result });
        toast.success("Profile picture updated");
      }
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    saveProfile({
      ...profile,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim() || profile.email.split("@")[0],
      company: company || undefined,
      interests,
      lookingFor,
      bio,
      avatar,
    });
    setEditing(false);
    toast.success("Profile updated");
  };

  return (
    <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
      <div className="flex flex-wrap items-start gap-6">
        {/* Avatar */}
        <div className="relative">
          <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-2xl bg-secondary font-display text-2xl font-bold text-foreground">
            {avatar ? (
              <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <button
            onClick={() => fileInput.current?.click()}
            className="absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center rounded-full bg-foreground text-background shadow-elegant transition hover:opacity-90"
            aria-label="Upload profile picture"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileInput} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }}
          />
        </div>

        {/* Identity */}
        <div className="min-w-0 flex-1">
          {!editing ? (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Your profile</div>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">{profile.name}</h2>
              <div className="mt-1 text-sm text-muted-foreground">
                {profile.email}{profile.company ? ` · ${profile.company}` : ""}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
              </div>
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company (optional)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-semibold transition hover:bg-secondary">
                <X className="h-3 w-3" /> Cancel
              </button>
              <button onClick={save}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90">
                <Check className="h-3 w-3" /> Save
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-semibold transition hover:bg-secondary">
              <Pencil className="h-3 w-3" /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Onboarding answers */}
      <div className="mt-8 grid gap-6 border-t border-border pt-6 md:grid-cols-3">
        <PreferenceBlock title="Areas of interest">
          {editing ? (
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => {
                const active = interests.includes(c);
                return (
                  <button key={c} type="button"
                    onClick={() => setInterests(active ? interests.filter((x) => x !== c) : [...interests, c])}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-foreground/30"
                    }`}>
                    {c}
                  </button>
                );
              })}
            </div>
          ) : interests.length ? (
            <div className="flex flex-wrap gap-1.5">
              {interests.map((i) => (
                <span key={i} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium">{i}</span>
              ))}
            </div>
          ) : (
            <EmptyHint>Add interests to personalize recommendations.</EmptyHint>
          )}
        </PreferenceBlock>

        <PreferenceBlock title="Looking for">
          {editing ? (
            <input value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} placeholder="e.g. Early-stage co-invest opportunities"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
          ) : lookingFor ? (
            <p className="text-sm text-foreground/90">{lookingFor}</p>
          ) : (
            <EmptyHint>Tell us what kind of insight you want.</EmptyHint>
          )}
        </PreferenceBlock>

        <PreferenceBlock title="About you">
          {editing ? (
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
              placeholder="Background, fund focus, anything the analyst should keep in mind."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
          ) : bio ? (
            <p className="text-sm leading-relaxed text-foreground/90">{bio}</p>
          ) : (
            <EmptyHint>A short bio improves the analyst's answers.</EmptyHint>
          )}
        </PreferenceBlock>
      </div>
    </section>
  );
}

function PreferenceBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <div className="text-xs italic text-muted-foreground">{children}</div>;
}
