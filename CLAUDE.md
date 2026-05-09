# Daily Tracker App — Project Context for Claude Code

## What This App Is
A minimalist personal daily tracker. Core philosophy: **minimal required interaction, maximum data capture, customizable to do as much or as little as needed on that day, zero annoyance**. Built for personal use first, designed to scale to a product. The owner is a senior software engineer comfortable with Python, JS, GCP, AWS, Vue — learning React Native as part of this project.

> See **DESIGN.md** for full design rationale, UX decisions, and architecture deep-dives.

---

## Core UX Principles (Non-Negotiable)
- Prefer buttons, sliders, grids over typing — always
- Daily notification at 9pm (configurable) triggers the entry flow. If today's entry is already complete, do NOT send the notification.
- "Today" is defined as midnight to 3am local time — entries before 3am count as the previous calendar day
- Point system rewards completion: 0.5pt for mandatory, 0.25pt per optional module
- Streak tracking
- Modules = cards. Mandatory cards open immediately. Optional modules are wide buttons in a list; tapping one opens the card inline, completing it returns to the list with a check mark. A "Continue" button skips remaining optionals.
- Pages are tiered: **mandatory** (always shown, card open), **preferred** (auto-promoted after 3/5 recent sessions, skippable via skip button), **optional** (button list)
- No complexity growth early — each session should feel the same or simpler over time
- Future nav: bottom tab bar for Home / Survey / Analytics / Settings (do not build yet)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Expo (React Native) — bare workflow |
| Language | TypeScript (.ts / .tsx throughout) |
| Local DB | SQLite via expo-sqlite |
| State | Zustand |
| Backend (future) | Supabase (Postgres + JSONB + auth) |
| Build/Deploy | EAS Build — sideload APK for Alpha |
| Notifications | expo-notifications |

**Installed packages (beyond Expo scaffold):** `zustand`, `expo-notifications`, `@react-native-community/slider`

**Target platforms:** Android + iOS (Android first for Alpha)
**Alpha testing:** Expo Go on physical Android device; EAS APK sideload once flow is stable
**Dev environment:** WSL2 on Windows. See `DEV_SETUP.md` for tunnel/ADB setup.

---

## Roadmap

### Alpha (now) — Pure data collection
- [x] `/src` directory structure, TypeScript config, scaffold cleanup
- [x] Repository layer: SQLite init, all CRUD (entries, moduleData, pageUsage, preferences)
- [x] Logic layer: scoring, streaks, adaptive promotion (pure functions)
- [x] All Alpha module configs (dayScore, mood, stress, activity, reaction, bloodPressure)
- [x] Zustand store: survey session + app state
- [x] Field components: Slider, ButtonGrid, SingleSelect, FieldRenderer
- [x] Survey shell: SurveyShell, ModuleCard, OptionalList
- [ ] Notification scheduler (step 7)
- [ ] End-to-end test on device
- [ ] EAS APK sideload

### MVP (next)
- Editable past entries
- Home screen: streak, today's score, 7-day calendar
- Adaptive page promotion (3/5 rolling window logic)
- Basic charts per metric
- JSON export
- Configurable notifications, basic page customization

