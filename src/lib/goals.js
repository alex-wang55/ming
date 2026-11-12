// Onboarding shortcuts, shared by the web GoalSetup and the app's goal-setup screen.
// Keep mobile/src/shared/goals.js identical.

// Tapping one fills the goal box with a starting point the learner can edit.
export const GOAL_PRESETS = [
  { id: "travel", label: "Travel", hanzi: "旅", text: "Travelling to China and getting around on my own" },
  { id: "family", label: "Family", hanzi: "家", text: "Talking with my partner's family in Mandarin" },
  { id: "work", label: "Work", hanzi: "工", text: "Using Mandarin with colleagues and clients at work" },
  { id: "heritage", label: "Heritage", hanzi: "根", text: "Reconnecting with the Mandarin I grew up around" },
  { id: "curious", label: "Curious", hanzi: "学", text: "Learning Mandarin for fun, starting from zero" },
];

export const DEADLINE_PRESETS = [
  { id: "2w", label: "2 weeks", days: 14 },
  { id: "1m", label: "1 month", days: 30 },
  { id: "3m", label: "3 months", days: 90 },
];

// One line under the goal box, so the learner sees what their answer changes.
export function planPreview(goalText, days) {
  if (!goalText.trim()) return "Ming builds your first lessons around this.";
  if (days == null) return "No deadline: Ming keeps a steady pace and reviews as you go.";
  if (days <= 14) return `${days} days: Ming sticks to survival phrases you'll use on day one.`;
  if (days <= 45) return `${days} days: enough for the essentials plus real conversations.`;
  return `${days} days: room for solid tones, a wide vocabulary and full simulations.`;
}

// First messages for an empty chat. Sent as the learner's own message.
export const STARTERS = [
  { id: "tones", label: "Teach me the four tones", prompt: "Teach me the four Mandarin tones with one simple word each." },
  { id: "order", label: "Order food with me", prompt: "Let's role-play ordering food at a restaurant. You're the waiter." },
  { id: "intro", label: "Help me introduce myself", prompt: "Help me introduce myself in Mandarin, one sentence at a time." },
];
