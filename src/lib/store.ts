// Client-side state — auth token + user profile + chat history.
import { useEffect, useState } from "react";

// ── Auth token ────────────────────────────────────────────────────────────────
const TOKEN_KEY = "mx_token_v1";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export type UserRole = "operator" | "lp";

export type Profile = {
  email: string;
  /** Display name — usually `${firstName} ${lastName}` */
  name: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  /** Data URL for avatar */
  avatar?: string;
  role: UserRole;
  interests: string[];
  lookingFor: string;
  bio: string;
  onboarded: boolean;
};

const KEY = "mx_profile_v1";

export function loadProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(p: Profile) {
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new Event("mx_profile_change"));
}

export function clearProfile() {
  localStorage.removeItem(KEY);
  clearToken();
  window.dispatchEvent(new Event("mx_profile_change"));
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    setProfile(loadProfile());
    const handler = () => setProfile(loadProfile());
    window.addEventListener("mx_profile_change", handler);
    return () => window.removeEventListener("mx_profile_change", handler);
  }, []);
  return profile;
}

export type ChatMessage = { role: "user" | "assistant"; content: string; ts: number };
export type ChatSession = {
  id: string;
  /** Optional — only set when the chat was opened from a specific company page. */
  companyId?: string;
  /** Display label: company name, "General research", or a derived topic. */
  companyName: string;
  messages: ChatMessage[];
  updatedAt: number;
};

const CHAT_KEY = "mx_chats_v1";

export function loadChats(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CHAT_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveChat(session: ChatSession) {
  const all = loadChats().filter((c) => c.id !== session.id);
  all.unshift(session);
  localStorage.setItem(CHAT_KEY, JSON.stringify(all.slice(0, 50)));
  window.dispatchEvent(new Event("mx_chats_change"));
}

export function useChats() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  useEffect(() => {
    setChats(loadChats());
    const handler = () => setChats(loadChats());
    window.addEventListener("mx_chats_change", handler);
    return () => window.removeEventListener("mx_chats_change", handler);
  }, []);
  return chats;
}