### V1 (future)
- Supabase sync added behind repository interface (swap, don't rewrite)
- Auth deferred until after third entry
- User-customizable modules

---

## Architecture

### Three Separation Rules
1. **UI components** know nothing about storage
2. **Business logic** (scoring, streaks, adaptive promotion) lives in `/src/logic/`, never in components
3. **Repository layer** is the only thing that touches SQLite — everything else calls the repository

### Directory Structure
```
/src
  /modules          # module definition configs (one .ts file per module)
  /fieldTypes       # FIELD_TYPE registry (index.ts)
  /components
    /fields         # reusable field renderers (ButtonGrid.tsx, Slider.tsx, etc.)
    /survey         # survey shell, page navigator
  /repository       # all SQLite read/write logic here
  /logic            # scoring.ts, streaks.ts, adaptive.ts — pure functions only
  /store            # Zustand store (index.ts, surveySlice.ts, appSlice.ts)
  /screens          # top-level screens (Home, Survey, History)
  /notifications    # scheduling logic
  /constants        # default items, theme constants
```

---

## Module System Design

### Philosophy
Modules are **config objects**, not code. A new module = a new config file in `/src/modules/`. No DB migrations, no new components unless a new field type is needed.

### Field Type Registry (`/src/fieldTypes/index.ts`)
```typescript
export const FIELD_TYPES = {
  SLIDER:        { valueType: 'number' },
  BUTTON_GRID:   { valueType: 'array' },   // multi-select from dynamic or static list
  SINGLE_SELECT: { valueType: 'string' },
  TEXT_INPUT:    { valueType: 'string' },
  TIME_PICKER:   { valueType: 'string' },
  NUMBER_INPUT:  { valueType: 'number' },
} as const
```

### Module Definition Shape
```javascript
// Example: /src/modules/activity.js
export const activityModule = {
  id: 'activity',
  label: 'Activity',
  tier: 'optional',          // 'mandatory' | 'preferred' | 'optional'
  icon: '',
  fields: [
    {
      id: 'activities_done',
      type: 'BUTTON_GRID',
      label: 'What did you do today?',
      config: {
        multiSelect: true,
        dynamicItems: true,
        itemsKey: 'user_activities',   // key into UserModuleData table
        sortStrategy: 'recent_first',  // 'recent_first' | 'common_first' | 'alpha'
        allowAdd: true,
      }
    }
  ],
  scoring: { basePoints: 0.25 }
}
```

### Module Registry (`/src/modules/index.ts`)
```typescript
export const MODULE_REGISTRY = {
  // Mandatory
  day_score: dayScoreModule,   // satisfaction 0-100 slider
  mood:      moodModule,       // mood 0-100 slider
  stress:    stressModule,     // stress 0-100 slider

  // Alpha optional modules (build these first)
  activity:       activityModule,      // button grid: gym/run/craft/read/+ add new
  reaction:       reactionModule,      // IBS: had reaction yes/no, FODMAP categories (9 button grid)
  blood_pressure: bloodPressureModule, // systolic slider (70-200 step 5mmHg), diastolic (40-130 step 5mmHg), when (morning/midday/evening)

  // Post-alpha optional modules
  gratitude:    gratitudeModule,
  social_media: socialMediaModule,     // addiction level slider
}
```

**Alpha build order:** mandatory 3 first, then activity, reaction, blood_pressure. Gratitude and social_media are post-alpha.

---

## Data Model

### SQLite Tables

#### `daily_entries`
```sql
CREATE TABLE daily_entries (
  id            TEXT PRIMARY KEY,   -- uuid
  date          TEXT UNIQUE,        -- YYYY-MM-DD
  mandatory_data TEXT,              -- JSON: { satisfaction, mood, stress }
  optional_data  TEXT,              -- JSON: keyed by module_id
  score         REAL,               -- computed and stored for query speed
  streak_day    INTEGER,
  metadata      TEXT,               -- JSON: timing, pages viewed, app version
  created_at    TEXT,
  updated_at    TEXT
);
```

#### `user_module_data`
```sql
CREATE TABLE user_module_data (
  module_id   TEXT,
  data_key    TEXT,
  data        TEXT,                 -- JSON: arbitrary module config/state
  updated_at  TEXT,
  PRIMARY KEY (module_id, data_key)
);
```

#### `page_usage`
```sql
CREATE TABLE page_usage (
  module_id    TEXT PRIMARY KEY,
  usage_log    TEXT                 -- JSON: rolling array of last 10 session dates
);
```

### Example DailyEntry `optional_data`
```json
{
  "activity": {
    "activities_done": ["gym", "walk", "read"],
    "completed_at": "2026-04-19T21:14:00"
  },
  "reaction": {
    "what_ate": "pasta, coffee",
    "when": "19:30",
    "symptoms": 3
  }
}
```

### Example `user_module_data` for activity
```json
{
  "module_id": "activity",
  "data_key": "user_activities",
  "data": {
    "items": [
      { "id": "gym",     "label": "Gym",     "use_count": 24, "last_used": "2026-04-18" },
      { "id": "walk",    "label": "Walk",    "use_count": 31, "last_used": "2026-04-19" },
      { "id": "read",    "label": "Read",    "use_count": 18, "last_used": "2026-04-17" }
    ]
  }
}
```

---

## Key Implementation Rules

1. **Field renderers must be pure.** They receive `(fieldConfig, currentValue, onChange)`. They emit a new value. They never reach into global state or storage directly.
2. **The repository is the only SQLite interface.** No raw SQL outside `/src/repository/`.
3. **Logic is stateless functions.** `calculateScore(entry)`, `calculateStreak(dates)`, `getAdaptivePages(usageLog)` — pure functions, easy to test.
4. **Module configs are the source of truth for UI.** The survey shell iterates the registry; it never has hardcoded page logic.
5. **Never block the repository swap.** All storage calls go through repository interfaces so Supabase can be dropped in behind them later without touching screens or logic.

---

## Adaptive Page Promotion Logic
- Track last 10 session dates per module in `page_usage`
- Count how many of the last 5 sessions a module was completed
- If count >= 3: promote module from optional → preferred for this session
- Preferred pages auto-open but are skippable (user can swipe/tap past)
- Reset promotion if user skips 3 consecutive times

---

## Scoring
```
Daily score = base (0.5 for mandatory completion) + sum of optional module points (0.25 each)
Max = 0.5 + (num_optionals * 0.25)
Streak = consecutive days with score >= 0.5 (mandatory completed)
```

---

## Design Principles
- No emojis, em dashes, or other common AI tropes not normally used in design
- Big buttons and features when possible, easy to click when lazy
- Low contrast and pleasing colors with an overall simple, minimalistic look
- Soft corners

---

## Starting Prompt for New Claude Code Sessions
If starting fresh, paste this:

> "Read CLAUDE.md and DESIGN.md fully before doing anything. This is a React Native Expo app (bare workflow) for personal daily tracking running on WSL2. Steps 1–3 of the Alpha are complete (scaffold, repository, logic, module configs, Zustand store, field components, survey shell). The next step is the notification scheduler. Follow the architecture and module system exactly as documented. Ask me before deviating from anything in CLAUDE.md."
