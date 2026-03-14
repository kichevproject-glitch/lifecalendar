import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useSharing() {
  const { user } = useAuth()

  // My shared calendar (the one I own and share with others)
  const [myCalendar,  setMyCalendar]  = useState(null)
  // People I've shared with
  const [sharedWith,  setSharedWith]  = useState([])
  // Calendars shared with me
  const [sharedByOthers, setSharedByOthers] = useState([])
  // Active shared calendar IDs (toggled on)
  const [activeShared, setActiveShared] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lc-active-shared') || '[]') }
    catch { return [] }
  })
  // Events from shared calendars
  const [sharedEvents, setSharedEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)

    // 1. Get or create my shared calendar
    let { data: cal } = await supabase
      .from('shared_calendars')
      .select('*')
      .eq('owner_id', user.id)
      .single()

    if (!cal) {
      const { data: newCal } = await supabase
        .from('shared_calendars')
        .insert({ owner_id: user.id, name: 'My Calendar' })
        .select()
        .single()
      cal = newCal
    }
    setMyCalendar(cal)

    if (cal) {
      // 2. Get people I've shared with
      const { data: members } = await supabase
        .from('calendar_members')
        .select('*')
        .eq('calendar_id', cal.id)
        .order('invited_at')
      setSharedWith(members || [])
    }

    // 3. Get calendars shared with me (accepted or pending)
    const { data: memberships } = await supabase
      .from('calendar_members')
      .select('*, shared_calendars(id, name, owner_id)')
      .eq('user_id', user.id)
      .order('invited_at')
    setSharedByOthers(memberships || [])

    setLoading(false)
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Fetch events from all active shared calendars
  useEffect(() => {
    if (!activeShared.length) { setSharedEvents([]); return }
    fetchSharedEvents()
  }, [activeShared]) // eslint-disable-line

  async function fetchSharedEvents() {
    const { data } = await supabase
      .from('events')
      .select('*, categories(id, name, color, icon)')
      .in('calendar_id', activeShared)
    setSharedEvents(data || [])
  }

  // Invite someone by email
  async function inviteByEmail(email) {
    if (!myCalendar) return { error: new Error('No calendar found') }

    // Check if already invited
    const existing = sharedWith.find(m => m.invited_email === email)
    if (existing) return { error: new Error('Already invited') }

    const { data, error } = await supabase
      .from('calendar_members')
      .insert({
        calendar_id:    myCalendar.id,
        invited_email:  email,
        role:           'viewer',
        status:         'pending',
      })
      .select()
      .single()

    if (!error) {
      setSharedWith(prev => [...prev, data])
      // Send invite email via Edge Function
      await supabase.functions.invoke('send-invite', {
        body: {
          to:           email,
          inviterEmail: user.email,
          token:        data.invite_token,
        }
      })
    }
    return { data, error }
  }

  // Revoke access
  async function revokeAccess(memberId) {
    const { error } = await supabase
      .from('calendar_members')
      .delete()
      .eq('id', memberId)
    if (!error) setSharedWith(prev => prev.filter(m => m.id !== memberId))
    return { error }
  }

  // Accept an invitation (called when user opens the accept link)
  async function acceptInvite(token) {
    const { data, error } = await supabase
      .from('calendar_members')
      .update({ user_id: user.id, status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('invite_token', token)
      .select()
      .single()
    if (!error) await fetchAll()
    return { data, error }
  }

  // Toggle a shared calendar on/off
  function toggleSharedCalendar(calendarId) {
    setActiveShared(prev => {
      const next = prev.includes(calendarId)
        ? prev.filter(id => id !== calendarId)
        : [...prev, calendarId]
      localStorage.setItem('lc-active-shared', JSON.stringify(next))
      return next
    })
  }

  return {
    myCalendar, sharedWith, sharedByOthers,
    activeShared, sharedEvents,
    loading, inviteByEmail, revokeAccess,
    acceptInvite, toggleSharedCalendar,
    refetch: fetchAll,
  }
}
