import { pinyin } from "pinyin-pro";

// Pinyin for any Chinese text, worked out on the phone (no network). pinyin-pro picks the
// right reading from context (银行 háng vs 行人 xíng) and applies tone changes like 一个 yí gè.
const cache = new Map<string, string[]>();

// One syllable per character, in order.
export function pinyinSyllables(hanzi: string): string[] {
  let out = cache.get(hanzi);
  if (out === undefined) {
    out = pinyin(hanzi, { type: "array" });
    if (cache.size > 500) cache.clear();
    cache.set(hanzi, out);
  }
  return out;
}

export function toPinyin(hanzi: string): string {
  return pinyinSyllables(hanzi).join(" ");
}
