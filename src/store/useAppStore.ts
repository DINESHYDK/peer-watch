import { create } from 'zustand'

interface PomodoroState {
  phase: 'work' | 'shortBreak' | 'longBreak'
  timeLeft: number   // seconds
  running: boolean
  sessions: number   // completed work intervals
}

interface TribunalTarget {
  userId: string
  date: string
}

interface AppStore {
  // ── Active group context ──────────────────────────────
  activeGroupId: string | null
  setActiveGroupId: (id: string | null) => void

  // ── Tribunal modal ────────────────────────────────────
  tribunalTarget: TribunalTarget | null
  openTribunal: (userId: string, date: string) => void
  closeTribunal: () => void

  // ── Pomodoro timer ────────────────────────────────────
  pomodoro: PomodoroState
  startPomodoro: () => void
  pausePomodoro: () => void
  resetPomodoro: () => void
  tickPomodoro: () => void
  setPhase: (phase: PomodoroState['phase']) => void
}

const PHASE_DURATIONS: Record<PomodoroState['phase'], number> = {
  work:       25 * 60,
  shortBreak:  5 * 60,
  longBreak:  15 * 60,
}

export const useAppStore = create<AppStore>((set) => ({
  // ── Active group ──────────────────────────────────────
  activeGroupId: null,
  setActiveGroupId: (id) => set({ activeGroupId: id }),

  // ── Tribunal modal ────────────────────────────────────
  tribunalTarget: null,
  openTribunal: (userId, date) => set({ tribunalTarget: { userId, date } }),
  closeTribunal: () => set({ tribunalTarget: null }),

  // ── Pomodoro state ────────────────────────────────────
  pomodoro: {
    phase: 'work',
    timeLeft: PHASE_DURATIONS.work,
    running: false,
    sessions: 0,
  },

  startPomodoro: () =>
    set((s) => ({ pomodoro: { ...s.pomodoro, running: true } })),

  pausePomodoro: () =>
    set((s) => ({ pomodoro: { ...s.pomodoro, running: false } })),

  resetPomodoro: () =>
    set((s) => ({
      pomodoro: {
        ...s.pomodoro,
        running: false,
        timeLeft: PHASE_DURATIONS[s.pomodoro.phase],
      },
    })),

  tickPomodoro: () =>
    set((s) => {
      const { pomodoro } = s
      if (!pomodoro.running) return s

      if (pomodoro.timeLeft > 1) {
        return { pomodoro: { ...pomodoro, timeLeft: pomodoro.timeLeft - 1 } }
      }

      // Phase transition on timer expiry
      const newSessions =
        pomodoro.phase === 'work' ? pomodoro.sessions + 1 : pomodoro.sessions
      const nextPhase: PomodoroState['phase'] =
        pomodoro.phase === 'work'
          ? newSessions % 4 === 0
            ? 'longBreak'
            : 'shortBreak'
          : 'work'

      return {
        pomodoro: {
          phase: nextPhase,
          timeLeft: PHASE_DURATIONS[nextPhase],
          running: false,
          sessions: newSessions,
        },
      }
    }),

  setPhase: (phase) =>
    set({
      pomodoro: {
        phase,
        timeLeft: PHASE_DURATIONS[phase],
        running: false,
        sessions: 0,
      },
    }),
}))
