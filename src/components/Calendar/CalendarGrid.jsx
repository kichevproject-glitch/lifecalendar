import { useState, useRef, useEffect, useCallback } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  format, addMonths, subMonths, differenceInCalendarDays,
  startOfDay,
} from 'date-fns'
import EventModal from './EventModal'
import TaskModal from '../Tasks/TaskModal'
import { useEvents } from '../../hooks/useEvents'
import { useHolidays } from '../../hooks/useHolidays'
import { useTasks } from '../../hooks/useTasks'

const WEEKDAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const BAR_H     = 20   // px height of a multi-day bar
const BAR_GAP   = 2    // px gap between stacked bars
const DAY_NUM_H = 32   // px reserved at top of cell for day number + margin

export default function CalendarGrid({ categories, sharedEvents = [] }) {
  const [current,        setCurrent]        = useState(new Date())
  const [selected,       setSelected]       = useState(null)
  const [editEvent,      setEditEvent]      = useState(null)
  const [showModal,      setShowModal]      = useState(false)
  const [editTask,       setEditTask]       = useState(null)
  const [showTaskModal,  setShowTaskModal]  = useState(false)
  const [cellSize,       setCellSize]       = useState({ w: 0, h: 0 })

  const gridRef = useRef(null)

  const year  = current.getFullYear()
  const month = current.getMonth()

  const { events, createEvent, updateEvent, deleteEvent } = useEvents(year, month)
  const { holidays }                                       = useHolidays(year)
  const { tasks, createTask, updateTask, deleteTask }      = useTasks()

  // ── Build grid ──────────────────────────────────────────────────
  const monthStart = startOfMonth(current)
  const monthEnd   = endOfMonth(current)
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd    = endOfWeek(monthEnd,     { weekStartsOn: 1 })
  const days       = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const rows = []
  for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7))

  // ── Measure cells on mount + resize ────────────────────────────
  const measureCells = useCallback(() => {
    if (!gridRef.current) return
    const first = gridRef.current.querySelector('.cal-cell')
    if (!first) return
    const r = first.getBoundingClientRect()
    setCellSize(prev => {
      if (Math.abs(prev.w - r.width) < 1 && Math.abs(prev.h - r.height) < 1) return prev
      return { w: r.width, h: r.height }
    })
  }, [])

  useEffect(() => {
    measureCells()
    const ro = new ResizeObserver(measureCells)
    if (gridRef.current) ro.observe(gridRef.current)
    return () => ro.disconnect()
  }, [measureCells, days.length])

  // ── Classify events ─────────────────────────────────────────────
  function isMultiDay(ev) {
    if (!ev.end_at) return false
    const s = startOfDay(new Date(ev.start_at))
    const e = startOfDay(new Date(ev.end_at))
    return differenceInCalendarDays(e, s) >= 1
  }

  const multiDayEvents  = events.filter(isMultiDay)
  const singleDayEvents = events.filter(ev => !isMultiDay(ev))

  // ── Per-day helpers ─────────────────────────────────────────────
  function getSingleEventsForDay(day) {
    return singleDayEvents
      .filter(e => isSameDay(new Date(e.start_at), day))
      .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
  }

  function getSharedEventsForDay(day) {
    return sharedEvents.filter(e => {
      const s = startOfDay(new Date(e.start_at))
      const en = e.end_at ? startOfDay(new Date(e.end_at)) : s
      const d  = startOfDay(day)
      return s <= d && en >= d
    })
  }

  function getTasksForDay(day) {
    return tasks.filter(t =>
      t.due_date === format(day, 'yyyy-MM-dd') && t.status !== 'done'
    )
  }

  function getHolidayForDay(day) {
    return holidays.find(h => h.date === format(day, 'yyyy-MM-dd'))
  }

  // ── Multi-day bar layout ─────────────────────────────────────────
  // For each event, compute one segment per week row it spans
  function getBarSegments(ev) {
    const evStart = startOfDay(new Date(ev.start_at))
    const evEnd   = startOfDay(new Date(ev.end_at))
    const segs = []
    rows.forEach((row, rowIdx) => {
      const rowS = startOfDay(row[0])
      const rowE = startOfDay(row[6])
      if (evEnd < rowS || evStart > rowE) return
      const segStart = evStart < rowS ? rowS : evStart
      const segEnd   = evEnd   > rowE ? rowE : evEnd
      const startCol = row.findIndex(d => isSameDay(d, segStart))
      const endCol   = row.findIndex(d => isSameDay(d, segEnd))
      segs.push({
        rowIdx,
        startCol: startCol === -1 ? 0 : startCol,
        endCol:   endCol   === -1 ? 6 : endCol,
        isStart:  isSameDay(segStart, evStart),
        isEnd:    isSameDay(segEnd,   evEnd),
      })
    })
    return segs
  }

  // Assign vertical slots so bars don't overlap in the same cell
  const slotMap = {}
  function assignSlot(rowIdx, startCol, endCol) {
    let slot = 0
    for (let c = startCol; c <= endCol; c++) {
      const k = `${rowIdx}-${c}`
      slot = Math.max(slot, slotMap[k] || 0)
    }
    for (let c = startCol; c <= endCol; c++) {
      slotMap[`${rowIdx}-${c}`] = slot + 1
    }
    return slot
  }

  // Pre-compute all bar render data
  const barData = multiDayEvents.flatMap(ev =>
    getBarSegments(ev).map((seg, si) => ({
      ev, seg, slot: assignSlot(seg.rowIdx, seg.startCol, seg.endCol),
      key: `${ev.id}-${si}`,
    }))
  )

  // ── Event handlers ───────────────────────────────────────────────
  function handleDayClick(day) {
    setSelected(day); setEditEvent(null); setShowModal(true)
  }
  function handleEventClick(e, ev) {
    e.stopPropagation(); setEditEvent(ev); setSelected(null); setShowModal(true)
  }
  function handleTaskClick(e, task) {
    e.stopPropagation(); setEditTask(task); setShowTaskModal(true)
  }
  async function handleSave(payload) {
    if (editEvent) return updateEvent(editEvent.id, payload)
    return createEvent(payload)
  }
  async function handleSaveTask(payload) {
    if (editTask) return updateTask(editTask.id, payload)
    return createTask(payload)
  }

  const { w: CW, h: CH } = cellSize

  return (
    <div style={wrapper}>

      {/* Header */}
      <div style={calHeader}>
        <button onClick={() => setCurrent(subMonths(current, 1))} style={navBtn}>‹</button>
        <h2 style={monthTitle}>
          <span style={{ fontFamily: 'var(--font-display)' }}>{format(current, 'MMMM')}</span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 20 }}>
            {' '}{format(current, 'yyyy')}
          </span>
        </h2>
        <button onClick={() => setCurrent(addMonths(current, 1))} style={navBtn}>›</button>
        <button onClick={() => setCurrent(new Date())} style={todayBtn}>Today</button>
      </div>

      {/* Weekday labels */}
      <div style={weekRow}>
        {WEEKDAYS.map(d => <div key={d} style={weekLabel}>{d}</div>)}
      </div>

      {/* Grid + overlay */}
      <div style={{ flex: 1, position: 'relative', overflow: 'auto' }}>

        {/* Day cells */}
        <div ref={gridRef} style={grid}>
          {days.map((day, i) => {
            const singleEvts = getSingleEventsForDay(day)
            const sharedEvts = getSharedEventsForDay(day)
            const dayTasks   = getTasksForDay(day)
            const holiday    = getHolidayForDay(day)
            const inMonth    = isSameMonth(day, current)
            const today      = isToday(day)
            const isWeekend  = day.getDay() === 0 || day.getDay() === 6
            const rowIdx     = Math.floor(i / 7)
            const col        = i % 7
            const usedSlots  = slotMap[`${rowIdx}-${col}`] || 0

            return (
              <div
                key={day.toISOString()}
                className="cal-cell"
                onClick={() => handleDayClick(day)}
                style={{
                  ...cell,
                  opacity:     inMonth ? 1 : 0.3,
                  background:  today ? 'rgba(124,111,255,0.08)' : 'transparent',
                  borderColor: today ? 'var(--accent)' : 'var(--border)',
                }}
              >
                {/* Day number */}
                <div style={{
                  ...dayNum,
                  background: today ? 'var(--accent)' : 'transparent',
                  color: today ? '#fff' : isWeekend ? 'var(--danger)' : 'var(--text-secondary)',
                }}>
                  {format(day, 'd')}
                </div>

                {/* Holiday */}
                {holiday && inMonth && (
                  <div style={holidayBadge} title={holiday.name_bg}>
                    🇧🇬 {holiday.name_bg}
                  </div>
                )}

                {/* Push chips below multi-day bars */}
                {usedSlots > 0 && (
                  <div style={{ height: usedSlots * (BAR_H + BAR_GAP) }} />
                )}

                {/* Single-day events + shared events + tasks */}
                <div style={chipList}>
                  {singleEvts.slice(0, 2).map(ev => (
                    <div key={ev.id} onClick={e => handleEventClick(e, ev)} style={{
                      ...eventChip,
                      background:  (ev.categories?.color || '#6b7280') + '25',
                      borderLeft: `3px solid ${ev.categories?.color || '#6b7280'}`,
                    }}>
                      <span style={{ marginRight: 3 }}>{ev.categories?.icon || '📌'}</span>
                      {ev.title}
                    </div>
                  ))}

                  {sharedEvts.slice(0, 1).map(ev => (
                    <div key={'s-' + ev.id} style={{
                      ...eventChip,
                      background: (ev.categories?.color || '#6b7280') + '18',
                      borderLeft: `3px solid ${ev.categories?.color || '#6b7280'}`,
                      opacity: 0.85,
                    }}>
                      <span style={{ marginRight: 3 }}>👥</span>
                      {ev.title}
                    </div>
                  ))}

                  {dayTasks.slice(0, 2).map(task => {
                    const pc = { low: '#34d399', medium: '#fbbf24', high: '#f87171' }[task.priority] || 'var(--text-muted)'
                    return (
                      <div key={task.id} onClick={e => handleTaskClick(e, task)} style={{ ...taskChip, border: `1px dashed ${pc}70` }}>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</span>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: pc, flexShrink: 0 }} />
                      </div>
                    )
                  })}

                  {(singleEvts.length + sharedEvts.length + dayTasks.length) > 4 && (
                    <div style={moreChip}>+{singleEvts.length + sharedEvts.length + dayTasks.length - 4} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Multi-day bar overlay */}
        {CW > 0 && CH > 0 && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {barData.map(({ ev, seg, slot, key }) => {
              const top    = seg.rowIdx * CH + DAY_NUM_H + slot * (BAR_H + BAR_GAP)
              const left   = seg.startCol * CW + (seg.isStart ? 3 : 0)
              const width  = (seg.endCol - seg.startCol + 1) * CW
                             - (seg.isStart ? 3 : 0)
                             - (seg.isEnd   ? 3 : 0)
              const color  = ev.categories?.color || '#6b7280'
              const radius = seg.isStart && seg.isEnd ? 4
                           : seg.isStart ? '4px 0 0 4px'
                           : seg.isEnd   ? '0 4px 4px 0'
                           : 0
              return (
                <div
                  key={key}
                  onClick={e => { e.stopPropagation(); handleEventClick(e, ev) }}
                  style={{
                    position: 'absolute', top, left, width, height: BAR_H,
                    background: color, borderRadius: radius,
                    display: 'flex', alignItems: 'center',
                    paddingLeft: seg.isStart ? 6 : 3,
                    overflow: 'hidden', boxSizing: 'border-box',
                    pointerEvents: 'auto', cursor: 'pointer', zIndex: 10,
                  }}
                >
                  {seg.isStart && (
                    <>
                      <span style={{ fontSize: 11, marginRight: 4, flexShrink: 0 }}>
                        {ev.categories?.icon || '📌'}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ev.title}
                      </span>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <EventModal date={selected} event={editEvent} categories={categories}
          onSave={handleSave} onDelete={deleteEvent} onClose={() => setShowModal(false)} />
      )}
      {showTaskModal && (
        <TaskModal task={editTask} date={selected} categories={categories}
          onSave={handleSaveTask} onDelete={deleteTask}
          onClose={() => { setShowTaskModal(false); setEditTask(null) }} />
      )}
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────────
const wrapper    = { display: 'flex', flexDirection: 'column', height: '100%' }
const calHeader  = { display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }
const monthTitle = { flex: 1, fontSize: 26, fontWeight: 700, margin: 0 }
const navBtn     = { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 8, width: 36, height: 36, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }
const todayBtn   = { background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600 }
const weekRow    = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }
const weekLabel  = { padding: '8px 0', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }
const grid       = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }
const cell       = { border: '1px solid var(--border)', borderTop: 'none', borderLeft: 'none', padding: '8px', minHeight: 110, cursor: 'pointer', transition: 'background 0.15s', overflow: 'hidden' }
const dayNum     = { width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, marginBottom: 4 }
const holidayBadge = { fontSize: 10, color: 'var(--warning)', background: 'rgba(255,199,87,0.15)', borderRadius: 4, padding: '2px 5px', marginBottom: 3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }
const chipList   = { display: 'flex', flexDirection: 'column', gap: 2 }
const eventChip  = { fontSize: 11, padding: '2px 6px', borderRadius: 4, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: 'var(--text-primary)', cursor: 'pointer', transition: 'opacity 0.15s' }
const taskChip   = { fontSize: 11, padding: '2px 6px', borderRadius: 4, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: 'var(--text-primary)', cursor: 'pointer', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', gap: 4, transition: 'opacity 0.15s' }
const moreChip   = { fontSize: 10, color: 'var(--text-muted)', padding: '1px 4px' }
