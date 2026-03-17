import { useState } from 'react'
import { useSharing } from '../../hooks/useSharing'

export default function SharedView() {
  const {
    sharedWith, sharedByOthers, activeShared,
    inviteByEmail, revokeAccess, toggleSharedCalendar, loading,
  } = useSharing()

  const [showInvite, setShowInvite] = useState(false)
  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [inviteError,setInviteError]= useState('')

  async function handleInvite(e) {
    e.preventDefault()
    if (!email.trim()) return
    setInviting(true)
    setInviteError('')
    const { error } = await inviteByEmail(email.trim())
    if (error) setInviteError(error.message)
    else setInviteSent(true)
    setInviting(false)
  }

  function resetInvite() {
    setShowInvite(false)
    setEmail('')
    setInviteSent(false)
    setInviteError('')
  }

  if (loading) return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:28, height:28, border:'3px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={wrapper}>
      {/* Header */}
      <div style={pageHeader}>
        <h2 style={pageTitle}>Shared Calendars</h2>
        <button onClick={() => setShowInvite(true)} style={newBtn}>+ Share my calendar</button>
      </div>

      <div style={content}>
        {/* ── Section: I'm sharing with ── */}
        <div style={section}>
          <p style={sectionLabel}>I'm sharing with</p>
          {sharedWith.length === 0 ? (
            <div style={emptyState}>You haven't shared with anyone yet.</div>
          ) : (
            <div style={list}>
              {sharedWith.map(member => (
                <div key={member.id} style={card}>
                  <div style={avatar}>👤</div>
                  <div style={{ flex:1 }}>
                    <div style={cardTitle}>{member.invited_email}</div>
                    <div style={cardSub}>View only · {member.status === 'pending' ? 'Invitation pending' : 'Active'}</div>
                  </div>
                  <span style={{
                    ...badge,
                    background: member.status === 'pending' ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.12)',
                    color: member.status === 'pending' ? 'var(--warning)' : 'var(--success)',
                    border: `1px solid ${member.status === 'pending' ? 'rgba(251,191,36,0.3)' : 'rgba(52,211,153,0.3)'}`,
                  }}>
                    {member.status === 'pending' ? 'Pending' : 'Active'}
                  </span>
                  <button onClick={() => revokeAccess(member.id)} style={revokeBtn}>Revoke</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Section: Shared with me ── */}
        <div style={section}>
          <p style={sectionLabel}>Shared with me</p>
          {sharedByOthers.length === 0 ? (
            <div style={emptyState}>No one has shared their calendar with you yet.</div>
          ) : (
            <div style={list}>
              {sharedByOthers.map(membership => {
                const calId = membership.shared_calendars?.id
                const isOn = activeShared.includes(calId)
                const ownerDisplay = membership.owner_email || membership.shared_calendars?.name || 'Shared calendar'
                return (
                  <div key={membership.id} style={card}>
                    <div style={{ ...avatar, background: 'rgba(52,211,153,0.12)' }}>👥</div>
                    <div style={{ flex:1 }}>
                      <div style={cardTitle}>{ownerDisplay}</div>
                      <div style={cardSub}>{membership.status === 'pending' ? 'Invitation pending — check your email' : 'View only'}</div>
                    </div>
                    {membership.status === 'accepted' && (
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:12, color: isOn ? 'var(--success)' : 'var(--text-muted)' }}>
                          {isOn ? 'Showing' : 'Hidden'}
                        </span>
                        <div
                          onClick={() => toggleSharedCalendar(calId)}
                          style={{
                            width:40, height:22, borderRadius:11,
                            background: isOn ? 'var(--success)' : 'var(--bg-hover)',
                            border:`1px solid ${isOn ? 'var(--success)' : 'var(--border)'}`,
                            cursor:'pointer', position:'relative', transition:'all 0.2s', flexShrink:0
                          }}
                        >
                          <div style={{
                            position:'absolute', top:2, left: isOn ? 20 : 2,
                            width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s'
                          }} />
                        </div>
                      </div>
                    )}
                    {membership.status === 'pending' && (
                      <span style={{ ...badge, background:'rgba(251,191,36,0.15)', color:'var(--warning)', border:'1px solid rgba(251,191,36,0.3)' }}>Pending</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── How shared events look ── */}
        <div style={section}>
          <p style={sectionLabel}>How shared events appear on your calendar</p>
          <div style={{ display:'flex', flexDirection:'column', gap:6, maxWidth:220 }}>
            <div style={{ fontSize:11, padding:'3px 8px', borderRadius:4, background:'rgba(59,130,246,0.2)', borderLeft:'3px solid #3B82F6', color:'var(--text-primary)', display:'flex', alignItems:'center', gap:5 }}>
              <span>💼</span> Your own event
            </div>
            <div style={{ fontSize:11, padding:'3px 8px', borderRadius:4, background:'rgba(236,72,153,0.2)', borderLeft:'3px solid #EC4899', color:'var(--text-primary)', display:'flex', alignItems:'center', gap:5 }}>
              <span>👥</span> Event from shared calendar
            </div>
          </div>
        </div>
      </div>

      {/* ── Invite Modal ── */}
      {showInvite && (
        <div style={overlay} onClick={e => e.target === e.currentTarget && resetInvite()}>
          <div style={modal} className="slide-in">
            <div style={{ height:6, borderRadius:'18px 18px 0 0', background:'var(--accent)' }} />
            <div style={{ padding:'20px 24px 24px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                <h2 style={modalTitle}>Share your calendar</h2>
                <button onClick={resetInvite} style={closeBtn}>✕</button>
              </div>

              {inviteSent ? (
                <div style={{ textAlign:'center', padding:'20px 0' }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>✉️</div>
                  <p style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)', marginBottom:6 }}>Invitation sent!</p>
                  <p style={{ fontSize:13, color:'var(--text-secondary)' }}>
                    {email} will receive an email with a link to accept your invitation.
                  </p>
                  <button onClick={resetInvite} style={{ marginTop:20, background:'var(--accent)', color:'#fff', padding:'10px 24px', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer' }}>Done</button>
                </div>
              ) : (
                <form onSubmit={handleInvite} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  <div>
                    <label style={lbl}>Email address</label>
                    <div style={{ position:'relative', marginTop:4 }}>
                      <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:14, pointerEvents:'none' }}>✉️</span>
                      <input
                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="friend@example.com" autoFocus
                        style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 12px 9px 32px', color:'var(--text-primary)', fontSize:13, width:'100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ background:'var(--accent-dim)', border:'1px solid rgba(124,111,255,0.2)', borderRadius:8, padding:'10px 14px' }}>
                    <p style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.6, margin:0 }}>
                      They will receive an email invitation. Once accepted, they can view your events and tasks — but cannot edit them.
                    </p>
                  </div>

                  {inviteError && (
                    <div style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', color:'#f87171', padding:'10px 14px', borderRadius:8, fontSize:13 }}>
                      {inviteError}
                    </div>
                  )}

                  <div style={{ display:'flex', gap:10 }}>
                    <button type="button" onClick={resetInvite} style={cancelBtn}>Cancel</button>
                    <button type="submit" disabled={inviting} style={submitBtn}>
                      {inviting ? 'Sending...' : 'Send invitation'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────────
const wrapper = { display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }
const pageHeader = { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 16px', borderBottom:'1px solid var(--border)' }
const pageTitle = { fontFamily:'var(--font-display)', fontSize:24, fontWeight:700, margin:0 }
const newBtn = { background:'var(--accent)', color:'#fff', padding:'8px 18px', borderRadius:'var(--radius-sm)', fontWeight:600, fontSize:13, cursor:'pointer' }
const content = { flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:28 }
const section = { display:'flex', flexDirection:'column', gap:12 }
const sectionLabel= { fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', margin:0 }
const list = { display:'flex', flexDirection:'column', gap:8 }
const card = { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }
const avatar = { width:36, height:36, borderRadius:'50%', background:'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }
const cardTitle = { fontSize:13, fontWeight:600, color:'var(--text-primary)' }
const cardSub = { fontSize:11, color:'var(--text-muted)', marginTop:2 }
const badge = { fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, flexShrink:0 }
const revokeBtn = { background:'rgba(248,113,113,0.1)', color:'#f87171', border:'1px solid rgba(248,113,113,0.3)', borderRadius:6, padding:'5px 10px', fontSize:11, fontWeight:600, cursor:'pointer', flexShrink:0 }
const emptyState = { fontSize:13, color:'var(--text-muted)', padding:'12px 0' }
const lbl = { fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }
const overlay = { position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16, backdropFilter:'blur(4px)' }
const modal = { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', width:'100%', maxWidth:440, boxShadow:'var(--shadow-lg)' }
const modalTitle = { fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, margin:0 }
const closeBtn = { background:'none', color:'var(--text-muted)', fontSize:18, padding:4 }
const cancelBtn = { flex:1, background:'var(--bg-hover)', border:'1px solid var(--border)', color:'var(--text-secondary)', padding:'10px', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer' }
const submitBtn = { flex:1, background:'var(--accent)', color:'#fff', padding:'10px', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer', border:'none' }
