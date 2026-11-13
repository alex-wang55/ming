import { createClient } from "@supabase/supabase-js";
import { DAILY_MESSAGE_LIMIT, DAILY_TRANSCRIBE_LIMIT, DAILY_TTS_LIMIT } from "@/lib/limits";

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

// Daily caps per user, so worst-case provider spend is bounded. Reset at midnight UTC.
export const DAILY_LIMITS = { message: DAILY_MESSAGE_LIMIT, tts: DAILY_TTS_LIMIT, transcribe: DAILY_TRANSCRIBE_LIMIT };

let quotaMissingLogged = false;

// Atomically takes one unit of today's quota (see supabase/migrations/20261103_atomic_usage_caps.sql).
// Returns { allowed, used }. Pass amount = -1 to give a unit back when the provider fails.
export async function consumeQuota(userId, kind, amount = 1) {
  const limit = DAILY_LIMITS[kind];
  const { data, error } = await getAdmin().rpc("consume_daily_quota", {
    p_user_id: userId,
    p_kind: kind,
    p_limit: limit,
    p_amount: amount,
  });
  if (error) {
    // Migration not run yet: don't take the app down, but say so loudly.
    if (error.code === "PGRST202") {
      if (!quotaMissingLogged) {
        console.error("consume_daily_quota() is missing: run supabase/migrations/20261103_atomic_usage_caps.sql. Daily caps are OFF until then.");
        quotaMissingLogged = true;
      }
      return { allowed: true, used: null };
    }
    throw error;
  }
  return { allowed: data !== null, used: data };
}

export function refundQuota(userId, kind) {
  return consumeQuota(userId, kind, -1).catch((err) => console.error(`Refunding ${kind} quota failed:`, err));
}
