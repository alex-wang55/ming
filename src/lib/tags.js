// Ming tags new vocabulary as [TONE:hanzi|pinyin|tones|meaning], with one tone
// digit per syllable (5 = neutral), e.g. [TONE:谢谢|xièxie|45|thank you].
const TONE_TAG = /\[TONE:([^|\]]+)\|([^|\]]+)\|([0-5]+)\|([^\]]+)\]/g;

export function parseToneTags(text) {
  return [...text.matchAll(TONE_TAG)].map(([, hanzi, pinyin, tones, meaning]) => ({
    hanzi: hanzi.trim(),
    pinyin: pinyin.trim(),
    tones: tones.split("").map(Number),
    meaning: meaning.trim(),
  }));
}

export function stripTags(text) {
  return text.replace(/\[TONE:[^\]]*\]/g, "");
}

// While a reply is still streaming, its last tag may be half written ("[TONE:你好|nǐ").
// Hide that tail so the raw tag never flashes on screen.
export function stripPartialTag(text) {
  return text.replace(/\[(?:T(?:O(?:N(?:E(?::[^\]]*)?)?)?)?)?$/, "");
}
