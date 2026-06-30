import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useProfile, clearProfile } from "@/lib/store";
import { api } from "@/lib/api/backend";
import { LogOut, Home, LayoutGrid, MessageSquare, Sparkles, Building2, UserRound } from "lucide-react";
import { Logo } from "@/components/Logo";

export function AppLayout() {
  const profile = useProfile();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const navItems = [
    { to: "/home", label: "Home", icon: Home },
    { to: "/chat", label: "Chat", icon: Sparkles },
    { to: "/portfolio", label: "Sectors", icon: LayoutGrid },
    { to: "/companies", label: "Companies", icon: Building2 },
    { to: "/history", label: "History", icon: MessageSquare },
    { to: "/profile", label: "Profile", icon: UserRound },
  ];

  const initials =
    (profile?.firstName?.[0] ?? profile?.name?.[0] ?? profile?.email?.[0] ?? "?").toUpperCase() +
    (profile?.lastName?.[0] ?? "").toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/home" aria-label="Merantix Capital home" className="shrink-0">
            <Logo size={34} />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = path === item.to || (item.to !== "/home" && path.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/profile" aria-label="Profile"
              className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-border bg-secondary font-display text-xs font-bold transition hover:border-foreground/30">
              {profile?.avatar
                ? <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
                : initials}
            </Link>
            <button
              onClick={() => {
                api("/api/lp/logout", { method: "POST" }).catch(() => {});
                clearProfile();
                navigate({ to: "/" });
              }}
              className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card transition hover:bg-secondary"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
