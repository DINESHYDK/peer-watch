-- ============================================================
-- Peer-Watch MVP — Database Migration 0002
-- Add Notifications and Storage for Avatars
-- ============================================================

-- ─── NOTIFICATIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id    UUID REFERENCES groups(id) ON DELETE CASCADE, -- Optional, if group-related
  type        TEXT NOT NULL, -- 'rating', 'group', 'system', 'leaderboard'
  content     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- ─── REALTIME ────────────────────────────────────────────────
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Authenticated users can insert notifications for others (e.g. peer rating, joining group)
CREATE POLICY "notifications_insert_auth" ON notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);


-- ─── STORAGE FOR AVATARS ─────────────────────────────────────
-- Note: Ensure Supabase Storage is enabled in the project.
-- Create a bucket named 'avatars' if it doesn't exist
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Anyone can view avatars
CREATE POLICY "Avatars are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Authenticated users can upload avatars (limit to their own folder based on user ID)
CREATE POLICY "Users can upload their own avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own avatar
CREATE POLICY "Users can update their own avatar." ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar." ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
