import { Pressable, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { TOTAL_LESSONS, type Activity, type Lesson } from "@/lib/store";
import { cnFont, radius, useMingTheme } from "@/lib/theme";
import { daysUntil, localDateKey } from "@/shared/dates";
import { LESSONS } from "@/shared/lessons";
import { CheckIcon, ChevronIcon, DotIcon, LockIcon, SpeakerIcon } from "./icons";
import { Card, Label } from "./ui";

/* ---------- ProgressStrip: this week's lessons, streak, words to review ---------- */

export function ProgressStrip({
  completedLessons,
  streak,
  dueCount,
  onReview,
}: {
  completedLessons: string[];
  streak: number;
  dueCount: number;
  onReview: () => void;
}) {
  const t = useMingTheme();
  const found = LESSONS.findIndex((w) => w.lessons.some((l) => !completedLessons.includes(l.id)));
  const week = LESSONS[found === -1 ? LESSONS.length - 1 : found];
  const done = week.lessons.filter((l) => completedLessons.includes(l.id)).length;

  return (
    <Card style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 7 }}>
          <Text numberOfLines={1} style={{ flex: 1, fontSize: 12.5, color: t.text, fontWeight: "500" }}>
            {week.weekTitle}
          </Text>
          <Text style={{ fontSize: 12, color: t.accent, fontWeight: "600" }}>
            {done} / {week.lessons.length}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 3 }}>
          {week.lessons.map((l) => (
            <View
              key={l.id}
              style={{ flex: 1, height: 5, borderRadius: radius.full, backgroundColor: completedLessons.includes(l.id) ? t.accent : t.border }}
            />
          ))}
        </View>
      </View>
      <View style={{ width: 1, height: 32, backgroundColor: t.border }} />
      <Stat value={streak} label="day streak" color={t.warning} />
      <Stat value={dueCount} label="to review" color={t.accent} onPress={dueCount > 0 ? onReview : undefined} />
    </Card>
  );
}

function Stat({ value, label, color, onPress }: { value: number; label: string; color: string; onPress?: () => void }) {
  const t = useMingTheme();
  const content = (
    <>
      <Text style={{ fontSize: 18, fontWeight: "700", color, textAlign: "center" }}>{value}</Text>
      <Text style={{ fontSize: 10.5, color: t.textMuted, textAlign: "center" }}>{label}</Text>
    </>
  );
  if (!onPress) return <View>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`Review ${value} words`}
      style={({ pressed }) => ({
        backgroundColor: t.accentSoft,
        borderWidth: 1,
        borderColor: t.accentBorder,
        borderRadius: radius.sm,
        paddingVertical: 4,
        paddingHorizontal: 8,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {content}
    </Pressable>
  );
}

/* ---------- Lesson path rows ---------- */

export type LessonState = "done" | "active" | "locked";

export function lessonState(completedLessons: string[], lessonId: string): LessonState {
  if (completedLessons.includes(lessonId)) return "done";
  const firstOpen = LESSONS.flatMap((w) => w.lessons).find((l) => !completedLessons.includes(l.id));
  return firstOpen?.id === lessonId ? "active" : "locked";
}

export function LessonRow({ lesson, state, onPress }: { lesson: Lesson; state: LessonState; onPress: () => void }) {
  const t = useMingTheme();
  const done = state === "done";
  const active = state === "active";
  const locked = state === "locked";
  const iconColor = done ? t.success : active ? t.accent : t.textFaint;

  return (
    <Pressable
      onPress={onPress}
      disabled={locked}
      accessibilityRole="button"
      accessibilityState={{ disabled: locked }}
      accessibilityLabel={`${lesson.title}. ${done ? "Completed" : active ? "Up next" : "Locked"}`}
      style={({ pressed }) => ({
        width: "100%",
        borderRadius: radius.md,
        paddingVertical: 12,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 13,
        backgroundColor: active ? t.accentSoft : t.surface,
        borderWidth: 1,
        borderColor: done ? t.successBorder : active ? t.accentBorder : t.border,
        opacity: locked ? 0.42 : pressed ? 0.75 : 1,
      })}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: radius.sm,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: done ? t.successSoft : active ? t.accentSoft : "transparent",
          borderWidth: 1,
          borderColor: done ? t.successBorder : active ? t.accentBorder : t.border,
        }}
      >
        {done ? <CheckIcon color={iconColor} /> : locked ? <LockIcon color={iconColor} /> : <DotIcon color={iconColor} />}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 15, fontWeight: "500", marginBottom: 2, color: done ? t.success : active ? t.accent : locked ? t.textFaint : t.text }}>
          {lesson.title}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 12.5, color: t.textMuted }}>
          {lesson.sub}
        </Text>
      </View>
      {active && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={{ fontSize: 12.5, fontWeight: "600", color: t.accent }}>Continue</Text>
          <ChevronIcon color={t.accent} />
        </View>
      )}
    </Pressable>
  );
}

