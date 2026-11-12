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

// Takes one unit of today's allowance for "chat", "tts" or "transcribe". Returns the new
// count, or null when the limit is reached. The check and the increment happen in one SQL
// statement (see supabase/migrations/20261111_usage_limits.sql), so parallel requests
// can't slip past the cap. Throws if the count can't be taken: callers must refuse the
// request then, never run uncapped.
export async function takeUsage(userId, kind, limit) {
  const { data, error } = await getAdmin().rpc("bump_usage", { p_user_id: userId, p_kind: kind, p_limit: limit });
  if (error) throw error;
  return data;
}

// Gives the unit back when the provider failed. Best effort.
export async function refundUsage(userId, kind) {
  try {
    const { error } = await getAdmin().rpc("refund_usage", { p_user_id: userId, p_kind: kind });
    if (error) console.error("Usage refund failed:", error);
  } catch (err) {
    console.error("Usage refund failed:", err);
  }
}

export const BUSY = "Ming is busy right now. Try again in a moment.";

export function jsonError(message, status, extra = {}) {
  return Response.json({ error: message, ...extra }, { status });
}

export const SIGN_IN_AGAIN = "Your session expired. Please sign in again.";
