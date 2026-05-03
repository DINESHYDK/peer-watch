import React, { useState, useEffect } from 'react'
import {
  User, Users, Link as LinkIcon, LogOut, Plus, Trash2, Clock,
  Crown, Copy, Check, X, UserPlus,
} from 'lucide-react'
import toast from 'react-hot-toast'
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
function TimeSelect({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  const [h, m] = value ? value.split(':') : ['09', '00']
  const cls = 'rounded-lg border-2 border-bg-dark bg-bg px-2 py-1.5 text-sm font-semibold text-text-heading focus:outline-none focus:border-accent-violet transition-colors cursor-pointer appearance-none'
  return (
    <div className="flex items-center gap-1">
      <select id={`${id}-h`} value={h} onChange={(e) => onChange(`${e.target.value}:${m}`)} className={cls}>{HOURS.map((v) => <option key={v}>{v}</option>)}</select>
      <span className="font-bold text-text-muted text-sm">:</span>
      <select id={`${id}-m`} value={m} onChange={(e) => onChange(`${h}:${e.target.value}`)} className={cls}>{MINUTES.map((v) => <option key={v}>{v}</option>)}</select>
    </div>
  )
}

// ── Group Member type for the details modal ───────────────────
interface GroupMember {
  user_id: string
  users: { id: string; name: string; nickname: string; avatar_url: string | null }
}

// ── Group Details Modal ────────────────────────────────────────
function GroupDetailsModal({
  group, userId, onClose,
}: { group: GroupRow; userId: string; onClose: () => void }) {
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    supabase
      .from('group_members')
      .select('user_id, users(id, name, nickname, avatar_url)')
      .eq('group_id', group.id)
      .then(({ data }) => {
        setMembers((data as unknown as GroupMember[]) ?? [])
        setLoading(false)
      })
  }, [group.id])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleCopy = () => {
    navigator.clipboard.writeText(group.invite_code)
    setCopied(true)
    toast.success('Invite code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 modal-backdrop bg-text-heading/30 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-md bg-card rounded-card shadow-float-lg overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-violet-gradient px-6 pt-6 pb-5">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors" aria-label="Close">
            <X size={18} strokeWidth={2.5} />
          </button>
          <h2 className="text-xl font-bold text-white">{group.name}</h2>
          <p className="text-white/60 text-sm mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Invite Code */}
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Invite Code</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-bg rounded-card-sm px-4 py-2.5 font-mono text-lg font-bold text-accent-violet tracking-widest text-center select-all">
                {group.invite_code}
              </div>
              <button
                onClick={handleCopy}
                className="p-2.5 bg-accent-violet-dim hover:bg-accent-violet/20 rounded-card-sm transition-colors"
                aria-label="Copy invite code"
                id="copy-invite-code"
              >
                {copied ? <Check size={16} className="text-status-consistent" /> : <Copy size={16} className="text-accent-violet" />}
              </button>
            </div>
            <p className="text-xs text-text-muted mt-2">Share this code with friends so they can join your group.</p>
          </div>

          {/* Members list */}
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Members</p>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-bg rounded-card-sm animate-pulse-soft" />)}
              </div>
            ) : (
              <ul className="space-y-1.5">
                {members.map((m) => {
                  const isLeader = m.user_id === group.leader_id
                  const isYou = m.user_id === userId
                  return (
                    <li key={m.user_id} className="flex items-center gap-3 py-2 px-3 rounded-card-sm bg-bg">
                      <Avatar src={m.users.avatar_url} name={m.users.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-text-heading truncate">{m.users.name}</p>
                          {isLeader && <Crown size={12} className="text-accent-yellow-dark flex-shrink-0" />}
                          {isYou && <span className="text-xs font-bold text-accent-violet bg-accent-violet-dim px-1.5 py-0.5 rounded-pill flex-shrink-0">You</span>}
                        </div>
                        <p className="text-xs text-text-muted">@{m.users.nickname}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-bg border-t border-bg-dark text-center">
          <p className="text-xs text-text-muted">
            Created {new Date(group.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main Settings Page ─────────────────────────────────────────
export const SettingsPage: React.FC<SettingsPageProps> = ({ user, groups, onGroupsChange }) => {
  const [tab, setTab] = useState<Tab>('profile')

  // ── Profile ────────────────────────────────────────────────
  const [name, setName] = useState(user.name)
  const [nickname, setNickname] = useState(user.nickname)
  const [saving, setSaving] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarLoading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const { error: updateError } = await supabase.from('users').update({ avatar_url: data.publicUrl }).eq('id', user.id)
      if (updateError) throw updateError
      
      toast.success('Avatar updated! (Might take a moment to reflect)')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload avatar')
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    const { error } = await supabase.from('users').update({ name, nickname }).eq('id', user.id)
    setSaving(false)
    if (error) toast.error(error.message)
    else toast.success('Profile saved!')
  }

  // ── Groups ─────────────────────────────────────────────────
  const [inviteCode, setInviteCode] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [leaveLoading, setLeaveLoading] = useState<string | null>(null)
  const [detailGroup, setDetailGroup] = useState<GroupRow | null>(null)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return
    setJoinLoading(true)
    const { data: group, error: gErr } = await supabase
      .from('groups').select('id, name').eq('invite_code', inviteCode.trim()).single() as unknown as { data: { id: string; name: string } | null; error: any }
    if (gErr || !group) { toast.error('Invalid invite code'); setJoinLoading(false); return }
    const { error: mErr } = await supabase.from('group_members').insert({ user_id: user.id, group_id: group.id })
    setJoinLoading(false)
    if (mErr) {
      toast.error(mErr.message.includes('duplicate') ? 'You are already in this group' : mErr.message)
    } else {
      toast.success(`Joined "${group.name}" successfully!`)
      setInviteCode('')
      onGroupsChange?.()
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createName.trim()) return
    setCreateLoading(true)
    const { data: group, error: gErr } = await supabase
      .from('groups').insert({ name: createName.trim(), leader_id: user.id }).select().single() as unknown as { data: GroupRow | null; error: any }
    if (gErr || !group) { toast.error(gErr?.message || 'Failed'); setCreateLoading(false); return }
    const { error: mErr } = await supabase.from('group_members').insert({ user_id: user.id, group_id: group.id })
    setCreateLoading(false)
    if (mErr) toast.error(mErr.message)
    else {
      toast.success(`Group "${createName.trim()}" created!`)
      setCreateName('')
      onGroupsChange?.()
    }
  }

  const handleLeave = async (group: GroupRow) => {
    setLeaveLoading(group.id)
    const { error } = await supabase.from('group_members').delete().eq('user_id', user.id).eq('group_id', group.id)
    setLeaveLoading(null)
    if (error) toast.error(error.message)
    else { toast.success(`Left "${group.name}"`); onGroupsChange?.() }
  }

  // ── Timetable ──────────────────────────────────────────────
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
    toast.success('Block saved!')
  }

  const handleRemoveBlock = (id: string) => {
    removeBlock(id)
    toast.success('Block removed')
  }

  const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: 'profile',   label: 'Profile',   Icon: User },
    { id: 'groups',    label: 'Groups',    Icon: Users },
    { id: 'timetable', label: 'Timetable', Icon: Clock },
  ]

  const inputCls = 'w-full rounded-card-sm border-2 border-bg-dark bg-bg px-4 py-2.5 text-sm text-text-heading focus:outline-none focus:border-accent-violet transition-colors'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-heading">Settings</h1>
        <p className="text-text-muted text-sm mt-0.5">Manage your profile, groups, and weekly schedule.</p>
      </div>

      {/* Tab bar */}
      <div className="flex bg-bg rounded-pill p-1 gap-1 w-fit">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={['flex items-center gap-2 px-5 py-2 rounded-pill text-sm font-semibold transition-all duration-200',
              tab === id ? 'bg-violet-gradient text-white shadow-float' : 'text-text-muted hover:text-text-body',
            ].join(' ')} id={`settings-tab-${id}`}>
            <Icon size={14} strokeWidth={2} />{label}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ────────────────────────────────────── */}
      {tab === 'profile' && (
        <Card className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar src={user.avatar_url} name={user.name} size="xl" />
            <div>
              <p className="text-sm font-bold text-text-heading">Profile Photo</p>
              <p className="text-xs text-text-muted mt-1">Upload a new avatar.</p>
              <label className="mt-2 inline-block text-xs text-accent-violet font-semibold border border-accent-violet/40 rounded-pill px-3 py-1 hover:bg-accent-violet-dim transition-colors cursor-pointer">
                {avatarLoading ? 'Uploading...' : 'Upload Photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={avatarLoading}
                />
              </label>
            </div>
          </div>
          <hr className="border-bg-dark" />
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-heading">Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} id="settings-name" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-heading">Nickname</label>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} className={inputCls} id="settings-nickname" />
          </div>
          <Button variant="primary" onClick={handleSaveProfile} loading={saving} id="settings-save-profile">
            Save Profile
          </Button>
        </Card>
      )}

      {/* ── Groups Tab ─────────────────────────────────────── */}
      {tab === 'groups' && (
        <div className="space-y-4">
          {/* Action bar: Join + Create */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Join */}
            <Card className="space-y-3">
              <h3 className="font-bold text-text-heading text-sm flex items-center gap-2">
                <LinkIcon size={14} strokeWidth={2} /> Join a Group
              </h3>
              <form onSubmit={handleJoin} className="flex gap-2">
                <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="ABCD1234"
                  className="flex-1 rounded-card-sm border-2 border-bg-dark bg-bg px-3 py-2.5 text-sm text-text-heading font-mono tracking-widest placeholder:tracking-normal placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors"
                  id="settings-invite-code" />
                <Button type="submit" variant="primary" size="sm" loading={joinLoading} id="settings-join">Join</Button>
              </form>
            </Card>

            {/* Create */}
            <Card className="space-y-3">
              <h3 className="font-bold text-text-heading text-sm flex items-center gap-2">
                <UserPlus size={14} strokeWidth={2} /> Create a Group
              </h3>
              <form onSubmit={handleCreate} className="flex gap-2">
                <input value={createName} onChange={(e) => setCreateName(e.target.value)}
                  placeholder="The Grind Collective"
                  className="flex-1 rounded-card-sm border-2 border-bg-dark bg-bg px-3 py-2.5 text-sm text-text-heading placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors"
                  id="settings-create-name" />
                <Button type="submit" variant="primary" size="sm" loading={createLoading} icon={<Plus size={14} />} id="settings-create">
                  Create
                </Button>
              </form>
            </Card>
          </div>

          {/* Current groups list */}
          <Card className="space-y-3">
            <h3 className="font-bold text-text-heading text-sm">Your Groups</h3>
            {groups.length === 0 ? (
              <div className="text-center py-6">
                <Users size={32} strokeWidth={1} className="mx-auto text-text-light mb-2" />
                <p className="text-sm text-text-muted">You are not in any groups yet.</p>
                <p className="text-xs text-text-muted mt-1">Join one above or create your own.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {groups.map((g) => (
                  <li
                    key={g.id}
                    className="flex items-center justify-between py-2.5 px-4 bg-bg rounded-card-sm hover:bg-accent-violet-dim/30 transition-colors cursor-pointer group"
                    onClick={() => setDetailGroup(g)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-accent-violet flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-text-heading truncate">{g.name}</p>
                          {g.leader_id === user.id && <Crown size={12} className="text-accent-yellow-dark flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-text-muted font-mono">Code: {g.invite_code}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost" size="sm"
                      loading={leaveLoading === g.id}
                      onClick={(e) => { e.stopPropagation(); handleLeave(g) }}
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
        </div>
      )}

      {/* ── Timetable Tab ──────────────────────────────────── */}
      {tab === 'timetable' && (
        <div className="space-y-4">
          <Card className="space-y-4">
            <div>
              <h3 className="font-bold text-text-heading text-sm">Weekly Timetable</h3>
              <p className="text-xs text-text-muted mt-0.5">These recurring blocks appear as background slots in the War Room calendar.</p>
            </div>

            <form onSubmit={handleAddBlock} className="space-y-3 border-2 border-bg-dark rounded-card-sm p-4 bg-bg">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Add Block</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-heading">Day</label>
                  <select value={newDay} onChange={(e) => setNewDay(Number(e.target.value))}
                    className="w-full rounded-lg border-2 border-bg-dark bg-card px-3 py-2 text-sm text-text-heading focus:outline-none focus:border-accent-violet transition-colors" id="timetable-day">
                    {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-heading">Label</label>
                  <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Core CS Subjects"
                    className="w-full rounded-lg border-2 border-bg-dark bg-card px-3 py-2 text-sm text-text-heading placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors" id="timetable-label" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-heading">Start</label>
                  <TimeSelect value={newStart} onChange={setNewStart} id="timetable-start" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-heading">End</label>
                  <TimeSelect value={newEnd} onChange={setNewEnd} id="timetable-end" />
                </div>
              </div>
              <Button type="submit" variant="primary" size="sm" icon={<Plus size={14} />} id="timetable-add">Add Block</Button>
            </form>

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
                        <p className="text-xs text-text-muted">{DAYS[b.dayOfWeek]} · {b.startTime} – {b.endTime}</p>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveBlock(b.id)} className="text-text-muted hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50" aria-label="Remove block">
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {/* Group Details Modal */}
      {detailGroup && (
        <GroupDetailsModal
          group={detailGroup}
          userId={user.id}
          onClose={() => setDetailGroup(null)}
        />
      )}
    </div>
  )
}
