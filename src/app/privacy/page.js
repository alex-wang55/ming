import LegalPage from "@/components/LegalPage";
import { activeProviders } from "@/lib/ai";

export const metadata = { title: "Privacy Policy — Ming" };
// The provider names come from the server's keys, so read them per request.
export const dynamic = "force-dynamic";

export default function Privacy() {
  const p = activeProviders();
  return (
    <LegalPage
      title="Privacy Policy"
      intro="Ming is a Mandarin coach on the web and on iPhone. This page says what Ming stores about you, which outside services see it, and how to delete it."
      sections={[
        {
          heading: "What Ming stores",
          list: [
            ["Your account.", "Your email address and a password, which is stored hashed by our database provider, Supabase."],
            ["Your goal.", "The learning goal and deadline you enter, if you enter them."],
            ["Your conversations.", "The messages you send Ming and Ming's replies."],
            ["Your vocabulary.", "The words Ming teaches you, with their review schedule."],
            ["Your progress.", "Completed lessons, the days you practised, and how many messages, audio clips and voice clips you used each day."],
            ["Reports.", "The text of any reply you report from the app."],
          ],
        },
        {
          heading: "What Ming does not store",
          body: [
            "Voice recordings are sent for transcription and are not saved by Ming. Ming has no ads, no analytics trackers, and does not sell or share your data for advertising.",
          ],
        },
        {
          heading: "Outside services that receive your data",
          body: ["Ming's features run on these services. Each one receives only what is listed."],
          list: [
            ...(p.chat
              ? [[`${p.chat}.`, "Your chat messages, your goal and deadline, and the words due for review, so Ming can reply."]]
              : []),
            [`${p.voice}.`, "Your voice recording when you use the microphone, to turn speech into text."],
            [`${p.audio}.`, "The Chinese text you tap to hear, to produce the audio."],
            ["Supabase.", "Hosts the database and sign-in."],
            ["Vercel.", "Hosts the website and the server that talks to the services above."],
          ],
        },
        {
          heading: "Your consent on iPhone",
          body: [
            "The iPhone app asks before it sends anything to an AI service, and names each service. You can withdraw that consent in Settings at any time; your word list, reviews and progress keep working without it.",
          ],
        },
        {
          heading: "Deleting your data",
          body: [
            "In the iPhone app, open Settings and choose Delete account. This permanently removes your account, conversations, words, progress and usage records from Ming's database. It cannot be undone.",
          ],
        },
        {
          heading: "Children",
          body: ["Ming is not directed at children under 13 and does not knowingly collect their data."],
        },
        {
          heading: "Changes",
          body: ["If this policy changes, the date at the top changes with it."],
        },
      ]}
    />
  );
}
