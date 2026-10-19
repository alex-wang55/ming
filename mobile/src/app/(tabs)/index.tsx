import { Fragment, useState } from "react";
import { Platform, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CourseProgress, DeadlineCard, LessonRow, lessonState, ProgressStrip, StreakCalendar, WordOfTheDay } from "@/components/learn";
import { ToneReference } from "@/components/tones";
import { Card, ScreenHeader } from "@/components/ui";
import { useSession } from "@/lib/session";
import { TOTAL_LESSONS, useSpeak, useStore } from "@/lib/store";
import { useMingTheme } from "@/lib/theme";
import { LESSONS } from "@/shared/lessons";

// Port of the web LearnTab: progress strip, the 18-lesson path, the four tones
// guide, and the cards the desktop shows in its right-hand panel.
export default function Learn() {
  const t = useMingTheme();
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const { completedLessons, streak, dueCount, activity, words, startLesson, startReview, refresh } = useStore();
  const [playing, play] = useSpeak();
  const [refreshing, setRefreshing] = useState(false);

  // Beginners see the tone guide first; once the tones lesson is done it moves below the path.
  const tonesDone = completedLessons.includes("tones");
  const toneGuide = (
    <Card>
      <ToneReference playing={playing} onPlay={play} />
    </Card>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      // Clear the status bar on top and the tab bar below (iOS).
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: Platform.OS === "android" ? insets.top : 0, paddingBottom: 28 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={t.accent}
          onRefresh={async () => {
            setRefreshing(true);
            await refresh();
            setRefreshing(false);
          }}
        />
      }
    >
      <ScreenHeader title="Your lesson path" subtitle={`${completedLessons.length} of ${TOTAL_LESSONS} lessons complete`} />

      <View style={{ paddingHorizontal: 16, gap: 20 }}>
        <ProgressStrip completedLessons={completedLessons} streak={streak} dueCount={dueCount} onReview={startReview} />
        {!tonesDone && toneGuide}

        {LESSONS.map((week) => {
          const weekDone = week.lessons.filter((l) => completedLessons.includes(l.id)).length;
          const complete = weekDone === week.lessons.length;
          return (
            <View key={week.week} style={{ marginTop: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: t.text, letterSpacing: -0.2, marginBottom: 2 }}>{week.weekTitle}</Text>
                  <Text style={{ fontSize: 13, color: t.textMuted }}>{week.weekSub}</Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: "600", letterSpacing: 0.8, color: complete ? t.success : t.textFaint }}>
                  {weekDone}/{week.lessons.length}
                </Text>
              </View>
              {week.lessons.map((lesson, li) => {
                const state = lessonState(completedLessons, lesson.id);
                const prevDone = li > 0 && completedLessons.includes(week.lessons[li - 1].id);
                return (
                  <Fragment key={lesson.id}>
                    {li > 0 && (
                      <View
                        style={{
                          alignSelf: "center",
                          width: 2,
                          height: 14,
                          backgroundColor: prevDone ? t.accent : t.border,
                          opacity: prevDone ? 0.35 : 1,
                        }}
                      />
                    )}
                    <LessonRow lesson={lesson} state={state} onPress={() => startLesson(lesson)} />
                  </Fragment>
                );
              })}
            </View>
          );
        })}

        {tonesDone && toneGuide}

        <WordOfTheDay playing={playing} onPlay={play} />
        {profile?.deadline_date ? <DeadlineCard deadline={profile.deadline_date} goal={profile.goal_text} /> : null}
        <StreakCalendar activity={activity} streak={streak} />
        <CourseProgress done={completedLessons.length} wordCount={words.length} />
      </View>
    </ScrollView>
  );
}
