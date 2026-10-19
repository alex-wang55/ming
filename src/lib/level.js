// How much Chinese Ming writes, based on how far along the learner is. Starts in English
// with only the words being taught in Chinese, and moves toward mostly Chinese. A level is
// reached when either the lessons done or the words saved hit its threshold, so people who
// only free-chat still level up.
export const CHINESE_LEVELS = [
  {
    lessons: 0,
    words: 0,
    text: "Level 1 of 4, new beginner. Write in English. Use Chinese only for the 1-3 words or short phrases you're teaching right now, each with pinyin and its English meaning, like 你好 (nǐ hǎo, hello). No other Chinese sentences.",
  },
  {
    lessons: 3,
    words: 20,
    text: "Level 2 of 4, early learner. Write mostly in English. You can add short Chinese they've learned, like greetings or 很好 (hěn hǎo, very good) as praise, and short example sentences, each followed by an English translation.",
  },
  {
    lessons: 8,
    words: 60,
    text: "Level 3 of 4, building up. Mix English and Chinese about evenly. Say simple things in Chinese with words they know; explain new words and grammar in English.",
  },
  {
    lessons: 14,
    words: 150,
    text: "Level 4 of 4, confident. Talk mostly in Chinese using words they know. Use English for grammar, brand-new words, or when they're stuck.",
  },
];

export function chineseLevel(lessons = 0, words = 0) {
  let level = 0;
  CHINESE_LEVELS.forEach((l, i) => {
    if (lessons >= l.lessons || words >= l.words) level = i;
  });
  return level;
}

export function chineseLevelLine(lessons = 0, words = 0) {
  const { text } = CHINESE_LEVELS[chineseLevel(lessons, words)];
  return `Chinese level (${lessons} lesson${lessons === 1 ? "" : "s"} done, ${words} word${words === 1 ? "" : "s"} learned): ${text}`;
}
