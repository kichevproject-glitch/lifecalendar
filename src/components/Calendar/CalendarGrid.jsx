import { useState } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  format, addMonths, subMonths,
} from 'date-fns'
import EventModal from './EventModal'
import { useEvents } from '../../hooks/useEvents'
import { useHolidays } from '../../hooks/useHolidays'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function CalendarGrid({ categories }) {
  const [current, setCurrent] = useState(new Date())
  const [selected, setSelected] = useState(null)      // date clicked
  const [editEvent, setEditEvent] = useState(null)    // event being edited
  const [showModal, setShowModal] = useState(false)

  const year = current.getFullYear()
  const month = current.getMonth()

  const { events, createEvent, updateEvent, deleteEvent } = useEvents(year, month)
  const { holidays } = useHolidays(year)

  // Build grid of days
  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  function getEventsForDay(day) {
    return events.filter(e => isSameDay(new Date(e.start_at), day))
  }

  function getHolidayForDay(day) {
    const ds = format(day, 'yyyy-MM-dd')
    return holidays.find(h => h.date === ds)
  }

  function handleDayClick(day) {
    setSelected(day)
    setEditEvent(null)
    setShowModal(true)
  }

  function handleEventClick(e, ev) {
    e.stopPropagation()
    setEditEvent(ev)
    setSelected(null)
    setShowModal(true)
  }

  async function handleSave(payload) {
    if (editEvent) return updateEvent(editEvent.id, payload)
    return createEvent(payload)
  }

  return (
    <div style={wrapper}>
      {/* Header */}
      <div style={calHeader}>
        <button onClick={() => setCurrent(subMonths(current, 1))} style={navBtn}>‹</button>
        <h2 style={monthTitle}>
          <span style={{ fontFamily: 'var(--font-display)' }}>
            {format(current, 'MMMM')}
          </span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 20 }}>
            {' '}{format(current, 'yyyy')}
          </span>
        </h2>
        <button onClick={() => setCurrent(addMonths(current, 1))} style={navBtn}>›</button>
        <button onClick={() => setCurrent(new Date())} style={todayBtn}>Today</button>
      </div>

      {/* Weekday labels */}
      <div style={weekRow}>
        {WEEKDAYS.map(d => (
          <div key={d} style={weekLabel}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div style={grid}>
        {days.map(day => {
          const dayEvents = getEventsForDay(day)
          const holiday = getHolidayForDay(day)
          const inMonth = isSameMonth(day, current)
          const today = isToday(day)
          const isSat = day.getDay() === 6
          const isSun = day.getDay() === 0

          return (
            <div
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              style={{
                ...cell,
                opacity: inMonth ? 1 : 0.3,
                background: today ? 'rgba(124,111,255,0.08)' : 'transparent',
                borderColor: today ? 'var(--accent)' : 'var(--border)',
              }}
            >
              {/* Day number */}
              <div style={{
                ...dayNum,
                color: today ? 'var(--accent)' : (isSat || isSun) ? '#f87171' : 'var(--text-secondary)',
                background: today ? 'var(--accent)' : 'transparent',
                color: today ? '#fff' : (isSat || isSun) ? '#f87171' : 'var(--text-secondary)',
              }}>
                {format(day, 'd')}
              </div>

              {/* Holiday */}
              {holiday && inMonth && (
                <div style={holidayBadge} title={holiday.name_bg}>
                  🇧🇬 {holiday.name_bg}
                </div>
              )}

              {/* Events */}
              <div style={eventList}>
                {dayEvents.slice(0, 3).map(ev => (
                  <div
                    key={ev.id}
                    onClick={e => handleEventClick(e, ev)}
                    style={{
                      ...eventChip,
                      background: (ev.categories?.color || '#6b7280') + '25',
                      borderLeft: `3px solid ${ev.categories?.color || '#6b7280'}`,
                    }}
                  >
                    <span style={{ marginRight: 3 }}>{ev.categories?.icon || '📌'}</span>
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div style={moreChip}>+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <EventModal
          date={selected}
          event={editEvent}
          categories={categories}
          onSave={handleSave}
          onDelete={deleteEvent}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

const wrapper = { display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }

const calHeader = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '20px 24px 16px', borderBottom: '1px solid var(--border)',
}
const monthTitle = { flex: 1, fontSize: 26, fontWeight: 700, margin: 0 }
const navBtn = {
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  color: 'var(--text-secondary)', borderRadius: 8, width: 36, height: 36,
  fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.15s',
}
const todayBtn = {
  background: 'var(--accent-dim)', border: '1px solid var(--accent)',
  color: 'var(--accent)', borderRadius: 8, padding: '6px 14px',
  fontSize: 12, fontWeight: 600,
}
const weekRow = {
  display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
  borderBottom: '1px solid var(--border)',
}
const weekLabel = {
  padding: '8px 0', textAlign: 'center',
  fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
}
const grid = {
  display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
  flex: 1, overflow: 'auto',
}
const cell = {
  border: '1px solid var(--border)', borderTop: 'none',
  borderLeft: 'none', padding: '8px',
  minHeight: 110, cursor: 'pointer',
  transition: 'background 0.15s',
  overflow: 'hidden',
}
const dayNum = {
  width: 26, height: 26, borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 12, fontWeight: 600, marginBottom: 4,
}
const holidayBadge = {
  fontSize: 10, color: '#fbbf24',
  background: 'rgba(251,191,36,0.1)',
  borderRadius: 4, padding: '2px 5px',
  marginBottom: 3, overflow: 'hidden',
  whiteSpace: 'nowrap', textOverflow: 'ellipsis',
}
const eventList = { display: 'flex', flexDirection: 'column', gap: 2 }
const eventChip = {
  fontSize: 11, padding: '2px 6px', borderRadius: 4,
  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
  color: 'var(--text-primary)', cursor: 'pointer',
  transition: 'opacity 0.15s',
}
const moreChip = {
  fontSize: 10, color: 'var(--text-muted)', padding: '1px 4px',
}
