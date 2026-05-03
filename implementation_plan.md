# Peer-Watch MVP — Implementation Plan

> **Status:** Awaiting user approval before any code is written.

---

## 1. Overview

**Peer-Watch** is a gamified social accountability app for friend groups. Users log daily tasks, rate each other's performance, and compete on a live leaderboard. The "End of Day" resets nightly at **01:00 AM local time**, triggering score computation and dynamic status-tag assignment.

---

## 2. Tech Stack Decision

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **React 18 + Vite** | Fast HMR, optimal tree-shaking for small MVP |
| Language | **TypeScript (strict)** | Type-safety on Supabase rows + component props |
| Styling | **Tailwind CSS v3** | Matches prompt constraints; utility classes for rounded-[32px], pill shapes |
| Backend / DB | **Supabase** | Auth, Postgres, Realtime, Edge Functions all in one |
| State Management | **Zustand** | Lightweight global store — avoids Redux boilerplate for MVP scale |
| Data Fetching | **TanStack Query v5** | Caching, background refetches, optimistic updates for ratings |
| Cron / Nightly Reset | **Supabase Edge Function (Deno) + pg_cron** | Runs scoring & tag assignment at 01:00 AM |
| Auth | **Supabase Auth (Email/Password + Magic Link)** | Zero-cost, built-in session management |
| Fonts | **Poppins** (via Google Fonts) | Geometric, rounded — matches "bubble outline" logo style |

> **⚠️ ARCHITECTURAL DEVIATIONS — PERMISSION REQUIRED**
>
> 1. **Zustand + TanStack Query (instead of plain React state + raw `fetch`)**
>    The prompt doesn't specify a state library. I propose this pairing because:
>    - Zustand handles ephemeral UI state (active group, timer state, modal target).
>    - TanStack Query handles server state (tasks, summaries, ratings) with automatic invalidation after mutations.
>    - This prevents stale data and avoids prop-drilling across 4+ view levels.
>    **Please confirm you approve this combination before I proceed.**
>
> 2. **Supabase Edge Function for the nightly reset (instead of a client-side cron)**
>    Running `pg_cron` + a Deno Edge Function is the only reliable way to guarantee the 01:00 AM reset fires without requiring any user to have the app open.
>    **Please confirm you approve this approach.**

---

## 3. Design System Tokens (Tailwind Config)

```js
// tailwind.config.ts — extend.colors
colors: {
  bg:       { DEFAULT: '#E6E6FA' },           // lavender background
  card:     { DEFAULT: '#FDF5E6' },           // cream cards
  accent:   { yellow: '#FFE566', violet: '#5B21B6' },
  text:     { heading: '#1C0A4A', muted: '#8B8BA3' },
}
// extend.borderRadius
borderRadius: {
  card: '32px',
  pill: '9999px',
}
// extend.boxShadow
boxShadow: {
  float: '0 8px 32px rgba(91,33,182,0.12)',
}
```

**Typography rules:**
- All headings: `font-bold text-text-heading font-[Poppins]`
- Logo/App title: achieved with CSS `text-stroke` + heavy font-weight to mimic bubble-outline.
- Body / labels: `font-[Poppins] text-text-muted`

---

## 4. Database Schema (Exact per Prompt)

### 4.1 Tables

```sql
-- Users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  nickname      TEXT NOT NULL,
  avatar_url    TEXT,
  current_streak INT DEFAULT 0,
  global_score  FLOAT DEFAULT 0,
  status_tag    TEXT DEFAULT 'New'
);

-- Groups
CREATE TABLE groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  leader_id       UUID REFERENCES users(id),
  end_of_day_time TIME DEFAULT '01:00:00',
  invite_code     TEXT UNIQUE NOT NULL
);

-- Group Members (Join Table)
CREATE TABLE group_members (
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id   UUID REFERENCES groups(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, group_id)
);

-- Tasks
CREATE TABLE tasks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  date           DATE NOT NULL DEFAULT CURRENT_DATE,
  title          TEXT NOT NULL,
  hardness_level INT CHECK (hardness_level BETWEEN 1 AND 10),
  status         BOOLEAN DEFAULT FALSE
);

-- Daily Summaries
CREATE TABLE daily_summaries (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id             UUID REFERENCES groups(id) ON DELETE CASCADE,
  date                 DATE NOT NULL DEFAULT CURRENT_DATE,
  completion_percentage FLOAT DEFAULT 0,
  peer_rating_sum      INT DEFAULT 0,
  peer_rating_count    INT DEFAULT 0,
  UNIQUE (user_id, group_id, date)
);
```

