import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Platform, Pressable, Text, View } from "react-native";
import { radius, useMingTheme } from "@/lib/theme";
import { localDateKey } from "@/shared/dates";

// A deadline picker. Dates are stored as "YYYY-MM-DD" in the phone's local calendar,
// same format as the web app's <input type="date">.
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function DateField({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const t = useMingTheme();
  const date = value ? parseDateKey(value) : new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handle = (_e: DateTimePickerEvent, d?: Date) => {
    if (d) onChange(localDateKey(d));
  };

  if (Platform.OS === "android") {
    return (
      <Pressable
        onPress={() => DateTimePickerAndroid.open({ value: date, mode: "date", minimumDate: today, onChange: handle })}
        style={{ paddingVertical: 9, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, backgroundColor: t.bg }}
      >
        <Text style={{ color: value ? t.text : t.textMuted, fontSize: 15 }}>{value ? date.toLocaleDateString() : "Pick a date"}</Text>
      </Pressable>
    );
  }

  return (
    <View>
      <DateTimePicker
        value={date}
        mode="date"
        display="compact"
        minimumDate={today}
        accentColor={t.accent}
        themeVariant={t.dark ? "dark" : "light"}
        onChange={handle}
      />
    </View>
  );
}
