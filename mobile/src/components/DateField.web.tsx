import { createElement } from "react";
import { radius, useMingTheme } from "@/lib/theme";

// Web fallback (used by `expo start --web`): the native picker doesn't run in a browser.
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function DateField({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const t = useMingTheme();
  return createElement("input", {
    type: "date",
    value,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
    style: {
      background: t.bg,
      border: `1px solid ${t.border}`,
      borderRadius: radius.md,
      padding: "8px 10px",
      fontSize: 15,
      color: t.text,
    },
  });
}
