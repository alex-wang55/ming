import { createClient } from "@supabase/supabase-js";

let admin = null;

// Service-role client: bypasses RLS, so only ever use it in API routes.
export function getAdmin() {
  if (!admin) {
    admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}

export async function getUser(request) {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return null;
  const { data, error } = await getAdmin().auth.getUser(header.slice(7));
  return error ? null : data.user;
}

export function jsonError(message, status, extra = {}) {
  return Response.json({ error: message, ...extra }, { status });
}

export const SIGN_IN_AGAIN = "Your session expired. Please sign in again.";
