# Daily Tracker — Design Document

> This document captures the full design rationale, architectural decisions, and product thinking behind the app. It is a living document and should be updated as decisions are made or revised. It is separate from `CLAUDE.md`, which is the concise operational reference for Claude Code sessions. This doc is for humans — to understand *why*, not just *what*.

---

## 1. Product Philosophy

### The Core Problem
Most tracking apps fail because they ask too much. The user opens the app once, fills in twelve fields, forgets for three days, feels guilty, and uninstalls. The insight here is that **a bad entry every day is worth more than a perfect entry every week**. The entire product is designed around this.

### Design Principles (in priority order)
1. **Minimum viable interaction per session.** If the user can complete a session in under 60 seconds, they will do it every day. Every UI decision is evaluated against this.
2. **Buttons and sliders over typing.** Typing on mobile is friction. Any field that can be a tap should be a tap.
3. **The app adapts to the user, not the other way around.** Frequently used modules surface themselves. Rarely used ones get out of the way.
4. **Complexity must not grow.** The tenth session should not feel harder than the first. Adding new optional modules should not make the app feel heavier.
5. **No lock-in early.** No account required until the user is already getting value. No ads ever. Paid features are infographics and export, not core tracking.

### What Success Looks Like at Alpha
A single user (the developer) completes a daily entry every day for two weeks without feeling annoyed by the app. Data is stored. Nothing is lost.

---

## 2. User Experience Design

### Session Flow

```
9pm notification fires (suppressed if today's entry already complete)
        ↓
App opens directly to Survey shell
  (same entry point whether via notification or direct open)
        ↓
Mandatory module cards (always shown, in order, card pre-opened)
  → Day Satisfaction (0–100 slider)
  → Mood (0–100 slider)
  → Stress (0–100 slider)
  Each card: complete it → next mandatory card replaces it
        ↓
Preferred module card (auto-promoted optionals, skippable)
  → Shown one at a time after mandatory sequence
  → Clear "Skip" button always visible (swipe gesture: future)
  → Alpha: none promoted by default
        ↓
Optional module list
  → Wide button list, one per optional module
  → Tap a button → card opens inline
  → Complete card → return to list, button shows check mark
  → Can complete zero or many in any order
  → Clear "Continue" button skips remaining optionals
        ↓
Survey complete — data saved
  → Alpha: done (no summary screen yet)
  → Future: score + streak summary before dismissing
```

### Day Boundary
"Today" is defined as **midnight through 3am local time**. An entry submitted at 1:30am counts as the previous calendar day. This allows natural late-night use without forcing a date mismatch.

Notification suppression: before scheduling the 9pm notification, check if `daily_entries` already has a row for today's date. If yes, skip scheduling.

### Mandatory Modules
These are always shown, always first, cannot be skipped. Kept to three intentionally — this is the irreducible minimum of data that makes the app useful across all future analytics.

- **Day Satisfaction:** 0–100 slider. "How was today overall?"
- **Mood:** 0–100 slider. Distinct from satisfaction — mood is emotional state, satisfaction is evaluation of the day.
- **Stress:** 0–100 slider.

### Preferred Pages (Adaptive Promotion)
A module graduates from optional to preferred when the user completes it in 3 of the last 5 sessions. It is shown automatically after mandatory pages but is explicitly skippable — there is always a visible "skip" affordance. If the user skips a promoted module 3 sessions in a row, it is demoted back to optional. This prevents the preferred list from becoming a second mandatory list over time.

### Optional Modules

#### Alpha modules (build these)

| Module | Fields |
|---|---|
| Activity | Button grid (dynamic): gym, run, craft, read + "+" to add permanently. Mid-term: sorted by recent/most-used. |
| Reaction (IBS) | Had a reaction? (yes/no single select). FODMAP categories eaten in last 24hrs (button grid, 9 static categories, multi-select). |
| Blood Pressure | Systolic slider (70–200 mmHg, step 5). Diastolic slider (40–130 mmHg, step 5). When taken (morning / midday / evening single select). |

#### Post-alpha modules

| Module | Fields |
|---|---|
| Gratitude | Free text (single field — the one deliberate exception to no-typing rule) |
| Social Media | Addiction level (0–100 slider) |

### Point System
The point system exists to reward showing up, not to gamify comprehensively. It should feel like a light acknowledgement, not a game.

