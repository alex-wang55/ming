import { describe, expect, it } from "vitest";
import { chineseLevel, chineseLevelLine } from "./level";

describe("chineseLevel", () => {
  it("starts everyone at level 1 (index 0)", () => {
    expect(chineseLevel(0, 0)).toBe(0);
    expect(chineseLevel()).toBe(0);
    expect(chineseLevel(2, 19)).toBe(0);
  });

  it("levels up on lessons or words, whichever comes first", () => {
    expect(chineseLevel(3, 0)).toBe(1);
    expect(chineseLevel(0, 20)).toBe(1);
    expect(chineseLevel(8, 5)).toBe(2);
    expect(chineseLevel(1, 60)).toBe(2);
    expect(chineseLevel(14, 0)).toBe(3);
    expect(chineseLevel(0, 400)).toBe(3);
  });

  it("writes a context line with the counts", () => {
    const line = chineseLevelLine(1, 6);
    expect(line).toContain("1 lesson done, 6 words learned");
    expect(line).toContain("Level 1 of 4");
    expect(chineseLevelLine(3, 1)).toContain("Level 2 of 4");
  });
});