/* ---------- Word of the day, deadline, streak calendar, course progress ---------- */

const DAILY_WORDS = [
  { chinese: "谢谢", pinyin: "xiè xie", meaning: "Thank you" },
  { chinese: "你好", pinyin: "nǐ hǎo", meaning: "Hello" },
  { chinese: "再见", pinyin: "zài jiàn", meaning: "Goodbye" },
  { chinese: "对不起", pinyin: "duì bu qǐ", meaning: "Sorry" },
  { chinese: "多少钱", pinyin: "duōshao qián", meaning: "How much?" },
  { chinese: "好吃", pinyin: "hǎo chī", meaning: "Delicious" },
  { chinese: "朋友", pinyin: "péng yǒu", meaning: "Friend" },
  { chinese: "加油", pinyin: "jiā yóu", meaning: "You can do it!" },
  { chinese: "没关系", pinyin: "méi guān xi", meaning: "It's okay" },
  { chinese: "慢慢来", pinyin: "màn màn lái", meaning: "Take your time" },
  { chinese: "开心", pinyin: "kāi xīn", meaning: "Happy" },
];

function dayOfYear(d = new Date()) {
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
}

export function WordOfTheDay({ playing, onPlay }: { playing: string | null; onPlay: (text: string) => void }) {
  const t = useMingTheme();
  const word = DAILY_WORDS[dayOfYear() % DAILY_WORDS.length];
  return (
    <View style={{ backgroundColor: t.accentSoft, borderWidth: 1, borderColor: t.accentBorder, borderRadius: radius.lg, padding: 14, overflow: "hidden" }}>
      <Label color={t.accent}>Word of the day</Label>
      <Text style={{ fontFamily: cnFont, fontSize: 32, fontWeight: "500", color: t.accent, marginBottom: 4 }}>{word.chinese}</Text>
      <Text style={{ fontSize: 13, fontStyle: "italic", color: t.textSecondary }}>{word.pinyin}</Text>
      <Text style={{ fontSize: 13, color: t.textSecondary, marginBottom: 10 }}>{word.meaning}</Text>
      <Pressable
        onPress={() => onPlay(word.chinese)}
        accessibilityLabel={`Hear ${word.chinese}`}
        hitSlop={8}
        style={{ flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", opacity: playing === word.chinese ? 0.55 : 1 }}
      >
        <SpeakerIcon color={t.accent} size={13} strokeWidth={2.2} />
        <Text style={{ fontSize: 12.5, fontWeight: "600", color: t.accent }}>{playing === word.chinese ? "Playing" : "Hear it"}</Text>
      </Pressable>
      <Text
        pointerEvents="none"
        style={{ position: "absolute", right: -8, bottom: -14, fontFamily: cnFont, fontSize: 64, opacity: 0.07, color: t.accent }}
      >
        {word.chinese[0]}
      </Text>
    </View>
  );
}

export function DeadlineCard({ deadline, goal }: { deadline: string; goal: string | null }) {
  const t = useMingTheme();
  const days = daysUntil(deadline);
  return (
    <Card>
      <Label>{days > 0 ? "Days to your goal" : days === 0 ? "Deadline is today" : "Deadline passed"}</Label>
      <Text style={{ fontSize: 24, fontWeight: "700", color: days <= 3 ? t.danger : t.accent, marginBottom: 4 }}>{Math.max(days, 0)}</Text>
      {goal ? <Text style={{ fontSize: 12.5, color: t.textSecondary, lineHeight: 18 }}>{goal}</Text> : null}
    </Card>
  );
}

const LEVELS = ["transparent", "rgba(90,154,90,0.18)", "rgba(90,154,90,0.45)", "rgba(90,154,90,0.85)"];
const levelOf = (c: number) => (c === 0 ? 0 : c === 1 ? 1 : c <= 3 ? 2 : 3);

// Last 5 weeks of practice, Monday-first, same as the web StreakCalendar.
export function StreakCalendar({ activity, streak, weeks = 5 }: { activity: Activity[]; streak: number; weeks?: number }) {
  const t = useMingTheme();
  const today = new Date();
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const totalDays = weeks * 7;
  const start = new Date(today);
  start.setDate(today.getDate() - (totalDays - 1 - (6 - dayOfWeek)));
  const byDate = Object.fromEntries(activity.map((a) => [a.date, a.count]));

  const cells = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = localDateKey(d);
    return { key, count: (byDate[key] as number) || 0, future: d > today };
  });
  const rows = Array.from({ length: weeks }, (_, r) => cells.slice(r * 7, r * 7 + 7));

  return (
    <Card>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 11 }}>
        <Label>{`Last ${weeks} weeks`}</Label>
        <Text style={{ fontSize: 16, fontWeight: "700", color: t.warning }}>
          {streak} day{streak === 1 ? "" : "s"}
        </Text>
      </View>
      <View style={{ gap: 4, marginBottom: 10 }}>
        {rows.map((row, r) => (
          <View key={r} style={{ flexDirection: "row", gap: 4 }}>
            {row.map((c) => (
              <View
                key={c.key}
                accessibilityLabel={`${c.key}: ${c.count} session${c.count === 1 ? "" : "s"}`}
                style={{
                  flex: 1,
                  aspectRatio: 1,
                  borderRadius: 3,
                  backgroundColor: c.future ? "transparent" : LEVELS[levelOf(c.count)],
                  borderWidth: 1,
                  borderColor: c.count === 0 || c.future ? t.border : "transparent",
                  opacity: c.future ? 0.35 : 1,
                }}
              />
            ))}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
        <Text style={{ fontSize: 10, color: t.textFaint }}>Less</Text>
        {LEVELS.map((bg, i) => (
          <View key={i} style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: bg, borderWidth: 1, borderColor: i === 0 ? t.border : "transparent" }} />
        ))}
        <Text style={{ fontSize: 10, color: t.textFaint }}>More</Text>
      </View>
    </Card>
  );
}