```
Mandatory completion:     0.5 points
Each optional completed:  0.25 points
Maximum per day:          0.5 + (n_optionals × 0.25)

Streak:                   consecutive days where score >= 0.5
                          (mandatory must be completed — optionals do not save a streak)
```

The score is computed and stored on each save, not recomputed on read, for query performance.

### Notification
- Single daily notification at 9pm local time
- Scheduled locally via `expo-notifications` — no server required
- Rescheduled on app open if not already set
- In future: time should be user-configurable (store in user preferences)

---

## 3. Architecture

### Guiding Principle: Separated Concerns
The architecture is designed so that UI, state, logic, and storage can each evolve independently. The key rule: **no layer should know more than it needs to about any other layer.**

```
┌─────────────────────────────────────────────────────────────┐
│                        Screens                              │
│         (navigation only, compose components)               │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                       Components                            │
│     (survey shell, field renderers — pure, config-driven)   │
└──────────────┬─────────────────────────────┬────────────────┘
               │                             │
┌──────────────▼──────────┐   ┌─────────────▼──────────────┐
│      Zustand Store      │   │        Logic Layer          │
│  (survey state, UI flow │   │  scoring.js, streaks.js,   │
│   page usage tracking)  │   │  adaptive.js — pure funcs  │
└──────────────┬──────────┘   └─────────────┬──────────────┘
               │                             │
┌──────────────▼─────────────────────────────▼──────────────┐
│                     Repository Layer                        │
│         (only layer that touches SQLite — all R/W here)    │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
/src
  /modules              # one file per module — config objects only
    index.ts            # MODULE_REGISTRY — single import point
    dayScore.ts
    mood.ts
    stress.ts
    activity.ts
    reaction.ts
    gratitude.ts
    bloodPressure.ts
    socialMedia.ts

  /fieldTypes
    index.ts            # FIELD_TYPE registry and metadata

  /components
    /fields             # one component per field type
      Slider.tsx
      ButtonGrid.tsx
      SingleSelect.tsx
      TextInput.tsx
      TimePicker.tsx
      NumberInput.tsx
    /survey
      SurveyShell.tsx   # orchestrates page flow from MODULE_REGISTRY
      ModuleCard.tsx    # renders a single module as an expandable card
      OptionalList.tsx  # optional module button list + inline card expansion

  /repository
    index.ts            # exports all repository functions
    db.ts               # SQLite connection and table init
    entries.ts          # DailyEntry CRUD
    moduleData.ts       # UserModuleData CRUD
    pageUsage.ts        # PageUsage CRUD

  /logic
    scoring.ts          # calculateScore(entry) → number
    streaks.ts          # calculateStreak(recentDates) → number
    adaptive.ts         # getPromotedModules(usageLog) → module[]

  /store
    index.ts            # Zustand store
    surveySlice.ts      # survey session state
    appSlice.ts         # app-wide state (streak, last entry date, etc.)

  /screens
    HomeScreen.tsx
    SurveyScreen.tsx
    HistoryScreen.tsx   # MVP+

  /notifications
    scheduler.ts        # schedule/reschedule 9pm notification; suppress if today complete

  /constants
    defaults.ts         # default activity items, FODMAP categories, etc.
```

---

## 4. Module System

### Why Config-Driven
The naive approach is to build each page as a React component. This works for three pages. It breaks at ten, and becomes unmaintainable when the goal is user-customisable modules. Instead, every module is a **declarative config object**. The survey shell reads the registry and renders the right field components automatically. Adding a new module requires no new components unless a genuinely new field type is needed.

### Field Type Registry

Field types are the atomic primitives. Each type maps to a renderer component and declares the shape of its value.

```javascript
// /src/fieldTypes/index.js
export const FIELD_TYPES = {
  SLIDER: {
    valueType: 'number',
    component: 'Slider',
  },
  BUTTON_GRID: {
    valueType: 'array',       // array of selected item ids
    component: 'ButtonGrid',
  },
  SINGLE_SELECT: {
    valueType: 'string',
    component: 'SingleSelect',
  },
  TEXT_INPUT: {
    valueType: 'string',
    component: 'TextInput',
  },
  TIME_PICKER: {
    valueType: 'string',      // HH:MM
    component: 'TimePicker',
  },
  NUMBER_INPUT: {
    valueType: 'number',
    component: 'NumberInput',
  },
}
```

### Module Definition Shape