### 4.2 Additional Table — Peer Ratings (Prompt gap — see note)

> **⚠️ GAP IN SCHEMA — PERMISSION REQUIRED**
>
> The prompt's schema stores `peer_rating_sum` and `peer_rating_count` aggregates in `daily_summaries` but has **no table to record individual ratings** (who rated whom, when, and what comment they left). Without this table, The Tribunal's comment feature and duplicate-rating prevention are impossible to implement.
>
> I propose adding:

```sql
CREATE TABLE peer_ratings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id    UUID REFERENCES users(id),
  ratee_id    UUID REFERENCES users(id),
  group_id    UUID REFERENCES groups(id),
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  rating      INT CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (rater_id, ratee_id, group_id, date)   -- one rating per pair per day
);
```
> **Please confirm you want this table added.**

### 4.3 Row-Level Security (RLS)

```
users:          Users can only UPDATE their own row.
tasks:          Users can only INSERT/UPDATE/DELETE their own tasks.
daily_summaries: Users can SELECT summaries for any group they belong to.
peer_ratings:   Users can INSERT for groups they belong to; SELECT own ratings.
groups:         Any authenticated user can SELECT; only leader can UPDATE.
group_members:  Members can SELECT; only leader can DELETE others.
```

### 4.4 Supabase Realtime

Enable `REPLICA IDENTITY FULL` on `tasks` and `daily_summaries` so the Command Center dashboard can subscribe to live task progress updates across friend cards without polling.

---

## 5. Gamification Engine (Nightly Reset Logic)

### 5.1 Scoring Formula

```
daily_score = (sum(hardness_level * 10) for completed tasks)
            * (completion_percentage / 100)
            * (peer_rating_sum / peer_rating_count OR 1 if no ratings)
```

### 5.2 Status Tag Rules

| Tag | Condition |
|---|---|
| **The Titan** / **Grindmaster** | ≥ 90% completion for 3+ consecutive days |
| **Consistent** | 70–89% completion (current day) |
| **Slipping** | < 50% completion for 2 consecutive days |
| **The Culprit** / **Sloth** | 0% completion OR no tasks logged |
| *(Default)* | **On Track** — doesn't meet any of the above thresholds |

> **Implementation note:** Consecutive-day logic requires reading the last 3 `daily_summaries` rows per user, ordered by date DESC — done inside the Edge Function.

### 5.3 Edge Function Flow (`/functions/nightly-reset`)

```
Trigger: pg_cron at '0 1 * * *' (01:00 AM UTC — see note below)

Steps:
1. For each user with tasks today:
   a. Compute completion_percentage = (completed / total) * 100
   b. Upsert into daily_summaries
2. For each user, fetch last 3 daily_summaries (all groups):
   a. Determine status_tag via the rules above
   b. Update users.status_tag, users.current_streak, users.global_score
```

> **⚠️ TIMEZONE NOTE — PERMISSION REQUIRED**
>
> Supabase pg_cron runs in **UTC**. If your target users are all in one timezone (e.g., IST = UTC+5:30), the cron should be `'30 19 * * *'` (7:30 PM UTC = 1:00 AM IST next day). For a multi-timezone product, the Edge Function would need to bucket users by timezone. For the MVP, I'll assume a **single timezone**. **Please confirm your target timezone.**

---

## 6. Project File Structure

