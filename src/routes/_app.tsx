import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { loadProfile, getToken } from "@/lib/store";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const p = loadProfile();
    const t = getToken();
    if (!p || !t) throw redirect({ to: "/" });
  },
  component: () => <AppLayout />,
});
