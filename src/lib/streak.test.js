import { describe, it, expect } from "vitest";
import { computeStreak } from "./streak";
import { localDateKey } from "./dates";

const now = new Date(2026, 10, 3, 18, 0); // local time, so date keys match localDateKey
const daysAgo = (n) => {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return localDateKey(d);
};
// Active on every day in [from, to] days ago, except the ones listed in `skip`.
const active = (from, to, skip = []) => {
  const rows = [];
  for (let n = from; n <= to; n++) if (!skip.includes(n)) rows.push({ date: daysAgo(n), count: 1 });
  return rows;
};

describe("computeStreak", () => {
  it("is 0 with no activity", () => {
    expect(computeStreak([], now)).toBe(0);
  });

  it("counts consecutive days including today", () => {
    expect(computeStreak(active(0, 4), now)).toBe(5);
  });

  it("doesn't break just because today isn't done yet", () => {
    expect(computeStreak(active(1, 4), now)).toBe(4);
  });

  it("forgives a single missed day without counting it", () => {
    expect(computeStreak(active(0, 9, [3]), now)).toBe(9);
  });

  it("breaks on two missed days in a row", () => {
    expect(computeStreak(active(0, 9, [3, 4]), now)).toBe(3);
  });

  it("breaks on a second missed day within the same week", () => {
    // Misses 2 and 6 days ago: only 4 days apart.
    expect(computeStreak(active(0, 20, [2, 6]), now)).toBe(5);
  });

  it("forgives one missed day every week over a long streak", () => {
    // Missed 10, 20 and 30 days ago, active every other day for two months.
    expect(computeStreak(active(0, 60, [10, 20, 30]), now)).toBe(58);
  });

  it("still forgives a slip deep into a long streak", () => {
    // Previously only a miss in the most recent week was forgiven, so this reset to 40.
    expect(computeStreak(active(0, 80, [40]), now)).toBe(80);
  });

  it("can count a streak longer than three months", () => {
    expect(computeStreak(active(0, 199), now)).toBe(200);
  });
});
