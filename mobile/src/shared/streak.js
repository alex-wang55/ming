import { localDateKey } from "./dates";

// How many days of activity to load: enough for a year-long streak.
export const STREAK_HISTORY_DAYS = 366;
// A missed day is forgiven if no other day was missed in the 7 days around it,
// so one slip a week never resets the streak, but two in a week do.
const FREEZE_EVERY = 7;

// Consecutive active days ending today (or yesterday, since today isn't over yet).
// Forgiven days keep the streak alive but don't add to it.
// Copied unchanged from the web app's src/lib/streak.js.
// rows: [{ date: "YYYY-MM-DD", count }]
export function computeStreak(rows, now = new Date()) {
  const dates = new Set(rows.map((r) => r.date));
  const cursor = new Date(now);
  if (!dates.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let count = 0;
  let lastFreeze = -Infinity; // how many days back the most recent forgiven day was
  for (let i = 0; i <= STREAK_HISTORY_DAYS; i++) {
    if (dates.has(localDateKey(cursor))) count++;
    else if (i - lastFreeze >= FREEZE_EVERY) lastFreeze = i;
    else break;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}
