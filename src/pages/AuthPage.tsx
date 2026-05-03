import React, { useState } from 'react'
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Mode = 'signin' | 'signup'

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicSent, setMagicSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true)
    try {
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({ email, password })
        if (err) throw err
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setLoading(false) }
  }

  const handleMagicLink = async () => {
    if (!email) { setError('Enter your email first'); return }
    setLoading(true); setError(null)
    const { error: err } = await supabase.auth.signInWithOtp({ email })
    setLoading(false)
    if (err) setError(err.message)
    else setMagicSent(true)
  }

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="logo-bubble text-5xl">Peer-Watch</h1>
          <p className="text-text-muted text-sm mt-2 font-medium">Accountability · Gamified</p>
        </div>

        <div className="bg-card rounded-card shadow-float-lg p-8">
          <h2 className="font-bold text-text-heading text-xl mb-6 text-center">
            {mode === 'signin' ? 'Welcome back' : 'Join the grind'}
          </h2>

          {magicSent ? (
            <div className="text-center space-y-3">
              <Mail size={36} strokeWidth={1.5} className="mx-auto text-accent-violet" />
              <p className="font-semibold text-text-heading">Magic link sent!</p>
              <p className="text-sm text-text-muted">Check your email to log in.</p>
              <button onClick={() => setMagicSent(false)} className="text-xs text-accent-violet font-semibold hover:underline">
                Try again
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-heading mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-card-sm border-2 border-bg-dark bg-bg pl-9 pr-4 py-2.5 text-sm text-text-heading placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors"
                    id="auth-email" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-heading mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-card-sm border-2 border-bg-dark bg-bg pl-9 pr-4 py-2.5 text-sm text-text-heading placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors"
                    id="auth-password" />
                </div>
              </div>

              {error && <p className="text-xs text-red-500 font-medium bg-red-50 rounded-pill px-3 py-2 animate-fade-in">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full bg-violet-gradient text-white font-bold rounded-pill py-3 text-sm transition-all duration-200 hover:shadow-glow hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
                id="auth-submit">
                {loading
                  ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <>{mode === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight size={14} /></>
                }
              </button>

              <div className="flex items-center gap-2 my-2">
                <div className="flex-1 h-px bg-bg-dark" /><span className="text-xs text-text-muted">or</span><div className="flex-1 h-px bg-bg-dark" />
              </div>

              <button type="button" onClick={handleMagicLink} disabled={loading}
                className="w-full border-2 border-bg-dark text-text-muted font-semibold rounded-pill py-2.5 text-sm hover:border-accent-violet hover:text-accent-violet transition-all duration-200 flex items-center justify-center gap-2"
                id="magic-link-btn">
                <Sparkles size={14} /> Send Magic Link
              </button>
            </form>
          )}

          {!magicSent && (
            <p className="text-center text-xs text-text-muted mt-6">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null) }}
                className="text-accent-violet font-bold hover:underline" id="auth-mode-toggle">
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
