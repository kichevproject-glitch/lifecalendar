import { useState } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { useCategories } from '../../hooks/useCategories'
import TaskModal from './TaskModal'

const COLUMNS = [
  { value: 'todo',        label: 'To Do',       color: 'var(--text-muted)',  bg: 'var(--bg-hover)',      border: 'var(--border)' },
  { value: 'in_progress', label: 'In Progress', color: 'var(--accent)',      bg: 'var(--accent-dim)',    border: 'rgba(124,111,255,0.3)' },
  { value: 'done',        label: 'Done',        color: 'var(--success)',     bg: 'rgba(52,211,153,0.12)',border: 'rgba(52,211,153,0.3)' },
]
const PRIORITY_COLORS = { low: '#34d399', medium: '#fbbf24', high: '#f87171' }

export default function TasksView() {
  const { tasks, createTask, updateTask, deleteTask } = useTasks()
  const { categories } = useCategories()
  const [modal, setModal] = useState(null)

  async function handleSave(payload) {
    if (modal?.task) return updateTask(modal.task.id, payload)
    return createTask(payload)
  }

  return (
    <div style={wrapper}>
      <div style={pageHeader}>
        <h2 style={pageTitle}>Tasks</h2>
        <button onClick={() => setModal({ task: null })} style={newBtn}>+ New Task</button>
      </div>
      <div style={kanban}>
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.value)
          return (
            <div key={col.value} style={column}>
              <div style={colHeader}>
                <span style={{ fontSize:13, fontWeight:700, color:col.color }}>{col.label}</span>
                <span style={{ fontSize:11, fontWeight:700, background:col.bg, color:col.color, border:`1px solid ${col.border}`, borderRadius:20, padding:'2px 9px' }}>{colTasks.length}</span>
              </div>
              <div style={cardList}>
                {colTasks.map(task => {
                  const priColor = PRIORITY_COLORS[task.priority] || 'var(--text-muted)'
                  const cat = task.categories
                  return (
                    <div key={task.id} onClick={() => setModal({ task })} style={card}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                        <span style={{ fontSize:13, fontWeight:500, color:task.status==='done'?'var(--text-muted)':'var(--text-primary)', lineHeight:1.4, textDecoration:task.status==='done'?'line-through':'none' }}>
                          {task.title}
                        </span>
                        <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:priColor+'20', color:priColor, flexShrink:0 }}>
                          {task.priority}
                        </span>
                      </div>
                      {(cat || task.due_date) && (
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                          {cat && (<span style={{ fontSize:11, color:'var(--text-muted)' }}>{cat.icon} {cat.name}</span>)}
                          {task.due_date && (<span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:'auto' }}>📅 {task.due_date}</span>)}
                        </div>
                      )}
                    </div>
                  )
                })}
                {colTasks.length === 0 && (<div style={emptyCol}>No tasks here</div>)}
                <button onClick={() => setModal({ task: null })} style={addCardBtn}>+ Add task</button>
              </div>
            </div>
          )
        })}
      </div>
      {modal !== null && (
        <TaskModal
          task={modal.task || null}
          date={null}
          categories={categories}
          onSave={handleSave}
          onDelete={deleteTask}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
const wrapper={display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}
const pageHeader={display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px 16px',borderBottom:'1px solid var(--border)'}
const pageTitle={fontFamily:'var(--font-display)',fontSize:24,fontWeight:700,margin:0}
const newBtn={background:'var(--accent)',color:'#fff',padding:'8px 18px',borderRadius:'var(--radius-sm)',fontWeight:600,fontSize:13,cursor:'pointer'}
const kanban={display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:16,padding:'20px 24px',flex:1,overflowY:'auto'}
const column={display:'flex',flexDirection:'column',gap:0,minHeight:0}
const colHeader={display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}
const cardList={display:'flex',flexDirection:'column',gap:8}
const card={background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,padding:'12px 14px',cursor:'pointer',transition:'border-color 0.15s'}
const emptyCol={fontSize:12,color:'var(--text-muted)',textAlign:'center',padding:'16px 0',border:'1px dashed var(--border)',borderRadius:8}
const addCardBtn={background:'transparent',border:'1px dashed var(--border)',borderRadius:8,padding:'8px',fontSize:12,color:'var(--text-muted)',cursor:'pointer',width:'100%',textAlign:'center',marginTop:4}