```
peer-watch/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx                    # Vite entry
│   ├── App.tsx                     # Router root
│   ├── index.css                   # Tailwind base + custom fonts
│   │
│   ├── lib/
│   │   ├── supabase.ts             # createClient + typed database types
│   │   ├── queryClient.ts          # TanStack Query client singleton
│   │   └── scoring.ts              # Client-side formula helpers (preview scores)
│   │
│   ├── store/
│   │   └── useAppStore.ts          # Zustand: activeGroupId, timer state, modal target
│   │
│   ├── types/
│   │   └── database.types.ts       # Auto-generated from Supabase CLI
│   │
│   ├── hooks/
│   │   ├── useAuth.ts              # Session + user profile
│   │   ├── useGroupMembers.ts      # Members + their tasks for the active group
│   │   ├── useTasks.ts             # CRUD for current user's tasks (today)
│   │   ├── useDailySummary.ts      # Fetch/upsert daily_summaries
│   │   └── usePeerRating.ts        # Submit + fetch peer ratings
│   │
│   ├── components/
│   │   ├── ui/                     # Primitive design-system components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── StarRating.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── Avatar.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── AppShell.tsx        # Sidebar + top nav wrapper
│   │   │   ├── Sidebar.tsx         # Group switcher + nav links
│   │   │   └── TopBar.tsx          # Active group name + user avatar menu
│   │   │
│   │   ├── CommandCenter/
│   │   │   ├── CommandCenter.tsx   # Page root — grid of FriendCards
│   │   │   ├── FriendCard.tsx      # Status tag, streak flames, progress bar
│   │   │   ├── LeaderboardPanel.tsx
│   │   │   └── ProductivityHub.tsx # Live clock + Pomodoro timer
│   │   │
│   │   ├── WarRoom/
│   │   │   ├── WarRoom.tsx         # Page root
│   │   │   ├── TaskList.tsx        # Daily missions with hardness slider
│   │   │   ├── TaskItem.tsx        # Checkbox + hardness input + delete
│   │   │   ├── AddTaskForm.tsx     # Inline form to add a new mission
│   │   │   └── DayTimeline.tsx     # Vertical time-block timeline
│   │   │
│   │   └── Tribunal/
│   │       ├── TribunalModal.tsx   # Overlay modal
│   │       ├── ScoreSummary.tsx    # Base score + completion %
│   │       ├── StarRatingInput.tsx # Interactive 5-star widget
│   │       └── CommentBox.tsx      # Textarea for peer pressure/encouragement
│   │
│   ├── pages/
│   │   ├── AuthPage.tsx            # Login / Sign-up
│   │   ├── OnboardingPage.tsx      # Create profile + first group or join via code
│   │   ├── DashboardPage.tsx       # Hosts CommandCenter + Tribunal modal
│   │   └── WarRoomPage.tsx         # Hosts WarRoom view
│   │
│   └── router.tsx                  # React Router v6 route definitions
│
├── supabase/
│   ├── migrations/
│   │   └── 0001_init.sql           # All CREATE TABLE + RLS statements
│   └── functions/
│       └── nightly-reset/
│           └── index.ts            # Deno Edge Function
│
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
└── .env.local                      # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

---

## 7. Component Hierarchy & Data Flow

```
App (Router)
└── AppShell
    ├── Sidebar
    │   └── GroupSwitcher          → Zustand: sets activeGroupId
    ├── TopBar
    └── <Outlet>
        ├── DashboardPage
        │   ├── ProductivityHub    → Local state: clock, pomodoroPhase, timeLeft
        │   ├── CommandCenter
        │   │   └── FriendCard[]  → useGroupMembers(activeGroupId)
        │   │       └── onClick   → Zustand: sets tribunalTarget
        │   └── TribunalModal     → Zustand: tribunalTarget (null = hidden)
        │       ├── ScoreSummary  → useDailySummary(targetUser, date)
        │       ├── StarRatingInput → usePeerRating mutation
        │       └── CommentBox
        └── WarRoomPage
            ├── TaskList          → useTasks(currentUser, today)
            │   └── TaskItem[]
            ├── AddTaskForm       → useTasks.addTask mutation
            └── DayTimeline       → derived from tasks (no extra fetch)
```

---

## 8. Zustand Store Shape

```ts
interface AppStore {
  // Group context
  activeGroupId: string | null;
  setActiveGroupId: (id: string) => void;

  // Tribunal modal
  tribunalTarget: { userId: string; date: string } | null;
  openTribunal: (userId: string, date: string) => void;
  closeTribunal: () => void;