```javascript
{
  id: string,               // unique, used as key in optional_data JSON
  label: string,            // display name
  tier: 'mandatory'         // always shown, never skippable
       | 'preferred'        // auto-shown, skippable
       | 'optional',        // button list only
  icon: string,             // emoji or icon name
  fields: [
    {
      id: string,           // unique within module, used as JSON key
      type: keyof FIELD_TYPES,
      label: string,
      config: { ... }       // type-specific config (see below)
    }
  ],
  scoring: {
    basePoints: number,     // awarded for any completion of this module
    bonusPoints: null | { condition: string, points: number }
  }
}
```

### Field Config by Type

**SLIDER**
```javascript
config: {
  min: 0,
  max: 100,
  step: 1,
  defaultValue: 50,
  showValue: true,         // display numeric value beside slider
}
```

**BUTTON_GRID**
```javascript
config: {
  multiSelect: boolean,
  staticItems: [...],      // hardcoded items OR
  dynamicItems: true,      // items loaded from UserModuleData
  itemsKey: string,        // key into UserModuleData if dynamicItems
  sortStrategy: 'recent_first' | 'common_first' | 'alpha',
  allowAdd: boolean,       // show "add new" input at bottom of grid
  columns: 3,              // grid columns (default 3)
}
```

**NUMBER_INPUT** (post-alpha — not used in Alpha modules)
```javascript
config: {
  min: number,
  max: number,
  unit: string,
}
```

**SINGLE_SELECT**
```javascript
config: {
  options: Array<{ id: string, label: string }>,
  defaultValue: string | null,
}
```

### Module Registry

```javascript
// /src/modules/index.js
import { dayScoreModule } from './dayScore'
import { moodModule }     from './mood'
import { stressModule }   from './stress'
import { activityModule } from './activity'
import { reactionModule } from './reaction'
import { gratitudeModule} from './gratitude'
import { bloodPressureModule } from './bloodPressure'
import { socialMediaModule }   from './socialMedia'

export const MODULE_REGISTRY = {
  // Order matters for mandatory — rendered in this sequence
  day_score:      dayScoreModule,
  mood:           moodModule,
  stress:         stressModule,

  // Optionals — order is initial display order before adaptive sorting
  activity:       activityModule,
  reaction:       reactionModule,
  gratitude:      gratitudeModule,
  blood_pressure: bloodPressureModule,
  social_media:   socialMediaModule,
}

export const MANDATORY_MODULES = Object.values(MODULE_REGISTRY)
  .filter(m => m.tier === 'mandatory')

export const OPTIONAL_MODULES = Object.values(MODULE_REGISTRY)
  .filter(m => m.tier === 'optional' || m.tier === 'preferred')
```

---

## 5. Data Model

### Design Rationale
Two competing needs:
1. **Structured queries** across days (e.g. average satisfaction last 30 days, streak count, how many days ran this month)
2. **Flexible storage** for optional modules that will change over time — new modules, new fields, user-defined items

The solution: mandatory core fields stay structured as named columns or a stable JSON object. Optional module data lives in a semi-structured JSON column (`optional_data`). User-specific module config (activity lists, custom options) lives in a separate `user_module_data` table.

When moving to Supabase, `optional_data` and `user_module_data.data` map directly to JSONB columns, enabling indexed queries on nested fields without a schema change.

### SQLite Schema

