import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useSharing() {
  const { user } = useAuth()

  const [myCalendar, setMyCalendar] = useState(null)
  const [sharedWith, setSharedWith] = useState([])
  const [sharedByOthers, setSharedByOthers] = useState([])
  const [activeShared, setActiveShared] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lc-active-shared') || '[]') }
    catch { return [] }
  })
  const [sharedEvents, setSharedEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)

    // 1. Get or create my shared calendar record
    let { data: cal } = await supabase
      .from('shared_calendars')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle()

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
      // 2. People I've shared with
      const { data: members } = await supabase
        .from('calendar_members')
        .select('*')
        .eq('calendar_id', cal.id)
        .order('invited_at')
      setSharedWith(members || [])
    }

    // 3. Calendars shared with me — look up by user_id OR by email (for pending invites)
    const { data: byUserId } = await supabase
      .from('calendar_members')
      .select('*, shared_calendars(id, name, owner_id)')
      .eq('user_id', user.id)

    const { data: byEmail } = await supabase
      .from('calendar_members')
      .select('*, shared_calendars(id, name, owner_id)')
      .eq('invited_email', user.email)
      .is('user_id', null)

    // Merge and deduplicate
    const all = [...(byUserId || []), ...(byEmail || [])]
    const seen = new Set()
    const merged = all.filter(m => {
      if (seen.has(m.id)) return false
      seen.add(m.id); return true
    })

    // 4. Fetch owner emails for shared calendars
    const calIds = merged.map(m => m.shared_calendars?.id).filter(Boolean)
    if (calIds.length) {
      const { data: owners } = await supabase.rpc('get_calendar_owner_emails', { calendar_ids: calIds })
      if (owners) {
        const emailMap = {}
        owners.forEach(o => { emailMap[o.calendar_id] = o.owner_email })
        merged.forEach(m => {
          if (m.shared_calendars?.id) {
            m.owner_email = emailMap[m.shared_calendars.id] || null
          }
        })
      }
    }

    setSharedByOthers(merged)

    // Clean up: remove own calendar from activeShared if it somehow got in
    if (cal) {
      setActiveShared(prev => {
        if (prev.includes(cal.id)) {
          const cleaned = prev.filter(id => id !== cal.id)
          localStorage.setItem('lc-active-shared', JSON.stringify(cleaned))
          return cleaned
        }
        return prev
      })
    }

    setLoading(false)
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Fetch events from owners of active shared calendars
  useEffect(() => {
    if (!activeShared.length) { setSharedEvents([]); return }
    fetchSharedEvents()
  }, [activeShared.join(',')]) // eslint-disable-line

  async function fetchSharedEvents() {
    if (!activeShared.length) return

    // Exclude own calendar from the list to prevent duplicates
    const ownCalId = myCalendar?.id
    const filteredIds = ownCalId ? activeShared.filter(id => id !== ownCalId) : activeShared
    if (!filteredIds.length) { setSharedEvents([]); return }

    // Get owner_ids for active shared calendars
    const { data: cals } = await supabase
      .from('shared_calendars')
      .select('owner_id')
      .in('id', filteredIds)

    if (!cals || !cals.length) return

    // Safety: never include own user_id
    const ownerIds = cals.map(c => c.owner_id).filter(id => id !== user.id)
    if (!ownerIds.length) { setSharedEvents([]); return }

    // Fetch events from those owners (RLS policy allows this for accepted members)
    const { data } = await supabase
      .from('events')
      .select('*, categories(id, name, color, icon)')
      .in('user_id', ownerIds)
      .eq('is_holiday', false)

    setSharedEvents(data || [])
  }

  // Invite someone by email
  async function inviteByEmail(email) {
    if (!myCalendar) return { error: new Error('No calendar found') }

    const existing = sharedWith.find(m => m.invited_email === email)
    if (existing) return { error: new Error('Already invited') }

    const { data, error } = await supabase
      .from('calendar_members')
      .insert({
        calendar_id: myCalendar.id,
        invited_email: email,
        role: 'viewer',
        status: 'pending',
      })
      .select()
      .single()

    if (!error) {
      setSharedWith(prev => [...prev, data])
      await supabase.functions.invoke('send-invite', {
        body: {
          to: email,
          inviterEmail: user.email,
          token: data.invite_token,
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

  // Accept invitation — update the row and auto-enable the calendar
  async function acceptInvite(token) {
    const { data, error } = await supabase
      .from('calendar_members')
      .update({
        user_id: user.id,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('invite_token', token)
      .select('*, shared_calendars(id, name, owner_id)')
      .single()

    if (!error && data) {
      // Auto-enable the shared calendar so events show immediately
      const calId = data.shared_calendars?.id
      if (calId) {
        setActiveShared(prev => {
          if (prev.includes(calId)) return prev
          const next = [...prev, calId]
          localStorage.setItem('lc-active-shared', JSON.stringify(next))
          return next
        })
      }
      await fetchAll()
    }
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
    activeShared, sharedEvents, loading,
    inviteByEmail, revokeAccess,
    acceptInvite, toggleSharedCalendar,
    refetch: fetchAll,
  }
}
