import { supabase } from "./supabase";

export type AccessScope = "super_admin" | "platform" | "tenant" | "consumer" | "guest";

export interface JoharMe {
  id: string;
  email: string;
  organizationId?: string | null;
  roles: string[];
  permissions: string[];
  [k: string]: unknown;
}

const ROLE_PRIORITY: Array<{ match: RegExp; scope: AccessScope }> = [
  { match: /super_admin|system/i, scope: "super_admin" },
  { match: /platform_admin|platform/i, scope: "platform" },
  { match: /tenant|org_admin|organization/i, scope: "tenant" },
  { match: /consumer|customer|buyer|seller/i, scope: "consumer" },
];

export function inferScope(roles: string[] = []): AccessScope {
  for (const rule of ROLE_PRIORITY) {
    if (roles.some((r) => rule.match.test(r))) return rule.scope;
  }
  return roles.length ? "platform" : "guest";
}

export function getToken(): string | null {
  return localStorage.getItem("sb-token");
}
export function setToken(token: string): void {
  localStorage.setItem("sb-token", token);
}
export function getStoredMe(): JoharMe | null {
  const raw = localStorage.getItem("sb-me");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
export function setStoredMe(me: JoharMe): void {
  localStorage.setItem("sb-me", JSON.stringify(me));
}
export function clearAuth(): void {
  localStorage.removeItem("sb-token");
  localStorage.removeItem("sb-me");
  supabase.auth.signOut();
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.session) throw new Error("Please check your email for verification link.");
  return { accessToken: data.session.access_token };
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.session) throw new Error("No session");
  return { accessToken: data.session.access_token };
}

export async function fetchMe(): Promise<JoharMe> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw error || new Error("No user");
  
  // Try to fetch profile from DB
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  
  const adminList = (import.meta.env.VITE_GOOGLE_ADMIN_EMAILS || "").split(",").map((x: string) => x.trim().toLowerCase());
  const isAdmin = adminList.includes(user.email?.toLowerCase() || "");

  const roles = profile?.role ? [profile.role] : (isAdmin ? ["super_admin"] : ["consumer"]);
  return {
    id: user.id,
    email: user.email || "",
    roles: roles,
    permissions: []
  };
}

export async function googleSignIn(): Promise<JoharMe> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
  if (error) throw error;
  return fetchMe(); // This might redirect, so actual session handling happens on load
}




