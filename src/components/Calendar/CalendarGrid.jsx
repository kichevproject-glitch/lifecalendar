import { useState, useRef, useEffect, useCallback } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  format, addMonths, subMonths, differenceInCalendarDays, startOfDay,
} from 'date-fns'
import EventModal from './EventModal'
import TaskModal from '../Tasks/TaskModal'
import { useEvents } from '../../hooks/useEvents'
import { useHolidays } from '../../hooks/useHolidays'
import { useTasks } from '../../hooks/useTasks'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const BAR_H = 20
const BAR_GAP = 2
const DAY_NUM_H = 32

export default function CalendarGrid({ categories, sharedEvents = [], isMobile = false }) {
  const [current, setCurrent] = useState(new Date())
  const [selected, setSelected] = useState(new Date()) // used for both desktop click + mobile agenda
  const [editEvent, setEditEvent] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [cellSize, setCellSize] = useState({ w: 0, h: 0 })
  const gridRef = useRef(null)

  const year = current.getFullYear()
  const month = current.getMonth()
  const { events, createEvent, updateEvent, deleteEvent } = useEvents(year, month)
  const { holidays } = useHolidays(year)
  const { tasks, createTask, updateTask, deleteTask } = useTasks()

  // ── Build grid ──────────────────────────────────────────────────
  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const rows = []
  for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7))

  // ── Measure cells on mount + resize (desktop only) ─────────────
  const measureCells = useCallback(() => {
    if (isMobile || !gridRef.current) return
    const first = gridRef.current.querySelector('.cal-cell')
    if (!first) return
    const r = first.getBoundingClientRect()
    setCellSize(prev => {
      if (Math.abs(prev.w - r.width) < 1 && Math.abs(prev.h - r.height) < 1) return prev
      return { w: r.width, h: r.height }
    })
  }, [isMobile])

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

  const multiDayEvents = events.filter(isMultiDay)
  const singleDayEvents = events.filter(ev => !isMultiDay(ev))

  // Shared events: classify the same way
  const sharedMultiDay = sharedEvents.filter(isMultiDay)
  const sharedSingleDay = sharedEvents.filter(ev => !isMultiDay(ev))

  // ── Per-day helpers ─────────────────────────────────────────────
  function getSingleEventsForDay(day) {
    return singleDayEvents
      .filter(e => isSameDay(new Date(e.start_at), day))
      .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
  }

  function getMultiDayEventsForDay(day) {
    const d = startOfDay(day)
    return multiDayEvents.filter(ev => {
      const s = startOfDay(new Date(ev.start_at))
      const e = startOfDay(new Date(ev.end_at))
      return s <= d && e >= d
    })
  }

  function getSharedEventsForDay(day) {
    return sharedSingleDay.filter(e => isSameDay(new Date(e.start_at), day))
  }

  function getSharedMultiDayForDay(day) {
    const d = startOfDay(day)
    return sharedMultiDay.filter(ev => {
      const s = startOfDay(new Date(ev.start_at))
      const e = startOfDay(new Date(ev.end_at))
      return s <= d && e >= d
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

  // Get colored dots for a day (for mobile mini calendar)
  function getDotsForDay(day) {
    const evts = getSingleEventsForDay(day)
    const multi = getMultiDayEventsForDay(day)
    const shared = getSharedEventsForDay(day)
    const sharedMulti = getSharedMultiDayForDay(day)
    const dayTasks = getTasksForDay(day)
    const dots = []
    const seen = new Set()
    ;[...evts, ...multi].forEach(ev => {
      const c = ev.categories?.color || '#6b7280'
      if (!seen.has(c)) { seen.add(c); dots.push(c) }
    })
    ;[...shared, ...sharedMulti].forEach(() => { if (!seen.has('#F59E0B')) { seen.add('#F59E0B'); dots.push('#F59E0B') } })
    dayTasks.forEach(t => {
      const c = { low: '#34d399', medium: '#fbbf24', high: '#f87171' }[t.priority] || '#888'
      if (!seen.has(c)) { seen.add(c); dots.push(c) }
    })
    return dots.slice(0, 3) // max 3 dots
  }

  // ── Multi-day bar layout (desktop only) ──────────────────────────
  function getBarSegments(ev) {
    const evStart = startOfDay(new Date(ev.start_at))
    const evEnd = startOfDay(new Date(ev.end_at))
    const segs = []
    rows.forEach((row, rowIdx) => {
      const rowS = startOfDay(row[0])
      const rowE = startOfDay(row[6])
      if (evEnd < rowS || evStart > rowE) return
      const segStart = evStart < rowS ? rowS : evStart
      const segEnd = evEnd > rowE ? rowE : evEnd
      const startCol = row.findIndex(d => isSameDay(d, segStart))
      const endCol = row.findIndex(d => isSameDay(d, segEnd))
      segs.push({ rowIdx, startCol: startCol === -1 ? 0 : startCol, endCol: endCol === -1 ? 6 : endCol, isStart: isSameDay(segStart, evStart), isEnd: isSameDay(segEnd, evEnd) })
    })
    return segs
  }

  const slotMap = {}
  function assignSlot(rowIdx, startCol, endCol) {
    let slot = 0
    for (let c = startCol; c <= endCol; c++) { const k = `${rowIdx}-${c}`; slot = Math.max(slot, slotMap[k] || 0) }
    for (let c = startCol; c <= endCol; c++) { slotMap[`${rowIdx}-${c}`] = slot + 1 }
    return slot
  }

  const barData = [
    ...multiDayEvents.map(ev => ({ ev, isShared: false })),
    ...sharedMultiDay.map(ev => ({ ev, isShared: true })),
  ].flatMap(({ ev, isShared }) =>
    getBarSegments(ev).map((seg, si) => ({ ev, isShared, seg, slot: assignSlot(seg.rowIdx, seg.startCol, seg.endCol), key: `${isShared ? 's-' : ''}${ev.id}-${si}` }))
  )

  // ── Event handlers ─────────────────────────────────────────────
  function handleDayClick(day) { setSelected(day); if (!isMobile) { setEditEvent(null); setShowModal(true) } }
  function handleEventClick(e, ev) { e.stopPropagation(); setEditEvent(ev); setSelected(null); setShowModal(true) }
  function handleTaskClick(e, task) { e.stopPropagation(); setEditTask(task); setShowTaskModal(true) }
  async function handleSave(payload) { if (editEvent) return updateEvent(editEvent.id, payload); return createEvent(payload) }
  async function handleSaveTask(payload) { if (editTask) return updateTask(editTask.id, payload); return createTask(payload) }

  function handleFabClick() { setEditEvent(null); setShowModal(true) }

  const { w: CW, h: CH } = cellSize

  // ═══════════════════════════════════════════════════════════════
  // MOBILE VIEW
  // ═══════════════════════════════════════════════════════════════
  if (isMobile) {
    const agendaSingle = getSingleEventsForDay(selected)
    const agendaMulti = getMultiDayEventsForDay(selected)
    const agendaShared = getSharedEventsForDay(selected)
    const agendaTasks = getTasksForDay(selected)
    const holiday = getHolidayForDay(selected)
    const allAgenda = [...agendaMulti, ...agendaSingle].sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
    const hasContent = allAgenda.length + agendaShared.length + agendaTasks.length > 0

    return (
      <div style={mWrapper}>
        {/* Header */}
        <div style={mHeader}>
          <div>
            <span style={mMonth}>{format(current, 'MMMM')}</span>
            <span style={mYear}> {format(current, 'yyyy')}</span>
          </div>
          <div style={mNav}>
            <button onClick={() => setCurrent(subMonths(current, 1))} style={mNavBtn}>‹</button>
            <button onClick={() => setCurrent(addMonths(current, 1))} style={mNavBtn}>›</button>
            <button onClick={() => { setCurrent(new Date()); setSelected(new Date()) }} style={mTodayBtn}>Today</button>
          </div>
        </div>

        {/* Mini calendar */}
        <div style={miniCal}>
          <div style={miniWeekRow}>
            {WEEKDAYS.map(d => <div key={d} style={miniWday}>{d}</div>)}
          </div>
          {rows.map((row, ri) => (
            <div key={ri} style={miniWeekRow}>
              {row.map(day => {
                const inMonth = isSameMonth(day, current)
                const today = isToday(day)
                const sel = isSameDay(day, selected) && !today
                const dots = inMonth ? getDotsForDay(day) : []
                return (
                  <div key={day.toISOString()} style={miniDayCell} onClick={() => handleDayClick(day)}>
                    <div style={{
                      ...miniNum,
                      color: !inMonth ? '#333345' : today ? '#fff' : sel ? 'var(--text-primary)' : 'var(--text-secondary)',
                      background: today ? 'var(--accent)' : 'transparent',
                      border: sel ? '2px solid var(--accent)' : '2px solid transparent',
                      fontWeight: today || sel ? 700 : 500,
                    }}>
                      {format(day, 'd')}
                    </div>
                    {dots.length > 0 && (
                      <div style={miniDots}>
                        {dots.map((c, i) => <div key={i} style={{ ...miniDot, background: c }} />)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: '0 16px' }} />

        {/* Agenda header */}
        <div style={agendaHeader}>
          <span style={agendaDayName}>{format(selected, 'EEEE')}</span>
          <span style={agendaDate}>{format(selected, 'MMMM d, yyyy')}</span>
        </div>

        {/* Agenda list */}
        <div style={agendaList}>
          {holiday && (
            <div style={agendaHoliday}>
              <span>🇧🇬</span>
              <span style={{ flex: 1 }}>{holiday.name_bg || holiday.name}</span>
            </div>
          )}

          {allAgenda.map(ev => {
            const color = ev.categories?.color || '#6b7280'
            const multi = isMultiDay(ev)
            return (
              <div key={ev.id} onClick={e => handleEventClick(e, ev)} style={agendaItem}>
                <div style={{ ...agendaColorBar, background: color }} />
                <div style={{ flex: 1 }}>
                  <div style={agendaTitle}>{ev.title}</div>
                  <div style={agendaTime}>
                    {multi ? `${format(new Date(ev.start_at), 'MMM d')} – ${format(new Date(ev.end_at), 'MMM d')}` : ev.all_day ? 'All day' : format(new Date(ev.start_at), 'h:mm a')}
                  </div>
                </div>
                <span style={{ fontSize: 15 }}>{ev.categories?.icon || '📌'}</span>
              </div>
            )
          })}

          {agendaShared.map(ev => {
            const color = ev.categories?.color || '#F59E0B'
            return (
              <div key={'s-' + ev.id} style={{ ...agendaItem, opacity: 0.85 }}>
                <div style={{ ...agendaColorBar, background: color }} />
                <div style={{ flex: 1 }}>
                  <div style={{ ...agendaTitle, color: '#F59E0B' }}>👥 {ev.title}</div>
                  <div style={agendaTime}>{format(new Date(ev.start_at), 'h:mm a')}</div>
                </div>
              </div>
            )
          })}

          {agendaTasks.map(task => {
            const pc = { low: '#34d399', medium: '#fbbf24', high: '#f87171' }[task.priority] || 'var(--text-muted)'
            return (
              <div key={task.id} onClick={e => handleTaskClick(e, task)} style={agendaTaskItem}>
                <div style={{ ...agendaTaskDot, background: pc }} />
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{task.title}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{task.priority}</span>
              </div>
            )
          })}

          {!hasContent && !holiday && (
            <div style={agendaEmpty}>No events or tasks for this day</div>
          )}
        </div>

        {/* FAB */}
        <div onClick={handleFabClick} style={fab}>
          <span style={{ color: '#fff', fontSize: 26, fontWeight: 300, lineHeight: 1 }}>+</span>
        </div>

        {/* Modals */}
        {showModal && (
          <EventModal date={selected} event={editEvent} categories={categories} onSave={handleSave} onDelete={deleteEvent} onClose={() => setShowModal(false)} />
        )}
        {showTaskModal && (
          <TaskModal task={editTask} date={selected} categories={categories} onSave={handleSaveTask} onDelete={deleteTask} onClose={() => { setShowTaskModal(false); setEditTask(null) }} />
        )}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // DESKTOP VIEW (unchanged)
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={wrapper}>
      {/* Header */}
      <div style={calHeader}>
        <button onClick={() => setCurrent(subMonths(current, 1))} style={navBtn}>‹</button>
        <h2 style={monthTitle}>
          <span style={{ fontFamily: 'var(--font-display)' }}>{format(current, 'MMMM')}</span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 20 }}> {format(current, 'yyyy')}</span>
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
        <div ref={gridRef} style={grid}>
          {days.map((day, i) => {
            const singleEvts = getSingleEventsForDay(day)
            const sharedEvts = getSharedEventsForDay(day)
            const dayTasks = getTasksForDay(day)
            const holiday = getHolidayForDay(day)
            const inMonth = isSameMonth(day, current)
            const today = isToday(day)
            const isWeekend = day.getDay() === 0 || day.getDay() === 6
            const rowIdx = Math.floor(i / 7)
            const col = i % 7
            const usedSlots = slotMap[`${rowIdx}-${col}`] || 0

            return (
              <div key={day.toISOString()} className="cal-cell" onClick={() => handleDayClick(day)} style={{
                ...cell, opacity: inMonth ? 1 : 0.3,
                background: today ? 'rgba(124,111,255,0.08)' : 'transparent',
                borderColor: today ? 'var(--accent)' : 'var(--border)',
              }}>
                <div style={{ ...dayNum, background: today ? 'var(--accent)' : 'transparent', color: today ? '#fff' : isWeekend ? 'var(--danger)' : 'var(--text-secondary)' }}>
                  {format(day, 'd')}
                </div>
                {holiday && inMonth && <div style={holidayBadge} title={holiday.name_bg}>🇧🇬 {holiday.name_bg}</div>}
                {usedSlots > 0 && <div style={{ height: usedSlots * (BAR_H + BAR_GAP) }} />}
                <div style={chipList}>
                  {singleEvts.slice(0, 2).map(ev => (
                    <div key={ev.id} onClick={e => handleEventClick(e, ev)} style={{ ...eventChip, background: (ev.categories?.color || '#6b7280') + '25', borderLeft: `3px solid ${ev.categories?.color || '#6b7280'}` }}>
                      <span style={{ marginRight: 3 }}>{ev.categories?.icon || '📌'}</span>{ev.title}
                    </div>
                  ))}
                  {sharedEvts.slice(0, 1).map(ev => (
                    <div key={'s-' + ev.id} style={{ ...eventChip, background: (ev.categories?.color || '#6b7280') + '18', borderLeft: `3px solid ${ev.categories?.color || '#6b7280'}`, opacity: 0.85 }}>
                      <span style={{ marginRight: 3 }}>👥</span>{ev.title}
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
            {barData.map(({ ev, isShared, seg, slot, key }) => {
              const top = seg.rowIdx * CH + DAY_NUM_H + slot * (BAR_H + BAR_GAP)
              const left = seg.startCol * CW + (seg.isStart ? 3 : 0)
              const width = (seg.endCol - seg.startCol + 1) * CW - (seg.isStart ? 3 : 0) - (seg.isEnd ? 3 : 0)
              const color = ev.categories?.color || '#6b7280'
              const radius = seg.isStart && seg.isEnd ? 4 : seg.isStart ? '4px 0 0 4px' : seg.isEnd ? '0 4px 4px 0' : 0
              return (
                <div key={key} onClick={e => { e.stopPropagation(); if (!isShared) handleEventClick(e, ev) }} style={{
                  position: 'absolute', top, left, width, height: BAR_H, background: isShared ? color + 'CC' : color, borderRadius: radius,
                  display: 'flex', alignItems: 'center', paddingLeft: seg.isStart ? 6 : 3, overflow: 'hidden',
                  boxSizing: 'border-box', pointerEvents: 'auto', cursor: isShared ? 'default' : 'pointer', zIndex: 10,
                  opacity: isShared ? 0.85 : 1,
                }}>
                  {seg.isStart && (
                    <>
                      <span style={{ fontSize: 11, marginRight: 4, flexShrink: 0 }}>{isShared ? '👥' : (ev.categories?.icon || '📌')}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</span>
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
        <EventModal date={selected} event={editEvent} categories={categories} onSave={handleSave} onDelete={deleteEvent} onClose={() => setShowModal(false)} />
      )}
      {showTaskModal && (
        <TaskModal task={editTask} date={selected} categories={categories} onSave={handleSaveTask} onDelete={deleteTask} onClose={() => { setShowTaskModal(false); setEditTask(null) }} />
      )}
    </div>
  )
}

// ── Desktop styles (unchanged) ─────────────────────────────────────
const wrapper = { display: 'flex', flexDirection: 'column', height: '100%' }
const calHeader = { display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }
const monthTitle = { flex: 1, fontSize: 26, fontWeight: 700, margin: 0 }
const navBtn = { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 8, width: 36, height: 36, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }
const todayBtn = { background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600 }
const weekRow = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }
const weekLabel = { padding: '8px 0', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }
const grid = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }
const cell = { border: '1px solid var(--border)', borderTop: 'none', borderLeft: 'none', padding: '8px', minHeight: 110, cursor: 'pointer', transition: 'background 0.15s', overflow: 'hidden' }
const dayNum = { width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, marginBottom: 4 }
const holidayBadge = { fontSize: 10, color: 'var(--warning)', background: 'rgba(255,199,87,0.15)', borderRadius: 4, padding: '2px 5px', marginBottom: 3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }
const chipList = { display: 'flex', flexDirection: 'column', gap: 2 }
const eventChip = { fontSize: 11, padding: '2px 6px', borderRadius: 4, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: 'var(--text-primary)', cursor: 'pointer', transition: 'opacity 0.15s' }
const taskChip = { fontSize: 11, padding: '2px 6px', borderRadius: 4, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: 'var(--text-primary)', cursor: 'pointer', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', gap: 4, transition: 'opacity 0.15s' }
const moreChip = { fontSize: 10, color: 'var(--text-muted)', padding: '1px 4px' }

// ── Mobile styles ──────────────────────────────────────────────────
const mWrapper = { display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }
const mHeader = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 8px' }
const mMonth = { fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }
const mYear = { fontSize: 18, fontWeight: 400, color: 'var(--text-muted)' }
const mNav = { display: 'flex', gap: 6, alignItems: 'center' }
const mNavBtn = { width: 32, height: 32, borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }
const mTodayBtn = { background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }
const miniCal = { padding: '4px 12px 8px' }
const miniWeekRow = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center' }
const miniWday = { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 0', letterSpacing: '0.04em' }
const miniDayCell = { padding: '4px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer' }
const miniNum = { fontSize: 13, fontWeight: 500, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', boxSizing: 'border-box' }
const miniDots = { display: 'flex', gap: 2, height: 4 }
const miniDot = { width: 4, height: 4, borderRadius: '50%' }
const agendaHeader = { padding: '10px 16px 4px', display: 'flex', alignItems: 'baseline', gap: 8 }
const agendaDayName = { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }
const agendaDate = { fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }
const agendaList = { flex: 1, overflowY: 'auto', padding: '6px 12px 80px', display: 'flex', flexDirection: 'column', gap: 6 }
const agendaItem = { display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', cursor: 'pointer' }
const agendaColorBar = { width: 4, height: 36, borderRadius: 2, flexShrink: 0 }
const agendaTitle = { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }
const agendaTime = { fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }
const agendaTaskItem = { display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: 10, padding: '10px 14px', cursor: 'pointer' }
const agendaTaskDot = { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 }
const agendaHoliday = { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,199,87,0.1)', border: '1px solid rgba(255,199,87,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--warning)' }
const agendaEmpty = { color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '28px 0' }
const fab = { position: 'absolute', bottom: 16, right: 16, width: 48, height: 48, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,111,255,0.4)', zIndex: 50 }
