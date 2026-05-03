import React, { useState } from 'react'
import { User, Users, Link as LinkIcon, LogOut, Plus, Trash2, Clock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { supabase } from '@/lib/supabase'
import { useTimetable } from '@/hooks/useTimetable'
import type { UserRow, GroupRow } from '@/types/database.types'

type Tab = 'profile' | 'groups' | 'timetable'

interface SettingsPageProps {
  user: UserRow
  groups: GroupRow[]
  onGroupsChange?: () => void
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

// ── Custom Time Select ─────────────────────────────────────────
function TimeSelect({
  value, onChange, id,
}: { value: string; onChange: (v: string) => void; id: string }) {
  const [h, m] = value ? value.split(':') : ['09', '00']
  const selectCls =
    'rounded-lg border-2 border-bg-dark bg-bg px-2 py-1.5 text-sm font-semibold text-text-heading focus:outline-none focus:border-accent-violet transition-colors cursor-pointer appearance-none'

  return (
    <div className="flex items-center gap-1">
      <select id={`${id}-h`} value={h} onChange={(e) => onChange(`${e.target.value}:${m}`)} className={selectCls}>
        {HOURS.map((hv) => <option key={hv}>{hv}</option>)}
      </select>
      <span className="font-bold text-text-muted text-sm">:</span>
      <select id={`${id}-m`} value={m} onChange={(e) => onChange(`${h}:${e.target.value}`)} className={selectCls}>
        {MINUTES.map((mv) => <option key={mv}>{mv}</option>)}
      </select>
    </div>
  )
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ user, groups, onGroupsChange }) => {
  const [tab, setTab] = useState<Tab>('profile')

  // ── Profile state ─────────────────────────────────────────────
  const [name, setName] = useState(user.name)
  const [nickname, setNickname] = useState(user.nickname)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const handleSaveProfile = async () => {
    setSaving(true); setSaveMsg(null)
    const { error } = await supabase.from('users').update({ name, nickname }).eq('id', user.id)
    setSaving(false)
    setSaveMsg(error ? error.message : 'Profile saved!')
    setTimeout(() => setSaveMsg(null), 3000)
  }

  // ── Groups state ─────────────────────────────────────────────
  const [inviteCode, setInviteCode] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [leaveLoading, setLeaveLoading] = useState<string | null>(null)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setJoinLoading(true); setJoinError(null)
    const { data: group, error: gErr } = await supabase
      .from('groups').select('id').eq('invite_code', inviteCode.trim()).single()
    if (gErr || !group) { setJoinError('Invalid invite code'); setJoinLoading(false); return }
    const { error: mErr } = await supabase.from('group_members').insert({ user_id: user.id, group_id: group.id })
    setJoinLoading(false)
    if (mErr) setJoinError(mErr.message)
    else { setInviteCode(''); onGroupsChange?.() }
  }

  const handleLeave = async (groupId: string) => {
    setLeaveLoading(groupId)
    await supabase.from('group_members').delete().eq('user_id', user.id).eq('group_id', groupId)
    setLeaveLoading(null); onGroupsChange?.()
  }

  // ── Timetable state ──────────────────────────────────────────
  const { blocks, addBlock, removeBlock } = useTimetable()
  const [newDay, setNewDay] = useState(1)
  const [newStart, setNewStart] = useState('08:00')
  const [newEnd, setNewEnd] = useState('10:00')
  const [newLabel, setNewLabel] = useState('')

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLabel.trim()) return
    addBlock({ dayOfWeek: newDay, startTime: newStart, endTime: newEnd, label: newLabel.trim(), color: '#C4B5FD' })
    setNewLabel('')
  }

  const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: 'profile',   label: 'Profile',   Icon: User },
    { id: 'groups',    label: 'Groups',    Icon: Users },
    { id: 'timetable', label: 'Timetable', Icon: Clock },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-heading">Settings</h1>
        <p className="text-text-muted text-sm mt-0.5">Manage your profile, groups, and weekly schedule.</p>
      </div>

      {/* Tab bar */}
      <div className="flex bg-bg rounded-pill p-1 gap-1 w-fit">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={[
              'flex items-center gap-2 px-5 py-2 rounded-pill text-sm font-semibold transition-all duration-200',
              tab === id ? 'bg-violet-gradient text-white shadow-float' : 'text-text-muted hover:text-text-body',
            ].join(' ')}
            id={`settings-tab-${id}`}
          >
            <Icon size={14} strokeWidth={2} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ─────────────────────────────────────────── */}
      {tab === 'profile' && (
        <Card className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar src={user.avatar_url} name={user.name} size="xl" />
            <div>
              <p className="text-sm font-bold text-text-heading">Profile Photo</p>
              <p className="text-xs text-text-muted mt-1">Avatar upload coming soon.</p>
              <button className="mt-2 text-xs text-accent-violet font-semibold border border-accent-violet/40 rounded-pill px-3 py-1 hover:bg-accent-violet-dim transition-colors opacity-50 cursor-not-allowed">
                Upload Photo
              </button>
            </div>
          </div>

          <hr className="border-bg-dark" />

          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-heading">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-card-sm border-2 border-bg-dark bg-bg px-4 py-2.5 text-sm text-text-heading focus:outline-none focus:border-accent-violet transition-colors"
              id="settings-name"
            />
          </div>

          {/* Nickname */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-heading">Nickname</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full rounded-card-sm border-2 border-bg-dark bg-bg px-4 py-2.5 text-sm text-text-heading focus:outline-none focus:border-accent-violet transition-colors"
              id="settings-nickname"
            />
          </div>

          {saveMsg && (
            <p className={`text-xs font-semibold rounded-pill px-3 py-2 animate-fade-in ${saveMsg.includes('saved') ? 'bg-green-50 text-status-consistent' : 'bg-red-50 text-red-500'}`}>
              {saveMsg}
            </p>
          )}

          <Button variant="primary" onClick={handleSaveProfile} loading={saving} id="settings-save-profile">
            Save Profile
          </Button>
        </Card>
      )}

      {/* ── Groups Tab ──────────────────────────────────────────── */}
      {tab === 'groups' && (
        <div className="space-y-4">
          {/* Current groups */}
          <Card className="space-y-3">
            <h3 className="font-bold text-text-heading text-sm">Current Groups</h3>
            {groups.length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center">You are not in any groups.</p>
            ) : (
              <ul className="space-y-2">
                {groups.map((g) => (
                  <li key={g.id} className="flex items-center justify-between py-2 px-3 bg-bg rounded-card-sm">
                    <div>
                      <p className="text-sm font-bold text-text-heading">{g.name}</p>
                      <p className="text-xs text-text-muted font-mono">Code: {g.invite_code}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={leaveLoading === g.id}
                      onClick={() => handleLeave(g.id)}
                      icon={<LogOut size={13} strokeWidth={2} />}
                      id={`leave-group-${g.id}`}
                    >
                      Leave
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Join via invite code */}
          <Card className="space-y-3">
            <h3 className="font-bold text-text-heading text-sm flex items-center gap-2">
              <LinkIcon size={14} strokeWidth={2} /> Join a Group
            </h3>
            <form onSubmit={handleJoin} className="flex gap-2">
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ABCD1234"
                className="flex-1 rounded-card-sm border-2 border-bg-dark bg-bg px-4 py-2.5 text-sm text-text-heading font-mono tracking-widest placeholder:tracking-normal placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors"
                id="settings-invite-code"
              />
              <Button type="submit" variant="primary" size="sm" loading={joinLoading} id="settings-join">
                Join
              </Button>
            </form>
            {joinError && <p className="text-xs text-red-500 font-medium">{joinError}</p>}
          </Card>
        </div>
      )}

      {/* ── Timetable Tab ────────────────────────────────────────── */}
      {tab === 'timetable' && (
        <div className="space-y-4">
          <Card className="space-y-4">
            <div>
              <h3 className="font-bold text-text-heading text-sm">Weekly Timetable</h3>
              <p className="text-xs text-text-muted mt-0.5">
                These recurring blocks appear as background slots in the War Room calendar.
              </p>
            </div>

            {/* Add block form */}
            <form onSubmit={handleAddBlock} className="space-y-3 border-2 border-bg-dark rounded-card-sm p-4 bg-bg">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Add Block</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Day */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-heading">Day</label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(Number(e.target.value))}
                    className="w-full rounded-lg border-2 border-bg-dark bg-card px-3 py-2 text-sm text-text-heading focus:outline-none focus:border-accent-violet transition-colors"
                    id="timetable-day"
                  >
                    {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                  </select>
                </div>

                {/* Label */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-heading">Label</label>
                  <input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Core CS Subjects"
                    className="w-full rounded-lg border-2 border-bg-dark bg-card px-3 py-2 text-sm text-text-heading placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors"
                    id="timetable-label"
                  />
                </div>

                {/* Start time */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-heading">Start</label>
                  <TimeSelect value={newStart} onChange={setNewStart} id="timetable-start" />
                </div>

                {/* End time */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-heading">End</label>
                  <TimeSelect value={newEnd} onChange={setNewEnd} id="timetable-end" />
                </div>
              </div>
              <Button type="submit" variant="primary" size="sm" icon={<Plus size={14} />} id="timetable-add">
                Add Block
              </Button>
            </form>

            {/* Block list */}
            {blocks.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-6">No timetable blocks yet.</p>
            ) : (
              <ul className="space-y-2">
                {blocks.map((b) => (
                  <li key={b.id} className="flex items-center justify-between px-3 py-2.5 bg-bg rounded-card-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                      <div>
                        <p className="text-sm font-semibold text-text-heading">{b.label}</p>
                        <p className="text-xs text-text-muted">
                          {DAYS[b.dayOfWeek]} · {b.startTime} – {b.endTime}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeBlock(b.id)}
                      className="text-text-muted hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50"
                      aria-label="Remove block"
                    >
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
