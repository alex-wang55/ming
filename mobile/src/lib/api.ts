import { supabase } from "./supabase";

// The Next.js app on Vercel stays the backend. Native apps don't hit CORS,
// and every route already reads the Supabase token from the Authorization header.
export const WEB_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://ming-wine.vercel.app";

export async function apiFetch(path: string, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);
  return fetch(WEB_URL + path, { ...init, headers });
}

export function postJSON(path: string, body: unknown) {
  return apiFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
