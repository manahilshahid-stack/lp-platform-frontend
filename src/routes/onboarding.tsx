import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CATEGORIES } from "@/lib/mockData";
import { loadProfile, saveProfile } from "@/lib/store";
import { api } from "@/lib/api/backend";
import { Check, ArrowRight, ArrowLeft, SkipForward } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const p = loadProfile();
    if (!p) throw redirect({ to: "/" });
    if (p.onboarded) throw redirect({ to: "/home" });
  },
  component: Onboarding,
});

const LOOKING_FOR_OPTIONS = [
  "Deep-tech category insight",
  "Early-stage co-invest opportunities",
  "Quarterly portfolio updates",
  "Founder & operator intros",
  "Sector benchmarks and theses",
];

function Onboarding() {
  const navigate = useNavigate();
  const profile = typeof window !== "undefined" ? loadProfile() : null;
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [lookingFor, setLookingFor] = useState<string[]>(
    profile?.lookingFor ? [profile.lookingFor] : []
  );
  const [bio, setBio] = useState(profile?.bio ?? "");
  if (!profile) return null;

  const finish = () => {
    saveProfile({ ...profile, interests, lookingFor: lookingFor.join(", "), bio, onboarded: true });
    api("/api/lp/me", {
      method: "PUT",
      body: {
        interest_areas: interests,
        looking_for: lookingFor,
        about_yourself: bio,
        onboarding_completed: true,
      },
    }).catch(console.error);
    navigate({ to: "/home" });
  };

  const skip = () => {
    saveProfile({ ...profile, onboarded: true });
    api("/api/lp/me", { method: "PUT", body: { onboarding_completed: true } }).catch(console.error);
    navigate({ to: "/home" });
  };

  const canNext = step === 0 ? interests.length > 0 : step === 1 ? lookingFor.length > 0 : bio.trim().length >= 10;

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-10">
        {/* Progress */}
        <div className="mb-12 flex items-center justify-between">
          <Logo size={34} />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-10 bg-primary" : i < step ? "w-6 bg-accent" : "w-6 bg-border"}`} />
              ))}
            </div>
            <button onClick={skip}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition hover:bg-secondary hover:text-foreground">
              <SkipForward className="h-3 w-3" /> Skip
            </button>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
            Step {step + 1} of 3 · Optional but recommended
          </div>

          {step === 0 && (
            <>
              <h1 className="font-display text-4xl font-bold tracking-tight text-balance">
                Which sectors should we <span className="highlight-marker">surface for you?</span>
              </h1>
              <p className="mt-3 max-w-xl text-muted-foreground">Pick everything that's in your mandate — we'll personalize your feed and recommendations.</p>
              <div className="mt-8 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const active = interests.includes(c);
                  return (
                    <button key={c}
                      onClick={() => setInterests(active ? interests.filter((x) => x !== c) : [...interests, c])}
                      className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition ${
                        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-foreground/40"
                      }`}>
                      {active && <Check className="h-3.5 w-3.5" />}
                      {c}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="font-display text-4xl font-bold tracking-tight text-balance">
                What are you primarily <span className="highlight-marker">looking for?</span>
              </h1>
              <p className="mt-3 max-w-xl text-muted-foreground">Select everything that applies — we'll personalise what we surface for you.</p>
              <div className="mt-8 grid gap-3">
                {LOOKING_FOR_OPTIONS.map((opt) => {
                  const active = lookingFor.includes(opt);
                  return (
                    <button key={opt} onClick={() => setLookingFor(
                      active ? lookingFor.filter(x => x !== opt) : [...lookingFor, opt]
                    )}
                      className={`flex items-center justify-between rounded-xl border bg-card px-5 py-4 text-left transition ${
                        active ? "border-accent shadow-elegant ring-2 ring-accent/30" : "border-border hover:border-foreground/30"
                      }`}>
                      <span className="text-sm font-medium">{opt}</span>
                      <div className={`grid h-5 w-5 place-items-center rounded-md border transition ${active ? "border-accent bg-accent text-foreground-foreground" : "border-border"}`}>
                        {active && <Check className="h-3 w-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="font-display text-4xl font-bold tracking-tight text-balance">
                Tell us a little <span className="highlight-marker">about yourself.</span>
              </h1>
              <p className="mt-3 max-w-xl text-muted-foreground">Background, fund focus, anything you'd like the AI analyst to keep in mind.</p>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={6}
                placeholder="e.g. Partner at a European fund-of-funds. 15 years in deep-tech. Focused on dual-use and climate tech."
                className="mt-8 w-full rounded-xl border border-border bg-card p-5 text-sm leading-relaxed outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30" />
              <div className="mt-1 text-right text-xs text-muted-foreground">{bio.length} chars · min 10</div>
            </>
          )}
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
          <button onClick={() => (step === 0 ? navigate({ to: "/auth/register" }) : setStep(step - 1))}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <button onClick={skip}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground">
              Skip for now
            </button>
            {step < 2 ? (
              <button onClick={() => setStep(step + 1)} disabled={!canNext}
                className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={finish} disabled={!canNext}
                className="flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-foreground-foreground transition hover:opacity-90 disabled:opacity-40">
                Enter portal <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
