# Ming refined files

Unzip this over your existing repo. It only touches the files listed below,
nothing else in your project is affected.

## Core refactor (copy all of these)

    src/lib/theme.js            NEW - all colors, fonts, radii in one place
    src/app/globals.css         replaces yours
    src/app/layout.js           replaces yours (adds favicon metadata)
    src/app/page.js             replaces yours
    src/components/Sidebar.js   replaces yours
    src/components/Message.js   replaces yours
    src/components/ChatInput.js replaces yours
    src/components/LearnTab.js  replaces yours
    src/components/RightPanel.js replaces yours
    src/components/WordsTab.js  replaces yours
    src/components/SettingsTab.js replaces yours
    src/components/UserMenu.js  replaces yours
    public/icon.svg             NEW - favicon

Not included, keep your current versions:
    src/components/Auth.js
    src/components/MapTab.js
    src/lib/lessons.js
    src/lib/supabase.js
    src/app/api/**

MapTab now receives a `theme` prop from page.js. Until you update MapTab to use
it, the prop is simply ignored and the map keeps its current styling.

## Optional extras (only copy if you want them)

    src/components/ToneContour.js     four-tone pitch graphs
    src/components/StreakCalendar.js  heatmap calendar
    src/components/CommandPalette.js  cmd+k search
    src/components/ProgressStrip.js   compact week progress bar

None of these are imported by default. Wiring notes are below.

### ToneContour

    import ToneReference from "@/components/ToneContour";
    <ToneReference theme={theme} onPlay={(hanzi) => {/* call /api/tts */}} />

### StreakCalendar

Needs a Supabase table:

    create table daily_activity (
      id uuid default gen_random_uuid() primary key,
      user_id uuid references profiles(id) on delete cascade,
      activity_date date not null,
      session_count integer default 1,
      unique(user_id, activity_date)
    );
    alter table daily_activity enable row level security;
    create policy "Users manage own activity" on daily_activity
      for all using (auth.uid() = user_id);

Then pass it activity rows:

    <StreakCalendar activity={rows} streak={streak} theme={theme} />

### CommandPalette

In page.js:

    const [paletteOpen, setPaletteOpen] = useState(false);

    useEffect(() => {
      function onKey(e) {
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
          e.preventDefault();
          setPaletteOpen(v => !v);
        }
      }
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, []);

Render inside the outer div:

    <CommandPalette
      open={paletteOpen}
      onClose={() => setPaletteOpen(false)}
      theme={theme}
      words={allWords}
      onSelectLesson={handleStartLesson}
      onSelectTab={setTab}
    />

### ProgressStrip

    <ProgressStrip
      completedLessons={completedLessons}
      streak={streak}
      dueCount={dueCount}
      theme={theme}
    />

## Changing the look

Everything reads from src/lib/theme.js. Change the gold once there and it
updates across every component.

## Favicon note

The SVG favicon renders the character using whatever CJK font the viewer has.
Most machines have one. If you want it guaranteed everywhere, convert the
character to an SVG path or export a PNG fallback.
