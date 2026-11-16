import { describe, expect, it } from "vitest";
import { parseToneTags, stripPartialTag, stripTags } from "./tags";

describe("parseToneTags", () => {
  it("reads every tag in a reply", () => {
    const tags = parseToneTags("Say 你好 [TONE:你好|nǐ hǎo|33|hello] then [TONE:谢谢|xièxie|45|thank you]");
    expect(tags).toEqual([
      { hanzi: "你好", pinyin: "nǐ hǎo", tones: [3, 3], meaning: "hello" },
      { hanzi: "谢谢", pinyin: "xièxie", tones: [4, 5], meaning: "thank you" },
    ]);
  });

  it("ignores a tag that is not finished", () => {
    expect(parseToneTags("Hi [TONE:你好|nǐ hǎo|33")).toEqual([]);
  });
});

describe("stripTags", () => {
  it("removes complete tags", () => {
    expect(stripTags("Hello [TONE:你好|nǐ hǎo|33|hello]!")).toBe("Hello !");
  });
});

describe("stripPartialTag", () => {
  it("hides a half-written tag at the end of a streaming reply", () => {
    for (const tail of ["[", "[TO", "[TONE:", "[TONE:你好|nǐ hǎo|3"]) {
      expect(stripPartialTag("Hello " + tail)).toBe("Hello ");
    }
  });

  it("leaves finished tags and ordinary text alone", () => {
    const done = "Hello [TONE:你好|nǐ hǎo|33|hello] and more";
    expect(stripPartialTag(done)).toBe(done);
    expect(stripPartialTag("a [note] here")).toBe("a [note] here");
  });
});
