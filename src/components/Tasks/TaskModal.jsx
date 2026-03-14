import { useState } from 'react'
import { format } from 'date-fns'

const REMINDER_OPTIONS = [
  { value: '',     label: 'No reminder' },
  { value: '1440', label: '1 day before' },
  { value: '180',  label: '3 hours before' },
  { value: '60',   label: '1 hour before' },
]
const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low',    color: '#34d399' },
  { value: 'medium', label: 'Medium', color: '#fbbf24' },
  { value: 'high',   label: 'High',   color: '#f87171' },
]
const STATUS_OPTIONS = [
  { value: 'todo',        label: 'To Do',       color: 'var(--text-muted)',  bg: 'var(--bg-hover)' },
  { value: 'in_progress', label: 'In Progress', color: 'var(--accent)',      bg: 'var(--accent-dim)' },
  { value: 'done',        label: 'Done',        color: 'var(--success)',     bg: 'rgba(52,211,153,0.12)' },
]

export default function TaskModal({ task, date, categories, onSave, onDelete, onClose }) {
  const isNew = !task
  const [title,           setTitle]           = useState(task?.title || '')
  const [description,     setDescription]     = useState(task?.description || '')
  const [categoryId,      setCategoryId]      = useState(task?.category_id || '')
  const [priority,        setPriority]        = useState(task?.priority || 'medium')
  const [status,          setStatus]          = useState(task?.status || 'todo')
  const [dueDate,         setDueDate]         = useState(task?.due_date ? task.due_date : date ? format(date, 'yyyy-MM-dd') : '')
  const [hasTime,         setHasTime]         = useState(!!task?.due_time)
  const [dueTime,         setDueTime]         = useState(task?.due_time || '')
  const [reminderMinutes, setReminderMinutes] = useState(task?.reminder_minutes ? String(task.reminder_minutes) : '')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const priorityColor = PRIORITY_OPTIONS.find(p => p.value === priority)?.color || 'var(--accent)'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setLoading(true); setError('')
    const payload = {
      title: title.trim(), description,
      category_id: categoryId || null, priority, status,
      due_date: dueDate || null,
      due_time: hasTime && dueTime ? dueTime : null,
      reminder_minutes: reminderMinutes ? parseInt(reminderMinutes) : null,
      reminder_sent: false,
    }
    const { error: saveError } = await onSave(payload)
    if (saveError) { setError(saveError.message); setLoading(false) } else onClose()
    setLoading(false)
  }

  async function handleDelete() {
    if (!window.confirm('Delete this task?')) return
    setLoading(true); await onDelete(task.id); onClose()
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...modal, borderTop: `4px solid ${priorityColor}` }} className="slide-in">
        <div style={header}>
          <h2 style={titleStyle}>{isNew ? 'New Task' : 'Edit Task'}</h2>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={form}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task name..." style={inputLarge} autoFocus />
          <div style={fieldCol}>
            <label style={lbl}>Status</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {STATUS_OPTIONS.map(s => (
                <button key={s.value} type="button" onClick={() => setStatus(s.value)} style={{ flex:1, padding:'8px 4px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s', border:`1px solid ${status===s.value?s.color:'var(--border)'}`, background:status===s.value?s.bg:'transparent', color:status===s.value?s.color:'var(--text-muted)' }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div style={fieldCol}>
            <label style={lbl}>Priority</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PRIORITY_OPTIONS.map(p => (
                <button key={p.value} type="button" onClick={() => setPriority(p.value)} style={{ flex:1, padding:'8px 4px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s', border:`1px solid ${priority===p.value?p.color:'var(--border)'}`, background:priority===p.value?p.color+'20':'transparent', color:priority===p.value?p.color:'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:p.color, display:'inline-block' }} />{p.label}
                </button>
              ))}
            </div>
          </div>
          <div style={fieldCol}>
            <label style={lbl}>Category</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              <button type="button" onClick={() => setCategoryId('')} style={{ ...catBtn, ...(categoryId===''?catBtnActive('#6b7280'):{}) }}>None</button>
              {categories.map(c => (
                <button key={c.id} type="button" onClick={() => setCategoryId(c.id)} style={{ ...catBtn, ...(categoryId===c.id?catBtnActive(c.color):{}), borderColor:c.color+'50' }}>
                  <span>{c.icon}</span> {c.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>Due date</label>
            <div style={{ display:'flex', gap:10, marginTop:4, alignItems:'center' }}>
              <div style={{ position:'relative', flex:1 }}>
                <span style={pinIcon}>📅</span>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...input, paddingLeft:32, marginTop:0 }} />
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text-muted)', cursor:'pointer', whiteSpace:'nowrap' }}>
                <input type="checkbox" checked={hasTime} onChange={e => setHasTime(e.target.checked)} style={{ accentColor:'var(--accent)', width:14, height:14 }} />Add time
              </label>
            </div>
            {hasTime && (
              <div style={{ position:'relative', marginTop:6 }}>
                <span style={pinIcon}>🕐</span>
                <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} style={{ ...input, paddingLeft:32, marginTop:0 }} />
              </div>
            )}
          </div>
          <div>
            <label style={lbl}>Email Reminder</label>
            <div style={{ position:'relative', marginTop:4 }}>
              <span style={pinIcon}>🔔</span>
              <select value={reminderMinutes} onChange={e => setReminderMinutes(e.target.value)} style={{ ...input, paddingLeft:32, marginTop:0, appearance:'none', cursor:'pointer' }}>
                {REMINDER_OPTIONS.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
              <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'var(--text-muted)', pointerEvents:'none' }}>▾</span>
            </div>
            {reminderMinutes && (
              <div style={reminderHint}><span>✉️</span><span>Reminder will be sent to your account address</span></div>
            )}
          </div>
          <div>
            <label style={lbl}>Notes</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add notes..." rows={3} style={{ ...input, resize:'vertical' }} />
          </div>
          {error && <div style={errorBox}>{error}</div>}
          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            {!isNew && (<button type="button" onClick={handleDelete} disabled={loading} style={deleteBtnStyle}>Delete</button>)}
            <button type="submit" disabled={loading} style={{ ...saveBtn, marginLeft:'auto' }}>{loading?'Saving...':isNew?'Create Task':'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
const overlay={position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16,backdropFilter:'blur(4px)'}
const modal={background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto',boxShadow:'var(--shadow-lg)'}
const header={display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px 0'}
const titleStyle={fontFamily:'var(--font-display)',fontSize:20,fontWeight:700}
const closeBtn={background:'none',color:'var(--text-muted)',fontSize:18,padding:4}
const form={display:'flex',flexDirection:'column',gap:16,padding:'16px 24px 24px'}
const fieldCol={display:'flex',flexDirection:'column',gap:8}
const lbl={fontSize:11,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}
const inputLarge={background:'var(--bg-secondary)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'12px 14px',color:'var(--text-primary)',fontSize:16,fontWeight:500,width:'100%'}
const input={background:'var(--bg-secondary)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'9px 12px',color:'var(--text-primary)',fontSize:13,width:'100%',marginTop:4}
const pinIcon={position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:14,pointerEvents:'none'}
const catBtn={background:'var(--bg-secondary)',border:'1px solid var(--border)',color:'var(--text-secondary)',borderRadius:20,padding:'5px 12px',fontSize:12,display:'flex',alignItems:'center',gap:4,transition:'all 0.15s'}
const catBtnActive=(color)=>({background:color+'25',borderColor:color,color:color,fontWeight:700})
const reminderHint={marginTop:8,display:'flex',alignItems:'center',gap:6,background:'var(--accent-dim)',border:'1px solid rgba(124,111,255,0.2)',borderRadius:8,padding:'8px 12px',fontSize:12,color:'var(--text-secondary)'}
const saveBtn={background:'var(--accent)',color:'#fff',padding:'10px 20px',borderRadius:'var(--radius-sm)',fontWeight:600,fontSize:13}
const deleteBtnStyle={background:'rgba(248,113,113,0.1)',color:'#f87171',border:'1px solid rgba(248,113,113,0.3)',padding:'10px 16px',borderRadius:'var(--radius-sm)',fontWeight:600,fontSize:13}
const errorBox={background:'rgba(248,113,113,0.1)',border:'1px solid rgba(248,113,113,0.3)',color:'#f87171',padding:'10px 14px',borderRadius:'var(--radius-sm)',fontSize:13}