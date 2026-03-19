import { useState } from 'react'
import { useCalendar } from '../../hooks/useCalendar'
import DayflowLogo from './DayflowLogo'
import EventModal from '../Calendar/EventModal'
import TaskModal from '../Tasks/TaskModal'

export default function DesktopHeader({ activeView, setActiveView }) {
  const { currentDate, goToPrevMonth, goToNextMonth, goToToday } = useCalendar()
  const [showEventModal, setShowEventModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)

  const handleAddClick = () => {
    if (activeView === 'tasks') {
      setShowTaskModal(true)
    } else {
      setShowEventModal(true)
    }
  }

  const monthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <>
      <header className="desktop-header-redesign">
        <div className="header-left">
          {/* Logo */}
          <div className="logo-container">
            <DayflowLogo size={32} />
            <div className="logo-text">Dayflow</div>
          </div>

          {/* Month Navigation */}
          <div className="month-nav">
            <button className="nav-arrow" onClick={goToPrevMonth} title="Previous month">
              ‹
            </button>
            <div className="month-title">{monthYear}</div>
            <button className="nav-arrow" onClick={goToNextMonth} title="Next month">
              ›
            </button>
          </div>
        </div>

        <div className="header-right">
          {/* View Switcher - Month only for Phase 1 */}
          <div className="view-switcher-redesign">
            <button className="active">Month</button>
          </div>
          
          <button className="today-btn" onClick={goToToday}>
            Today
          </button>
          
          <button className="add-btn-redesign" onClick={handleAddClick} title="Add event">
            +
          </button>
        </div>
      </header>

      {showEventModal && (
        <EventModal onClose={() => setShowEventModal(false)} />
      )}
      {showTaskModal && (
        <TaskModal onClose={() => setShowTaskModal(false)} />
      )}
    </>
  )
}
