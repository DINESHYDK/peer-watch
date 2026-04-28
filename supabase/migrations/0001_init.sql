-- ============================================================
-- Peer-Watch MVP — Database Migration 0001
-- Target: Supabase (PostgreSQL 15+)
-- ============================================================

-- ─── Enable UUID extension ───────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  nickname       TEXT NOT NULL,
  avatar_url     TEXT,
  current_streak INT DEFAULT 0,
  global_score   FLOAT DEFAULT 0,
  status_tag     TEXT DEFAULT 'New',
  timezone       TEXT DEFAULT 'Asia/Kolkata',
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ─── GROUPS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  leader_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  end_of_day_time TIME DEFAULT '01:00:00',
  invite_code     TEXT UNIQUE NOT NULL DEFAULT substring(gen_random_uuid()::text, 1, 8),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── GROUP MEMBERS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_members (
  user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id  UUID REFERENCES groups(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, group_id)
);

-- ─── TASKS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  date           DATE NOT NULL DEFAULT CURRENT_DATE,
  title          TEXT NOT NULL,
  hardness_level INT CHECK (hardness_level BETWEEN 1 AND 10) DEFAULT 5,
  status         BOOLEAN DEFAULT FALSE,
  start_time     TIME,           -- FullCalendar drag-to-create start
  end_time       TIME,           -- FullCalendar drag-to-create end
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ─── DAILY SUMMARIES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_summaries (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id              UUID REFERENCES groups(id) ON DELETE CASCADE,
  date                  DATE NOT NULL DEFAULT CURRENT_DATE,
  completion_percentage FLOAT DEFAULT 0,
  peer_rating_sum       INT DEFAULT 0,
  peer_rating_count     INT DEFAULT 0,
  daily_score           FLOAT DEFAULT 0,
  UNIQUE (user_id, group_id, date)
);

-- ─── PEER RATINGS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS peer_ratings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  ratee_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id   UUID REFERENCES groups(id) ON DELETE CASCADE,
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  rating     INT CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (rater_id, ratee_id, group_id, date)
);

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks (user_id, date);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON daily_summaries (user_id, date);
CREATE INDEX IF NOT EXISTS idx_peer_ratings_ratee_date ON peer_ratings (ratee_id, date);

-- ─── REALTIME ────────────────────────────────────────────────
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE daily_summaries REPLICA IDENTITY FULL;

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_ratings ENABLE ROW LEVEL SECURITY;

-- users: read all, write own
CREATE POLICY "users_select_all" ON users FOR SELECT USING (true);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- groups: read all, write own (leader)
CREATE POLICY "groups_select_all" ON groups FOR SELECT USING (true);
CREATE POLICY "groups_insert_auth" ON groups FOR INSERT WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "groups_update_leader" ON groups FOR UPDATE USING (auth.uid() = leader_id);

-- group_members: read for members, insert self
CREATE POLICY "group_members_select" ON group_members FOR SELECT USING (true);
CREATE POLICY "group_members_insert_self" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "group_members_delete_self" ON group_members FOR DELETE USING (auth.uid() = user_id);

-- tasks: read all in same groups, write own
CREATE POLICY "tasks_select_all" ON tasks FOR SELECT USING (true);
CREATE POLICY "tasks_insert_own" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update_own" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tasks_delete_own" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- daily_summaries: read all, write via service role only
CREATE POLICY "summaries_select_all" ON daily_summaries FOR SELECT USING (true);

-- peer_ratings: read all, insert authenticated
CREATE POLICY "ratings_select_all" ON peer_ratings FOR SELECT USING (true);
CREATE POLICY "ratings_insert_auth" ON peer_ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- ─── RPC: Submit peer rating + update aggregates ─────────────
CREATE OR REPLACE FUNCTION submit_peer_rating(
  p_rater_id  UUID,
  p_ratee_id  UUID,
  p_group_id  UUID,
  p_date      DATE,
  p_rating    INT,
  p_comment   TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Insert individual rating (unique constraint prevents duplicates)
  INSERT INTO peer_ratings (rater_id, ratee_id, group_id, date, rating, comment)
  VALUES (p_rater_id, p_ratee_id, p_group_id, p_date, p_rating, p_comment)
  ON CONFLICT (rater_id, ratee_id, group_id, date)
  DO UPDATE SET rating = p_rating, comment = p_comment;

  -- Upsert daily_summary aggregate
  INSERT INTO daily_summaries (user_id, group_id, date, peer_rating_sum, peer_rating_count)
  VALUES (p_ratee_id, p_group_id, p_date, p_rating, 1)
  ON CONFLICT (user_id, group_id, date)
  DO UPDATE SET
    peer_rating_sum   = (SELECT COALESCE(SUM(rating), 0) FROM peer_ratings
                         WHERE ratee_id = p_ratee_id AND group_id = p_group_id AND date = p_date),
    peer_rating_count = (SELECT COUNT(*) FROM peer_ratings
                         WHERE ratee_id = p_ratee_id AND group_id = p_group_id AND date = p_date);
END;
$$;

-- ─── pg_cron: Nightly reset at 7:30 PM UTC (1:00 AM IST) ────
-- Requires pg_cron extension enabled in Supabase Dashboard > Extensions
-- SELECT cron.schedule('nightly-reset', '30 19 * * *', $$
--   SELECT net.http_post(
--     url := current_setting('app.supabase_url') || '/functions/v1/nightly-reset',
--     headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key'))
--   );
-- $$);
