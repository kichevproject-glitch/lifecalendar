import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import EventModal from './EventModal';
import TaskModal from './TaskModal';
import CategoryManager from './CategoryManager';
import KanbanBoard from './KanbanBoard';
import '../styles/calendar.css';

function Calendar({ session, theme, currentView, onViewChange }) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchEvents();
    fetchTasks();
  }, [currentDate]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', session.user.id)
      .order('name');

    if (!error && data) {
      setCategories(data);
    }
  };

  const fetchEvents = async () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        category:categories(id, name, color, icon),
        shared_calendars!inner(calendar_id)
      `)
      .or(`user_id.eq.${session.user.id},shared_calendars.user_id.eq.${session.user.id}`)
      .gte('date', startOfMonth.toISOString())
      .lte('date', endOfMonth.toISOString())
      .order('date');

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        category:categories(id, name, color, icon)
      `)
      .eq('user_id', session.user.id)
      .neq('status', 'done')
      .order('due_date');

    if (!error && data) {
      setTasks(data);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleViewChange = (view) => {
    if (view === 'day' || view === 'week') {
      setShowComingSoon(true);
    } else {
      onViewChange(view);
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setSelectedDate(new Date(event.date));
    setShowEventModal(true);
  };

  const handleTaskClick = (task, e) => {
    e.stopPropagation();
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleAddEvent = () => {
    setSelectedDate(new Date());
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    setShowTaskModal(true);
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - ((firstDay.getDay() + 6) % 7));

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateStr = date.toISOString().split('T')[0];
      const dayEvents = events.filter(e => e.date.startsWith(dateStr));
      const dayTasks = tasks.filter(t => t.due_date && t.due_date.startsWith(dateStr));
      
      const isToday = date.getTime() === today.getTime();
      const isOtherMonth = date.getMonth() !== month;

      days.push(
        <div
          key={i}
          className={`calendar-day ${isToday ? 'today' : ''} ${isOtherMonth ? 'other-month' : ''}`}
          onClick={() => handleDateClick(date)}
        >
          <span className="day-number">{date.getDate()}</span>
          <div className="event-chips">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="event-chip"
                style={{ background: event.category?.color || '#888' }}
                onClick={(e) => handleEventClick(event, e)}
                title={event.name}
              >
                {event.is_shared && <span className="shared-icon">ð¥</span>}
                {!event.is_shared && event.category?.icon && (
                  <span className="chip-icon">{event.category.icon}</span>
                )}
                <span className="chip-text">{event.name}</span>
                {event.time && <span className="chip-time">{event.time}</span>}
              </div>
            ))}
            {dayTasks.slice(0, 3 - dayEvents.length).map((task) => (
              <div
                key={task.id}
                className="task-chip"
                style={{ borderColor: task.category?.color || '#888' }}
                onClick={(e) => handleTaskClick(task, e)}
                title={task.name}
              >
                <span
                  className="priority-dot"
                  style={{
                    background:
                      task.priority === 'high'
                        ? '#EF4444'
                        : task.priority === 'medium'
                        ? '#F97316'
                        : '#888',
                  }}
                />
                <span className="chip-text">{task.name}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="calendar-container">
      <header className="calendar-header">
        <div className="logo-gradient">Dayflow</div>
        
        <div className="header-controls">
          <div className="view-switcher">
            <button
              className={currentView === 'day' ? 'active' : ''}
              onClick={() => handleViewChange('day')}
            >
              Day
            </button>
            <button
              className={currentView === 'week' ? 'active' : ''}
              onClick={() => handleViewChange('week')}
            >
              Week
            </button>
            <button
              className={currentView === 'month' ? 'active' : ''}
              onClick={() => handleViewChange('month')}
            >
              Month
            </button>
          </div>

          <button className="add-btn" onClick={handleAddEvent} title="Add Event">
            +
          </button>
        </div>
      </header>

      <div className="calendar-main">
        <div className="calendar-actions">
          <div className="month-navigation">
            <h2 className="month-title">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="month-nav-buttons">
              <button className="nav-arrow" onClick={handlePrevMonth}>â¹</button>
              <button className="nav-arrow" onClick={handleNextMonth}>âº</button>
            </div>
          </div>

          <div className="quick-actions">
            <button className="today-btn" onClick={handleToday}>Today</button>
            <button className="action-btn" onClick={handleAddTask}>+ Task</button>
            <button className="action-btn" onClick={() => setShowKanban(true)}>ð Kanban</button>
            <button className="action-btn" onClick={() => setShowCategoryManager(true)}>ð·ï¸ Categories</button>
            <button className="action-btn" onClick={() => navigate('/settings')}>âï¸ Settings</button>
          </div>
        </div>

        <div className="calendar-grid">
          <div className="weekdays">
            <div className="weekday">Monday</div>
            <div className="weekday">Tuesday</div>
            <div className="weekday">Wednesday</div>
            <div className="weekday">Thursday</div>
            <div className="weekday">Friday</div>
            <div className="weekday">Saturday</div>
            <div className="weekday">Sunday</div>
          </div>
          <div className="calendar-days">
            {loading ? (
              <div className="loading-message">Loading calendar...</div>
            ) : (
              renderCalendarDays()
            )}
          </div>
        </div>
      </div>

      {showEventModal && (
        <EventModal
          session={session}
          event={selectedEvent}
          date={selectedDate}
          categories={categories}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
            fetchEvents();
          }}
        />
      )}

      {showTaskModal && (
        <TaskModal
          session={session}
          task={selectedTask}
          categories={categories}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
            fetchTasks();
          }}
        />
      )}

      {showCategoryManager && (
        <CategoryManager
          session={session}
          categories={categories}
          onClose={() => {
            setShowCategoryManager(false);
            fetchCategories();
            fetchEvents();
            fetchTasks();
          }}
        />
      )}

      {showKanban && (
        <KanbanBoard
          session={session}
          tasks={tasks}
          categories={categories}
          onClose={() => {
            setShowKanban(false);
            fetchTasks();
            fetchEvents();
          }}
        />
      )}

      {showComingSoon && (
        <div className="modal-overlay" onClick={() => setShowComingSoon(false)}>
          <div className="coming-soon-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Coming Soon</h2>
            <p>Day and Week views are planned for Phase 4.</p>
            <p>Stay tuned!</p>
            <button className="btn-primary" onClick={() => setShowComingSoon(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;
