import { useState } from 'react'
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
        <div className="desktop-header-logo">Dayflow</div>
        
        <div className="desktop-header-controls">
          <div className="view-switcher-redesign">
            <button 
              className={activeView === 'calendar' ? 'active' : ''}
              onClick={() => setActiveView('calendar')}
            >
              Day
            </button>
            <button 
              className={activeView === 'calendar' ? 'active' : ''}
              onClick={() => setActiveView('calendar')}
            >
              Week
            </button>
            <button 
              className={activeView === 'calendar' ? 'active' : ''}
              onClick={() => setActiveView('calendar')}
            >
              Month
            </button>
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