```sql
-- Primary daily record
CREATE TABLE IF NOT EXISTS daily_entries (
  id             TEXT PRIMARY KEY,        -- uuid v4
  date           TEXT UNIQUE NOT NULL,    -- YYYY-MM-DD, one row per day
  mandatory_data TEXT NOT NULL,           -- JSON: { satisfaction, mood, stress }
  optional_data  TEXT NOT NULL DEFAULT '{}', -- JSON: keyed by module_id
  score          REAL NOT NULL DEFAULT 0, -- precomputed, stored for fast query
  streak_day     INTEGER NOT NULL DEFAULT 0,
  metadata       TEXT NOT NULL DEFAULT '{}', -- JSON: timing, pages_viewed, app_version
  created_at     TEXT NOT NULL,           -- ISO8601
  updated_at     TEXT NOT NULL            -- ISO8601
);

-- Per-module user configuration and persistent state
-- e.g. activity lists, custom slider ranges
CREATE TABLE IF NOT EXISTS user_module_data (
  module_id   TEXT NOT NULL,
  data_key    TEXT NOT NULL,
  data        TEXT NOT NULL DEFAULT '{}', -- JSON: arbitrary per-module data
  updated_at  TEXT NOT NULL,
  PRIMARY KEY (module_id, data_key)
);

-- Rolling usage log for adaptive promotion
CREATE TABLE IF NOT EXISTS page_usage (
  module_id    TEXT PRIMARY KEY,
  usage_log    TEXT NOT NULL DEFAULT '[]' -- JSON: array of { date, completed }
);

-- Future: user preferences (notification time, theme, etc.)
CREATE TABLE IF NOT EXISTS user_preferences (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### JSON Shape: `mandatory_data`
```json
{
  "satisfaction": 72,
  "mood": 65,
  "stress": 40
}
```

### JSON Shape: `optional_data`
```json
{
  "activity": {
    "activities_done": ["gym", "walk"],
    "completed_at": "2026-04-19T21:14:00"
  },
  "reaction": {
    "what_ate": "pasta, coffee",
    "when": "19:30",
    "symptoms": 3,
    "completed_at": "2026-04-19T21:16:00"
  },
  "blood_pressure": {
    "systolic": 118,
    "diastolic": 76,
    "completed_at": "2026-04-19T21:17:00"
  }
}
```

### JSON Shape: `user_module_data` for Activity
```json
{
  "module_id": "activity",
  "data_key": "user_activities",
  "data": {
    "items": [
      { "id": "gym",      "label": "Gym",      "use_count": 24, "last_used": "2026-04-18" },
      { "id": "walk",     "label": "Walk",     "use_count": 31, "last_used": "2026-04-19" },
      { "id": "read",     "label": "Read",     "use_count": 18, "last_used": "2026-04-17" },
      { "id": "cycle",    "label": "Cycle",    "use_count": 7,  "last_used": "2026-04-10" },
      { "id": "knitting", "label": "Knitting", "use_count": 1,  "last_used": "2026-04-19" }
    ]
  }
}
```

### JSON Shape: `page_usage`
```json
{
  "module_id": "activity",
  "usage_log": [
    { "date": "2026-04-19", "completed": true },
    { "date": "2026-04-18", "completed": true },
    { "date": "2026-04-17", "completed": false },
    { "date": "2026-04-16", "completed": true },
    { "date": "2026-04-15", "completed": true }
  ]
}
```

---

## 6. Activity Module — Deep Dive

The activity module is the clearest example of how the module system handles dynamic, user-owned data. It is documented in detail here as the reference implementation.

### What It Does
Presents a grid of tappable buttons representing activities. User taps to select one or many. Can add new activities inline. Selection is saved to `daily_entries.optional_data`. Activity list and usage stats persist in `user_module_data`.

### Module Config
```typescript
// /src/modules/activity.ts
export const activityModule = {
  id: 'activity',
  label: 'Activity',
  tier: 'optional',
  icon: '',
  fields: [
    {
      id: 'activities_done',
      type: 'BUTTON_GRID',
      label: 'What did you do today?',
      config: {
        multiSelect: true,
        dynamicItems: true,
        itemsKey: 'user_activities',
        sortStrategy: 'recent_first',  // mid-term: implement; alpha: any order fine
        allowAdd: true,
        columns: 3,
      }
    }
  ],
  scoring: { basePoints: 0.25 }
}

// Default items seeded into user_module_data on first launch
export const DEFAULT_ACTIVITIES = [
  { id: 'gym',   label: 'Gym',   use_count: 0, last_used: null },
  { id: 'run',   label: 'Run',   use_count: 0, last_used: null },
  { id: 'craft', label: 'Craft', use_count: 0, last_used: null },
  { id: 'read',  label: 'Read',  use_count: 0, last_used: null },
]
```

### ButtonGrid Component Contract
The `ButtonGrid` component is **pure** — it receives everything it needs via props and emits values upward. It does not fetch its own data.

```javascript
// Props
{
  fieldConfig: object,       // the field config from the module definition
  value: string[],           // currently selected item ids
  items: Item[],             // resolved item list (fetched by parent/store)
  onChange: (ids) => void,   // called with new selection on every tap
  onAddItem: (label) => void // called when user adds a new activity
}

