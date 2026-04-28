import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store/useAppStore'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${pad(m)}:${pad(s)}`
}

const PHASE_LABELS = {
  work: 'Deep Work',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
}

const PHASE_COLORS = {
  work: '#5B21B6',
  shortBreak: '#059669',
  longBreak: '#2563EB',
}

export const ProductivityHub: React.FC = () => {
  const { pomodoro, startPomodoro, pausePomodoro, resetPomodoro, tickPomodoro, setPhase } =
    useAppStore()

  const [clock, setClock] = useState(new Date())

  // Clock tick
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Pomodoro tick
  useEffect(() => {
    if (!pomodoro.running) return
    const id = setInterval(() => tickPomodoro(), 1000)
    return () => clearInterval(id)
  }, [pomodoro.running, tickPomodoro])

  const phaseColor = PHASE_COLORS[pomodoro.phase]

  // Progress ring calculation
  const TOTAL = pomodoro.phase === 'work' ? 25 * 60 : pomodoro.phase === 'shortBreak' ? 5 * 60 : 15 * 60
  const progress = ((TOTAL - pomodoro.timeLeft) / TOTAL) * 100
  const circumference = 2 * Math.PI * 42 // r=42
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <Card className="flex flex-col gap-5" padding="lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-text-heading text-base">⚡ Productivity Hub</h2>
        <div className="text-right">
          <p className="text-lg font-bold text-text-heading tabular-nums">
            {clock.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p className="text-xs text-text-muted">
            {clock.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>

      {/* Phase Tabs */}
      <div className="flex gap-1 bg-bg rounded-pill p-1">
        {(['work', 'shortBreak', 'longBreak'] as const).map((phase) => (
          <button
            key={phase}
            onClick={() => setPhase(phase)}
            className={[
              'flex-1 text-xs font-semibold rounded-pill py-1.5 transition-all duration-200',
              pomodoro.phase === phase
                ? 'text-white shadow-float'
                : 'text-text-muted hover:text-text-body',
            ].join(' ')}
            style={pomodoro.phase === phase ? { backgroundColor: phaseColor } : {}}
          >
            {phase === 'work' ? '🧠 Work' : phase === 'shortBreak' ? '☕ Short' : '🛌 Long'}
          </button>
        ))}
      </div>

      {/* Circular progress timer */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {/* Track */}
            <circle cx="50" cy="50" r="42" fill="none" stroke="#E6E6FA" strokeWidth="7" />
            {/* Progress */}
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke={phaseColor}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums text-text-heading">
              {formatTime(pomodoro.timeLeft)}
            </span>
            <span className="text-xs text-text-muted font-medium">
              {PHASE_LABELS[pomodoro.phase]}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetPomodoro}
            aria-label="Reset timer"
          >
            ↺
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={pomodoro.running ? pausePomodoro : startPomodoro}
            id="pomodoro-toggle"
          >
            {pomodoro.running ? '⏸ Pause' : '▶ Start'}
          </Button>
        </div>

        {/* Session counter */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className={[
                'w-2.5 h-2.5 rounded-full transition-all duration-300',
                i < (pomodoro.sessions % 4)
                  ? 'scale-110'
                  : '',
              ].join(' ')}
              style={{
                backgroundColor: i < (pomodoro.sessions % 4) ? phaseColor : '#D5D5F0',
              }}
            />
          ))}
          <span className="text-xs text-text-muted ml-1 font-medium">
            {pomodoro.sessions} sessions
          </span>
        </div>
      </div>
    </Card>
  )
}
