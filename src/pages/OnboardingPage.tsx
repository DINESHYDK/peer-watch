import React, { useState } from 'react'
import { ArrowRight, Users, User, Link as LinkIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'

type Step = 'profile' | 'group'

interface OnboardingPageProps {
  userId: string
  onComplete: () => void
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ userId, onComplete }) => {
  const [step, setStep] = useState<Step>('profile')
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [groupMode, setGroupMode] = useState<'create' | 'join'>('create')
  const [groupName, setGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [groupLoading, setGroupLoading] = useState(false)
  const [groupError, setGroupError] = useState<string | null>(null)

  const inputCls =
    'w-full rounded-card-sm border-2 border-bg-dark bg-bg px-4 py-2.5 text-sm text-text-heading placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors'

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!name.trim() || !nickname.trim()) return
    setProfileLoading(true); setProfileError(null)
    const { error } = await supabase.from('users').insert({ id: userId, name: name.trim(), nickname: nickname.trim() })
    setProfileLoading(false)
    if (error) setProfileError(error.message)
    else setStep('group')
  }

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setGroupLoading(true); setGroupError(null)
    try {
      if (groupMode === 'create') {
        const { data: group, error: gErr } = await supabase.from('groups').insert({ name: groupName.trim(), leader_id: userId }).select().single()
        if (gErr) throw gErr
        const { error: mErr } = await supabase.from('group_members').insert({ user_id: userId, group_id: group.id })
        if (mErr) throw mErr
      } else {
        const { data: group, error: gErr } = await supabase.from('groups').select('id').eq('invite_code', inviteCode.trim()).single()
        if (gErr || !group) throw new Error('Invalid invite code')
        const { error: mErr } = await supabase.from('group_members').insert({ user_id: userId, group_id: group.id })
        if (mErr) throw mErr
      }
      onComplete() // ← calls fetchGroups(), no full page reload
    } catch (err: unknown) {
      setGroupError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setGroupLoading(false) }
  }

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="logo-bubble text-4xl">Peer-Watch</h1>
          <p className="text-xs text-text-muted mt-2 font-medium">Let's get you set up</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 justify-center mb-6">
          {(['profile', 'group'] as const).map((s, i) => (
            <React.Fragment key={s}>
              <div className={[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                step === s || (s === 'profile' && step === 'group') ? 'bg-accent-violet text-white' : 'bg-bg-dark text-text-muted',
              ].join(' ')}>
                {i + 1}
              </div>
              {i === 0 && <div className="flex-1 h-0.5 bg-bg-dark max-w-[60px]" />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-card rounded-card shadow-float-lg p-8">
          {step === 'profile' ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <User size={15} strokeWidth={2} className="text-accent-violet" />
                <h2 className="font-bold text-text-heading text-lg">Create your profile</h2>
              </div>
              <p className="text-xs text-text-muted mb-5">Your crew will see this.</p>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-heading mb-1.5">Full Name</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Johnson" className={inputCls} id="onboard-name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-heading mb-1.5">Nickname</label>
                  <input type="text" required value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="thegrindmaster" className={inputCls} id="onboard-nickname" />
                </div>
                {profileError && <p className="text-xs text-red-500 font-medium">{profileError}</p>}
                <Button type="submit" variant="primary" fullWidth loading={profileLoading} icon={<ArrowRight size={14} />} id="onboard-profile-next">
                  Next
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Users size={15} strokeWidth={2} className="text-accent-violet" />
                <h2 className="font-bold text-text-heading text-lg">Join the crew</h2>
              </div>
              <p className="text-xs text-text-muted mb-5">Create a group or join one.</p>

              <div className="flex bg-bg rounded-pill p-1 mb-5">
                {(['create', 'join'] as const).map((m) => (
                  <button key={m} onClick={() => setGroupMode(m)}
                    className={['flex-1 text-xs font-semibold rounded-pill py-2 transition-all duration-200',
                      groupMode === m ? 'bg-violet-gradient text-white shadow-float' : 'text-text-muted'].join(' ')}
                    id={`group-mode-${m}`}>
                    {m === 'create' ? 'Create Group' : 'Join Group'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleGroupSubmit} className="space-y-4">
                {groupMode === 'create' ? (
                  <div>
                    <label className="block text-xs font-semibold text-text-heading mb-1.5">Group Name</label>
                    <input type="text" required value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="The Grind Collective" className={inputCls} id="group-name" />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-text-heading mb-1.5">Invite Code</label>
                    <div className="relative">
                      <LinkIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input type="text" required value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="ABCD1234"
                        className="w-full rounded-card-sm border-2 border-bg-dark bg-bg pl-9 pr-4 py-2.5 text-sm text-text-heading font-mono tracking-widest placeholder:tracking-normal placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors"
                        id="invite-code" />
                    </div>
                  </div>
                )}
                {groupError && <p className="text-xs text-red-500 font-medium">{groupError}</p>}
                <Button type="submit" variant="primary" fullWidth loading={groupLoading} id="onboard-group-submit">
                  {groupMode === 'create' ? 'Create and Enter' : 'Join and Enter'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
