import { createFileRoute } from "@tanstack/react-router";
import { saveProfile, useProfile } from "@/lib/store";
import { CATEGORIES } from "@/lib/mockData";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Check } from "lucide-react";
import { api } from "@/lib/api/backend";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Merantix LP Portal" },
      { name: "description", content: "Edit your interests and recommendation profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const profile = useProfile();
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [lookingFor, setLookingFor] = useState(profile?.lookingFor ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [firstName, setFirstName] = useState(profile?.firstName ?? "");
  const [lastName, setLastName] = useState(profile?.lastName ?? "");
  const [company, setCompany] = useState(profile?.company ?? "");
  const [avatar, setAvatar] = useState<string | undefined>(profile?.avatar);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    setInterests(profile.interests ?? []);
    setLookingFor(profile.lookingFor ?? "");
    setBio(profile.bio ?? "");
    setFirstName(profile.firstName ?? profile.name.split(" ")[0] ?? "");
    setLastName(profile.lastName ?? profile.name.split(" ").slice(1).join(" ") ?? "");
    setCompany(profile.company ?? "");
    setAvatar(profile.avatar);
  }, [profile]);

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="h-5 w-32 rounded-full bg-secondary" />
        <div className="mt-4 h-12 w-full max-w-sm rounded-2xl bg-secondary" />
        <div className="mt-8 h-72 rounded-3xl border border-border bg-card" />
      </div>
    );
  }

  const initials = (firstName[0] ?? profile.email[0] ?? "?").toUpperCase() + (lastName[0] ?? "").toUpperCase();

  const onUpload = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
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
      onboarded: true,
    });
    api("/api/lp/me", {
      method: "PUT",
      body: {
        first_name: firstName,
        last_name: lastName,
        company,
        interest_areas: interests,
        looking_for: lookingFor ? [lookingFor] : [],
        about_yourself: bio,
        onboarding_completed: true,
      },
    }).catch(console.error);
    toast.success("Profile updated");
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Limited Partner</div>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight">Your profile</h1>
          <p className="mt-2 text-muted-foreground">Manage the information used to personalize recommendations.</p>
        </div>
        <button onClick={save} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
          <Check className="h-4 w-4" /> Save profile
        </button>
      </header>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-elegant md:p-8">
        <div className="flex flex-wrap items-start gap-6">
          <div className="relative">
            <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-2xl bg-secondary font-display text-2xl font-bold">
              {avatar ? <img src={avatar} alt="Profile" className="h-full w-full object-cover" /> : initials}
            </div>
            <button onClick={() => fileInput.current?.click()} className="absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center rounded-full bg-foreground text-background shadow-elegant" aria-label="Upload profile picture">
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
          </div>

          <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">First name</span>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
            </label>
            <label className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Last name</span>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Email</span>
              <input value={profile.email} disabled className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground" />
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Company</span>
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your fund or firm" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Interests</div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = interests.includes(c);
            return (
              <button key={c} onClick={() => setInterests(active ? interests.filter((x) => x !== c) : [...interests, c])}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-foreground/30"
                }`}>{c}</button>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">What you're looking for</div>
        <input value={lookingFor} onChange={(e) => setLookingFor(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
      </section>

      <section className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">About you</div>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5}
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30" />
      </section>

      <button onClick={save} className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
        Save changes
      </button>
    </div>
  );
}