  // Pomodoro / Focus Timer
  pomodoroPhase: 'work' | 'shortBreak' | 'longBreak';
  pomodoroTimeLeft: number;   // seconds
  pomodoroRunning: boolean;
  pomodoroSessions: number;   // completed work intervals
  startPomodoro: () => void;
  pausePomodoro: () => void;
  resetPomodoro: () => void;
  tickPomodoro: () => void;   // called by useInterval every second
}
```

---

## 9. View Breakdown

### 9.1 Command Center (Dashboard)

**Layout:** 3-column responsive grid (2-col on tablet, 1-col on mobile)

**FriendCard data points:**
- Avatar + Name + Nickname
- `status_tag` → coloured Badge (Titan=violet, Consistent=green, Slipping=orange, Culprit=red)
- 21-day streak display: row of 21 flame icons (filled vs. ghost based on `streak_history`)
- Today's task progress bar: `completedTasks / totalTasks`
- "Review" button → opens Tribunal Modal

**ProductivityHub panel** (top-right fixed card):
- Digital clock (updates every second via `setInterval`)
- Pomodoro controls: Work 25 min / Short Break 5 min / Long Break 15 min
- Session counter (auto-advance phase on timer end)

### 9.2 War Room (Personal Setup)

**AddTaskForm:** Title input + Hardness Level slider (1–10) + Add button

**TaskItem:** Checkbox (updates `status`) + title + hardness badge + delete icon

**DayTimeline:** Vertical `<ol>` of time blocks derived from tasks; tasks are grouped into user-defined time slots (stored as optional `scheduled_at` time in tasks — see schema deviation note)

> **⚠️ SCHEMA DEVIATION — PERMISSION REQUIRED**
>
> The prompt's `tasks` table has no time-scheduling column. The War Room's DayTimeline requires a time slot to render timeline blocks. I propose adding an **optional** `scheduled_time TIME` column to the `tasks` table. If null, the task appears as "Unscheduled" at the bottom of the timeline.
> **Please confirm you want this column added.**

### 9.3 Tribunal Modal

- Triggered by: clicking FriendCard's "Review" button
- Shows: Target user's avatar, name, today's completion %, base score preview
- Interactive star rating (1–5) using hover animation
- Comment textarea
- Submit → calls `peer_ratings` INSERT + increments `daily_summaries.peer_rating_sum` and `peer_rating_count` via Supabase RPC function
- Disabled if current user has already rated this person today

### 9.4 Auth / Onboarding

- **AuthPage:** Email + password form (magic link as secondary option)
- **OnboardingPage:** 2-step wizard:
  1. Set name, nickname, upload avatar (Supabase Storage)
  2. Create a new group OR enter an invite code to join an existing one

---

## 10. TanStack Query Key Convention

```ts
['tasks', userId, date]               // useTasks
['groupMembers', groupId]             // useGroupMembers
['dailySummary', userId, groupId, date] // useDailySummary
['peerRating', raterId, rateeId, date] // usePeerRating (check if already rated)
```

---

## 11. Realtime Subscriptions

```ts
// In useGroupMembers — subscribe to tasks table changes for the group
supabase
  .channel(`group-tasks-${groupId}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `group_id=eq.${groupId}` }, payload => {
    queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] })
  })
  .subscribe()
```

> **Note:** Tasks don't have a direct `group_id` column. The Realtime filter will need to match on `user_id IN (list of group member user IDs)` — this is handled via a broadcast channel or by the Edge Function publishing a group-scoped event.

---

## 12. Build & Initialization Steps (Ordered)

1. `npm create vite@latest ./ -- --template react-ts`
2. Install dependencies:
   ```bash
   npm install @supabase/supabase-js @tanstack/react-query zustand react-router-dom
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```
3. Configure `tailwind.config.ts` with design tokens (Section 3)
4. Add `@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap')` to `index.css`
5. Initialize Supabase project locally (`supabase init`) and write migration SQL
6. Generate TypeScript types: `supabase gen types typescript --local > src/types/database.types.ts`
7. Build in order: `lib/` → `store/` → `hooks/` → `ui/` components → feature components → pages → router

---

## 13. Open Questions Summary (All Require Your Approval)

| # | Question | Default I'll use if approved |
|---|---|---|
| 1 | Use **Zustand + TanStack Query** for state? | Yes — proceed |
| 2 | Use **Supabase Edge Function + pg_cron** for nightly reset? | Yes — proceed |
| 3 | Add **`peer_ratings` table** for individual rating records? | Yes — add it |
| 4 | Target **timezone** for the 01:00 AM cron? | IST (UTC+5:30) |
| 5 | Add optional **`scheduled_time`** column to `tasks` for timeline? | Yes — add it |

---

## 14. Verification Plan

| Phase | Test |
|---|---|
| DB Schema | Apply migration locally, verify RLS policies with Supabase Studio |
| Auth | Sign up, sign in, magic link flows |
| Task CRUD | Add / complete / delete tasks; verify `useTasks` query invalidation |
| Tribunal | Submit rating; verify `peer_ratings` insert + `daily_summaries` aggregate update |
| Scoring | Manually trigger Edge Function; verify `global_score` and `status_tag` update |
| Realtime | Open two browser windows; complete a task in one and watch progress bar update in the other |
| Pomodoro | Run full 25-min cycle (accelerated in test); verify phase transitions |