// Item shape
{
  id: string,
  label: string,
  use_count: number,
  last_used: string   // YYYY-MM-DD
}
```

The survey shell is responsible for loading dynamic items from `UserModuleData` before rendering a `BUTTON_GRID` field with `dynamicItems: true`, and for calling `repository.moduleData.updateItemUsage()` on save.

### Save Flow for Activity
1. User taps "Gym", "Walk"
2. `onChange(["gym", "walk"])` fires, updates Zustand survey state
3. User navigates forward / completes session
4. On session save:
   - Write `{ activities_done: ["gym", "walk"] }` into `daily_entries.optional_data.activity`
   - For each selected id, call `repository.moduleData.updateItemUsage("activity", "user_activities", id)` — increments `use_count`, updates `last_used`
   - Write `page_usage` log entry for "activity" with `completed: true`

### Adding a New Activity
1. User types "Knitting" in the add field, taps confirm
2. `onAddItem("Knitting")` fires
3. Repository creates new item in `user_module_data` with `use_count: 0`
4. Item appears in grid immediately (optimistic update in Zustand)
5. On session save: item `use_count` incremented to 1 via normal save flow

---

## 7. Blood Pressure Module — Deep Dive

### What It Does
Three fields: systolic slider, diastolic slider, when-taken selector. All taps, no keyboard. Sliders snap to 5mmHg increments so tapping is precise enough on mobile.

### Module Config
```typescript
// /src/modules/bloodPressure.ts
export const bloodPressureModule = {
  id: 'blood_pressure',
  label: 'Blood Pressure',
  tier: 'optional',
  icon: '',
  fields: [
    {
      id: 'systolic',
      type: 'SLIDER',
      label: 'Systolic',
      config: { min: 70, max: 200, step: 5, defaultValue: 120, showValue: true, unit: 'mmHg' }
    },
    {
      id: 'diastolic',
      type: 'SLIDER',
      label: 'Diastolic',
      config: { min: 40, max: 130, step: 5, defaultValue: 80, showValue: true, unit: 'mmHg' }
    },
    {
      id: 'when_taken',
      type: 'SINGLE_SELECT',
      label: 'When taken',
      config: {
        options: [
          { id: 'morning', label: 'Morning' },
          { id: 'midday',  label: 'Midday'  },
          { id: 'evening', label: 'Evening' },
        ],
        defaultValue: null,
      }
    }
  ],
  scoring: { basePoints: 0.25 }
}
```

---

## 8. Reaction (IBS) Module — Deep Dive

### What It Does
Two-step triage: first a yes/no on whether a reaction occurred, then a FODMAP category grid for what was eaten in the last 24hrs. The yes/no field gates the perceived urgency; the FODMAP grid avoids free text entirely.

### Module Config
```typescript
// /src/modules/reaction.ts
export const reactionModule = {
  id: 'reaction',
  label: 'IBS / Reaction',
  tier: 'optional',
  icon: '',
  fields: [
    {
      id: 'had_reaction',
      type: 'SINGLE_SELECT',
      label: 'Did you have a reaction today?',
      config: {
        options: [
          { id: 'yes', label: 'Yes' },
          { id: 'no',  label: 'No'  },
        ],
        defaultValue: null,
      }
    },
    {
      id: 'fodmap_categories',
      type: 'BUTTON_GRID',
      label: 'FODMAP categories eaten (last 24hrs)',
      config: {
        multiSelect: true,
        dynamicItems: false,
        staticItems: [
          { id: 'fructans',        label: 'Fructans'        },  // wheat, onion, garlic
          { id: 'gos',             label: 'GOS'             },  // legumes, beans
          { id: 'lactose',         label: 'Lactose'         },  // dairy
          { id: 'excess_fructose', label: 'Fructose'        },  // apples, honey, HFCS
          { id: 'sorbitol',        label: 'Sorbitol'        },  // stone fruits
          { id: 'mannitol',        label: 'Mannitol'        },  // mushrooms, cauliflower
          { id: 'polyols_other',   label: 'Other Polyols'   },
          { id: 'fructooligosaccharides', label: 'FOS'      },
          { id: 'galactooligosaccharides', label: 'GalOS'   },
        ],
        columns: 3,
      }
    }
  ],
  scoring: { basePoints: 0.25 }
}
```

---

## 9. Logic Layer

All business logic lives in pure functions. No side effects, no storage calls, no component imports. This makes them trivially testable and reusable.

### scoring.js
```javascript
/**
 * Calculate the score for a completed session.
 * @param {object} mandatoryData - { satisfaction, mood, stress }
 * @param {string[]} completedOptionals - array of completed module ids
 * @returns {number} score
 */
