import { describe, it, expect } from "vitest";
import { isDue, nextReview, describeNextReview } from "./review";

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const now = Date.parse("2026-10-12T12:00:00Z");
const iso = (ms) => new Date(ms).toISOString();
const gap = (review) => Date.parse(review.next_review) - now;

describe("isDue", () => {
  it("treats a word with no schedule as due", () => {
    expect(isDue({}, now)).toBe(true);
  });

  it("is due once next_review has passed", () => {
    expect(isDue({ next_review: iso(now - 1) }, now)).toBe(true);
    expect(isDue({ next_review: iso(now + DAY) }, now)).toBe(false);
  });
});

describe("nextReview", () => {
  it("grows the interval 2.5x on easy and bumps times_seen", () => {
    const word = { last_seen: iso(now - 2 * DAY), next_review: iso(now), times_seen: 3 };
    const next = nextReview(word, "easy", now);
    expect(gap(next)).toBe(5 * DAY);
    expect(next.times_seen).toBe(4);
    expect(next.last_seen).toBe(iso(now));
  });

  it("brings a hard word back in 10 minutes", () => {
    const word = { last_seen: iso(now - 10 * DAY), next_review: iso(now) };
    expect(gap(nextReview(word, "hard", now))).toBe(10 * MINUTE);
  });

  it("caps the interval at 180 days", () => {
    const word = { last_seen: iso(now - 100 * DAY), next_review: iso(now) };
    expect(gap(nextReview(word, "easy", now))).toBe(180 * DAY);
  });

  it("uses a 1 day base for a brand-new word", () => {
    expect(gap(nextReview({}, "easy", now))).toBe(2.5 * DAY);
  });
});

describe("describeNextReview", () => {
  it("labels past, same-day, and future reviews", () => {
    expect(describeNextReview({ next_review: iso(now - MINUTE) }, now)).toBe("Due now");
    expect(describeNextReview({ next_review: iso(now + 3 * 60 * MINUTE) }, now)).toBe("Later today");
    expect(describeNextReview({ next_review: iso(now + DAY) }, now)).toBe("Tomorrow");
    expect(describeNextReview({ next_review: iso(now + 5 * DAY) }, now)).toBe("In 5 days");
  });
});
