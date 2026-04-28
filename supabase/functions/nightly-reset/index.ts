// Supabase Edge Function — Nightly Reset
// Scheduled via pg_cron at 7:30 PM UTC (= 1:00 AM IST)
// Deploy: supabase functions deploy nightly-reset

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, serviceRoleKey)

Deno.serve(async (_req) => {
  try {
    const today = new Date()
    // In IST (UTC+5:30), 1 AM IST = previous calendar day still
    // so we compute "yesterday" in IST as the reset date
    const istOffset = 5.5 * 60 * 60 * 1000
    const nowIST = new Date(today.getTime() + istOffset)
    // The reset processes the day that just ended
    const resetDate = new Date(nowIST)
    resetDate.setDate(resetDate.getDate() - 1)
    const dateStr = resetDate.toISOString().split('T')[0]

    // ── Step 1: For every user with tasks on resetDate, compute completion ──
    const { data: taskGroups, error: taskErr } = await supabase
      .from('tasks')
      .select('user_id, status')
      .eq('date', dateStr)

    if (taskErr) throw taskErr

    // Group by user_id
    const byUser: Record<string, { total: number; completed: number }> = {}
    for (const row of taskGroups ?? []) {
      if (!byUser[row.user_id]) byUser[row.user_id] = { total: 0, completed: 0 }
      byUser[row.user_id].total++
      if (row.status) byUser[row.user_id].completed++
    }

    // ── Step 2: Fetch all group memberships for these users ──
    const userIds = Object.keys(byUser)
    const { data: memberships } = await supabase
      .from('group_members')
      .select('user_id, group_id')
      .in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000'])

    // Build user → groups map
    const userGroups: Record<string, string[]> = {}
    for (const m of memberships ?? []) {
      if (!userGroups[m.user_id]) userGroups[m.user_id] = []
      userGroups[m.user_id].push(m.group_id)
    }

    // ── Step 3: Upsert daily_summaries ──
    const summaryUpserts = []
    for (const [userId, counts] of Object.entries(byUser)) {
      const completionPct = counts.total > 0 ? (counts.completed / counts.total) * 100 : 0
      for (const groupId of userGroups[userId] ?? []) {
        summaryUpserts.push({
          user_id: userId,
          group_id: groupId,
          date: dateStr,
          completion_percentage: completionPct,
        })
      }
    }

    if (summaryUpserts.length > 0) {
      await supabase
        .from('daily_summaries')
        .upsert(summaryUpserts, { onConflict: 'user_id,group_id,date', ignoreDuplicates: false })
    }

    // ── Step 4: Compute daily_score for each summary ──
    // daily_score = (sum of completed hardness * 10) * (completion%) * avg_peer_rating
    const { data: allSummaries } = await supabase
      .from('daily_summaries')
      .select('id, user_id, group_id, completion_percentage, peer_rating_sum, peer_rating_count')
      .eq('date', dateStr)

    for (const summary of allSummaries ?? []) {
      const { data: hardnessTasks } = await supabase
        .from('tasks')
        .select('hardness_level')
        .eq('user_id', summary.user_id)
        .eq('date', dateStr)
        .eq('status', true)

      const hardnessSum = (hardnessTasks ?? []).reduce((acc, t) => acc + (t.hardness_level ?? 0), 0)
      const avgRating = summary.peer_rating_count > 0
        ? summary.peer_rating_sum / summary.peer_rating_count
        : 1
      const score = (hardnessSum * 10) * (summary.completion_percentage / 100) * avgRating

      await supabase
        .from('daily_summaries')
        .update({ daily_score: score })
        .eq('id', summary.id)
    }

    // ── Step 5: Compute status_tag + streak per user ──
    const allUserIds = [...new Set([
      ...userIds,
      ...(memberships ?? []).map((m) => m.user_id),
    ])]

    for (const userId of allUserIds) {
      // Fetch last 3 days of summaries
      const { data: recentSummaries } = await supabase
        .from('daily_summaries')
        .select('date, completion_percentage')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(3)

      const completions = (recentSummaries ?? []).map((s) => s.completion_percentage)
      const todayPct = completions[0] ?? 0
      const yesterdayPct = completions[1]
      const twoDaysAgoPct = completions[2]

      let statusTag = 'On Track'
      if (todayPct === 0) {
        statusTag = Math.random() > 0.5 ? 'The Culprit' : 'Sloth'
      } else if (todayPct < 50 && yesterdayPct !== undefined && yesterdayPct < 50) {
        statusTag = 'Slipping'
      } else if (todayPct >= 90 && yesterdayPct !== undefined && yesterdayPct >= 90 && twoDaysAgoPct !== undefined && twoDaysAgoPct >= 90) {
        statusTag = Math.random() > 0.5 ? 'The Titan' : 'Grindmaster'
      } else if (todayPct >= 70) {
        statusTag = 'Consistent'
      }

      // Streak: count consecutive days with completion > 0
      const { data: streakRows } = await supabase
        .from('daily_summaries')
        .select('date, completion_percentage')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(60)

      let streak = 0
      for (const row of streakRows ?? []) {
        if (row.completion_percentage > 0) streak++
        else break
      }

      // Sum global_score
      const { data: scoreRows } = await supabase
        .from('daily_summaries')
        .select('daily_score')
        .eq('user_id', userId)

      const globalScore = (scoreRows ?? []).reduce((acc, r) => acc + (r.daily_score ?? 0), 0)

      await supabase
        .from('users')
        .update({ status_tag: statusTag, current_streak: streak, global_score: globalScore })
        .eq('id', userId)
    }

    return new Response(JSON.stringify({ success: true, date: dateStr }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error('Nightly reset error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
