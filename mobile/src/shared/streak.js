import { localDateKey } from "./dates";

// Streak with a 1-day-per-week freeze so a single missed day doesn't reset it.
// Same rules as loadActivity() in the web app's page.js.
// rows: [{ date: "YYYY-MM-DD", count }]
export function computeStreak(rows, now = new Date()) {
  const dates = new Set(rows.map((r) => r.date));
  let count = 0;
  let freezeUsed = false;
  let daysSinceFreeze = 0;
  const cursor = new Date(now);
  if (!dates.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  for (let i = 0; i < 400; i++) {
    if (dates.has(localDateKey(cursor))) {
      count++;
      daysSinceFreeze++;
    } else if (!freezeUsed && daysSinceFreeze < 7) {
      freezeUsed = true;
      daysSinceFreeze = 0;
    } else {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}
