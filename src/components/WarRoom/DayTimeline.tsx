import React, { useRef, useState, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateSelectArg, EventClickArg, EventChangeArg, EventInput } from '@fullcalendar/core'
import { CalendarDays, CheckCircle2, Circle, Info } from 'lucide-react'
import { AddTaskForm } from './AddTaskForm'
import { useUpdateTaskTime, useToggleTask } from '@/hooks/useTasks'
import { useTimetable } from '@/hooks/useTimetable'
import type { TaskRow } from '@/types/database.types'
import { hardnessColor } from '@/lib/scoring'

interface DayTimelineProps {
  tasks: TaskRow[]
  userId: string
  date: string
}

interface PopoverState {
  visible: boolean
  startTime: string
  endTime: string
}

function toHHMM(date: Date): string {
  return date.toTimeString().slice(0, 5)
}

function taskToEvent(task: TaskRow): EventInput | null {
  if (!task.start_time || !task.end_time) return null
  const [sh, sm] = task.start_time.split(':').map(Number)
  const [eh, em] = task.end_time.split(':').map(Number)
  const base = new Date(task.date)
  const start = new Date(base); start.setHours(sh, sm, 0, 0)
  const end   = new Date(base); end.setHours(eh, em, 0, 0)
  return {
    id: task.id,
    title: task.title,
    start, end,
    backgroundColor: task.status ? '#059669' : hardnessColor(task.hardness_level),
    borderColor: 'transparent',
    textColor: '#fff',
    extendedProps: { status: task.status, hardness_level: task.hardness_level, user_id: task.user_id, date: task.date },
  }
}

export const DayTimeline: React.FC<DayTimelineProps> = ({ tasks, userId, date }) => {
  const calendarRef = useRef<FullCalendar>(null)
  const updateTime = useUpdateTaskTime()
  const toggleTask = useToggleTask()
  const { blocks } = useTimetable()

  const [popover, setPopover] = useState<PopoverState>({ visible: false, startTime: '09:00', endTime: '10:00' })

  // ── Mission events (user's daily tasks) ───────────────────────
  const missionEvents: EventInput[] = tasks
    .filter((t) => t.start_time && t.end_time)
    .map((t) => taskToEvent(t))
    .filter(Boolean) as EventInput[]

  // ── Timetable backgroundEvents (read-only recurring blocks) ───
  const todayDow = new Date(date).getDay()
  const backgroundEvents: EventInput[] = blocks
    .filter((b) => b.dayOfWeek === todayDow)
    .map((b) => ({
      id: `timetable-${b.id}`,
      title: b.label,
      start: `${date}T${b.startTime}:00`,
      end: `${date}T${b.endTime}:00`,
      display: 'background',
      backgroundColor: b.color,
      classNames: ['timetable-bg-event'],
    }))

  const handleSelect = useCallback((arg: DateSelectArg) => {
    setPopover({ visible: true, startTime: toHHMM(arg.start), endTime: toHHMM(arg.end) })
    calendarRef.current?.getApi().unselect()
  }, [])

  const handleEventClick = useCallback((arg: EventClickArg) => {
    if (arg.event.id.startsWith('timetable-')) return // read-only
    const task = tasks.find((t) => t.id === arg.event.id)
    if (!task) return
    toggleTask.mutate({ id: task.id, status: !task.status, userId: task.user_id, date: task.date })
  }, [tasks, toggleTask])

  const handleEventChange = useCallback((arg: EventChangeArg) => {
    if (arg.event.id.startsWith('timetable-')) { arg.revert(); return }
    const { start, end } = arg.event
    if (!start || !end) return
    updateTime.mutate({
      id: arg.event.id,
      start_time: toHHMM(start),
      end_time: toHHMM(end),
      userId: arg.event.extendedProps.user_id,
      date: arg.event.extendedProps.date,
    })
  }, [updateTime])

  return (
    <div className="bg-card rounded-card shadow-card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-bg-dark flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} strokeWidth={2} className="text-accent-violet" />
          <div>
            <h2 className="font-bold text-text-heading text-base">Day Timeline</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Drag to create · Click to toggle · Drag to reschedule
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold text-text-muted">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={11} className="text-green-500" />Done
          </span>
          <span className="flex items-center gap-1.5">
            <Circle size={11} className="text-amber-400" />Pending
          </span>
          {blocks.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Info size={11} className="text-violet-400" />Timetable
            </span>
          )}
        </div>
      </div>

      {/* Calendar */}
      <div className="p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridDay"
          initialDate={date}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'timeGridDay,timeGridWeek' }}
          height={560}
          slotMinTime="05:00:00"
          slotMaxTime="24:00:00"
          slotDuration="00:30:00"
          snapDuration="00:15:00"
          selectable selectMirror editable droppable nowIndicator
          events={[...missionEvents, ...backgroundEvents]}
          select={handleSelect}
          eventClick={handleEventClick}
          eventChange={handleEventChange}
          eventDisplay="block"
          allDaySlot={false}
          scrollTime="07:00:00"
        />
      </div>

      {/* Add Mission Popover */}
      {popover.visible && (
        <>
          <div
            className="fixed inset-0 z-40 modal-backdrop bg-black/20"
            onClick={() => setPopover((p) => ({ ...p, visible: false }))}
          />
          <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] bg-card rounded-card shadow-float-lg p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text-heading">New Mission</h3>
              <button
                onClick={() => setPopover((p) => ({ ...p, visible: false }))}
                className="text-text-muted hover:text-text-heading transition-colors p-1 rounded-full hover:bg-bg"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <AddTaskForm
              userId={userId}
              prefillStart={popover.startTime}
              prefillEnd={popover.endTime}
              prefillDate={date}
              onClose={() => setPopover((p) => ({ ...p, visible: false }))}
              compact
            />
          </div>
        </>
      )}
    </div>
  )
}