export function CourseProgress({ done, wordCount }: { done: number; wordCount: number }) {
  const t = useMingTheme();
  const pct = Math.round((done / TOTAL_LESSONS) * 100);
  const R = 17;
  const C = 2 * Math.PI * R;
  return (
    <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
        <Svg width={44} height={44} viewBox="0 0 44 44" style={{ position: "absolute" }}>
          <G rotation={-90} origin="22, 22">
            <Circle cx="22" cy="22" r={R} fill="none" stroke={t.border} strokeWidth={3.5} />
            <Circle
              cx="22"
              cy="22"
              r={R}
              fill="none"
              stroke={t.accent}
              strokeWidth={3.5}
              strokeDasharray={`${C}`}
              strokeDashoffset={C - (pct / 100) * C}
              strokeLinecap="round"
            />
          </G>
        </Svg>
        <Text style={{ fontSize: 11, fontWeight: "700", color: t.accent }}>{pct}%</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: t.text, marginBottom: 2 }}>Course progress</Text>
        <Text style={{ fontSize: 12.5, color: t.textMuted }}>
          {done} of {TOTAL_LESSONS} lessons
        </Text>
        <Text style={{ fontSize: 12.5, color: t.textMuted }}>
          {wordCount} word{wordCount === 1 ? "" : "s"} learned
        </Text>
      </View>
    </Card>
  );
}