export function calculateScore(mandatoryData, completedOptionals) {
  const mandatoryComplete = mandatoryData.satisfaction != null
    && mandatoryData.mood != null
    && mandatoryData.stress != null
  
  const base = mandatoryComplete ? 0.5 : 0
  const bonus = completedOptionals.length * 0.25
  return base + bonus
}
```

### streaks.js
```javascript
/**
 * Calculate current streak from a list of entry dates.
 * A streak requires mandatory completion (score >= 0.5).
 * @param {Array<{ date: string, score: number }>} recentEntries - sorted desc
 * @returns {number} streak count
 */
export function calculateStreak(recentEntries) {
  // Walk backwards from today. Break on any gap or score < 0.5.
}
```

### adaptive.js
```javascript
/**
 * Determine which optional modules should be promoted to preferred
 * for this session based on rolling usage history.
 * @param {Object<moduleId, UsageLog>} usageLogs
 * @returns {string[]} module ids to promote
 */
export function getPromotedModules(usageLogs) {
  // For each module: count completions in last 5 sessions
  // If >= 3: include in promoted list
  // Return sorted by completion rate desc
}

/**
 * Determine if a previously promoted module should be demoted.
 * @param {UsageLog} usageLog - for a single module
 * @returns {boolean}
 */
export function shouldDemote(usageLog) {
  // If last 3 sessions all have completed: false
  // If last 3 sessions all have completed: false (skipped via the preferred page)
  // Count skips among last 3 sessions where module was shown as preferred
  // If 3 consecutive skips: true
}
```

---

## 10. Repository Layer

The repository is the only code that touches SQLite. Everything else treats storage as an opaque service. This is the boundary that allows Supabase to be swapped in later — only the repository implementations change, nothing above them.

### Interface (what the rest of the app calls)

```javascript
// entries
repository.entries.getByDate(date)         → DailyEntry | null
repository.entries.getRecent(n)            → DailyEntry[]
repository.entries.save(entry)             → void
repository.entries.update(id, patch)       → void

// module data
repository.moduleData.get(moduleId, key)   → object | null
repository.moduleData.set(moduleId, key, data) → void
repository.moduleData.updateItemUsage(moduleId, key, itemId) → void

// page usage
repository.pageUsage.get(moduleId)         → UsageLog
repository.pageUsage.appendEntry(moduleId, { date, completed }) → void

