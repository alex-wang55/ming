// Daily allowances, shared by the API routes (which enforce them) and the apps
// (which show "N messages left"). Keep mobile/src/shared/limits.js identical.
export const DAILY_MESSAGE_LIMIT = 30;
export const DAILY_TTS_LIMIT = 300;
export const DAILY_TRANSCRIBE_LIMIT = 60;

// The server counts usage by UTC day (see supabase/migrations/20261111_usage_limits.sql).
export function usageDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
