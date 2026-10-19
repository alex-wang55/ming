const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const MAX_INTERVAL = 180 * DAY;

export function isDue(word, now = Date.now()) {
  return !word.next_review || new Date(word.next_review).getTime() <= now;
}

// Simple spaced repetition using only existing columns: the previous interval is
// next_review - last_seen. "easy" grows it 2.5x, "hard" brings the word back in 10 min.
export function nextReview(word, rating, now = Date.now()) {
  const last = new Date(word.last_seen || word.created_at || now).getTime();
  const scheduled = new Date(word.next_review || now).getTime();
  const previous = Math.max(scheduled - last, DAY);
  const interval = rating === "easy" ? Math.min(previous * 2.5, MAX_INTERVAL) : 10 * MINUTE;
  return {
    times_seen: (word.times_seen || 1) + 1,
    last_seen: new Date(now).toISOString(),
    next_review: new Date(now + interval).toISOString(),
  };
}

export function describeNextReview(word, now = Date.now()) {
  const ms = new Date(word.next_review).getTime() - now;
  if (ms <= 0) return "Due now";
  if (ms < DAY) return "Later today"; // not in the "Due" count yet, so don't call it due
  const days = Math.round(ms / DAY);
  return days === 1 ? "Tomorrow" : `In ${days} days`;
}
