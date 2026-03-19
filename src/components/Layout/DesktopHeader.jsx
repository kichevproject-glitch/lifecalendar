import { useState } from 'react'
import DayflowLogo from './DayflowLogo'
import EventModal from '../Calendar/EventModal'
import TaskModal from '../Tasks/TaskModal'

export default function DesktopHeader({ activeView, setActiveView }) {
  const [showEventModal, setShowEventModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)

  const handleAddClick = () => {
    if (activeView === 'tasks') {
      setShowTaskModal(true)
    } else {
      setShowEventModal(true)
    }
  }

  return (
    <>
      <header className="desktop-header-redesign">
        <div className="header-left">
          {/* Logo */}
          <div className="logo-container">
            <DayflowLogo size={32} />
            <div className="logo-text">Dayflow</div>
          </div>
        </div>

        <div className="header-right">
          {/* View Switcher - Month only */}
          <div className="view-switcher-redesign">
            <button className="active">Month</button>
          </div>
          
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