// preferences
repository.preferences.get(key)            → string | null
repository.preferences.set(key, value)     → void
```

---

## 11. State (Zustand)

Two separate Zustand stores. Both live in `src/store/`.

### Survey Store (`useSurveyStore`)

Survey phases: `loading → mandatory → preferred → optional → complete`

```typescript
{
  phase: 'loading' | 'mandatory' | 'preferred' | 'optional' | 'complete'
  mandatoryIndex: number           // which mandatory module is active
  preferredIndex: number           // which promoted module is active
  promotedModuleIds: string[]      // computed by adaptive.ts on init
  expandedOptionalId: string | null // which optional card is open

  // moduleId -> fieldId -> value
  fieldValues: Record<string, Record<string, unknown>>
  completedModuleIds: string[]

  // itemsKey -> DynamicButtonItem[] — loaded from DB on init, updated optimistically
  dynamicItems: Record<string, DynamicButtonItem[]>

  todayEntryId: string | null      // set if today's entry already exists (pre-fill + upsert)

  // Actions
  initSurvey(): Promise<void>      // loads dynamic items, promotions, pre-fills if re-opening
  setField(moduleId, fieldId, value): void
  completeModule(moduleId): void   // advances phase when all mandatory done
  skipPreferred(): void
  setExpandedOptional(id | null): void
  addItem(moduleId, itemsKey, label): Promise<void>  // adds dynamic item, optimistic update
  submitSession(): Promise<void>   // score → streak → upsert entry → log page usage → update item usage
  reset(): void
}
```

**Submit flow:**
1. Build `mandatoryData` from `fieldValues`
2. Build `optionalData` for completed optional modules, each with `completed_at`
3. `calculateScore(mandatoryData, completedOptionalIds)`
4. Load last 30 entries, prepend today, `calculateStreak`
5. Upsert `daily_entries` (insert if new, update if `todayEntryId` exists)
6. `appendPageUsage` for every optional module (completed or not)
7. `updateItemUsage` for each selected activity item

### App Store (`useAppStore`)
```typescript
{
  streak: number
  lastEntryDate: string | null
  todayComplete: boolean           // score >= 0.5 on today's entry

  loadAppState(): Promise<void>    // called on app open
  refreshStreak(): Promise<void>
}
```

---

## 12. Future Considerations (Do Not Build Yet)

These are captured here so that current decisions don't accidentally foreclose them.

### Backend Migration
- Repository interface is already the seam. Supabase client goes behind the same interface.
- `optional_data` and `user_module_data.data` are JSONB-ready.
- Auth should be introduced after third entry (in-app prompt, never on first open).
- Sync strategy: local-first, background sync. Conflicts resolved by `updated_at` — last write wins for MVP.

### User-Customisable Modules
- Module definitions currently live in code. The path to user-defined modules is: move module definitions into `user_module_data` as JSON. The render engine already reads config — it doesn't care where the config came from.
- A module builder UI can write valid module config objects to storage. The survey shell renders them without modification.

### Analytics and Infographics (Paid Tier)
- All data needed for analytics is already being stored.
- Queries are fast because mandatory fields are structured and score is precomputed.
- Optional data can be queried via JSONB operators in Supabase (e.g. `optional_data->'activity'->>'activities_done'`).
- Charts: Victory Native or Recharts (React Native compatible).
- Export: serialize `daily_entries` rows to JSON or CSV.

### Notification Customisation
- Notification time stored in `user_preferences` table (already in schema).
- UI to change time added in MVP settings screen.

### Growth of Optional Modules
- New module = new file in `/src/modules/`, entry in `MODULE_REGISTRY`.
- If new field type needed: new renderer in `/src/components/fields/`, entry in `FIELD_TYPES`.
- No DB migration required.
- No survey shell changes required.

---

## 13. Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-19 | Expo bare workflow over managed | Avoids native module restrictions as app grows |
| 2026-04-19 | SQLite locally, Supabase later | Structured queries from day one, clean migration path |
| 2026-04-19 | JSONB-shaped optional_data from day one | Avoids schema migration when optional modules change |
| 2026-04-19 | Config-driven modules, not hardcoded components | Enables future user-defined modules without rewrites |
| 2026-04-19 | Pure logic layer, no side effects | Testable without mocking storage or UI |
| 2026-04-19 | Repository pattern isolates storage | Supabase swap touches only repository, nothing above |
| 2026-04-19 | Score precomputed and stored | Fast aggregate queries without recomputing on read |
| 2026-04-19 | Streak requires mandatory completion only | Prevents gaming streak with trivial optional entries |
| 2026-04-19 | Auth deferred until after third entry | Reduces friction at highest-dropout moment |
| 2026-04-19 | TypeScript throughout | Developer familiar with TS; better tooling outweighs friction |
| 2026-04-19 | Day cutoff at 3am local time | Allows late-night entries without misdating them |
| 2026-04-19 | Suppress notification if today already complete | Removes the single most annoying possible UX moment |
| 2026-04-19 | Modules = cards (not pages/screens) | Matches mental model of filling out a form item, not navigating between screens |
| 2026-04-19 | Optional list: buttons with inline card expansion | Keeps all optionals visible at once; avoids navigation stack for quick completions |
| 2026-04-19 | Blood pressure uses sliders (step 5mmHg) not number input | Tapping a slider is faster than typing two numbers on mobile |
| 2026-04-19 | Reaction module: FODMAP grid, not free-text "what ate" | Structured data enables future analysis; typing food names is too slow |
| 2026-04-19 | Alpha optional modules: activity, reaction, blood_pressure | Covers the most distinct field types and real use cases; gratitude/social_media post-alpha |
| 2026-04-19 | Expo Go for Alpha dev, EAS APK to follow | Fastest iteration path; notifications tested properly once sideloaded |
| 2026-04-19 | Survey store pre-fills from existing entry on init | Allows re-opening today's survey without losing data; submit always upserts |
| 2026-04-19 | Page usage logged for all optionals every session | Needed for accurate adaptive promotion windows; log completed=false for unvisited |
| 2026-04-19 | Activity item usage updated on submit, not on tap | Prevents phantom usage counts if user deselects or abandons survey |
| 2026-04-19 | Two separate Zustand stores (survey + app) | Survey state is session-scoped and reset often; app state is persistent — mixing them causes unnecessary re-renders |
