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
      const { data: members } = await supabase
        .from('calendar_members')
        .select('*')
        .eq('calendar_id', cal.id)
        .order('invited_at')
      setSharedWith(members || [])
    }

    const { data: byUserId } = await supabase
      .from('calendar_members')
      .select('*, shared_calendars(id, name, owner_id)')
      .eq('user_id', user.id)

    const { data: byEmail } = await supabase
      .from('calendar_members')
      .select('*, shared_calendars(id, name, owner_id)')
      .eq('invited_email', user.email)
      .is('user_id', null)

    const all = [...(byUserId || []), ...(byEmail || [])]
    const seen = new Set()
    const merged = all.filter(m => {
      if (seen.has(m.id)) return false
      seen.add(m.id); return true
    })

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

  // FIX: depend on user?.id so this re-runs after auth is ready on refresh
  useEffect(() => {
    if (!user || !activeShared.length) { setSharedEvents([]); return }
    fetchSharedEvents()
  }, [activeShared.join(','), user?.id]) // eslint-disable-line

  async function fetchSharedEvents() {
    if (!user || !activeShared.length) return

    const ownCalId = myCalendar?.id
    const filteredIds = ownCalId ? activeShared.filter(id => id !== ownCalId) : activeShared
    if (!filteredIds.length) { setSharedEvents([]); return }

    const { data: cals } = await supabase
      .from('shared_calendars')
      .select('owner_id')
      .in('id', filteredIds)

    if (!cals || !cals.length) return

    const ownerIds = cals.map(c => c.owner_id).filter(id => id !== user.id)
    if (!ownerIds.length) { setSharedEvents([]); return }

    const { data } = await supabase
      .from('events')
      .select('*, categories(id, name, color, icon)')
      .in('user_id', ownerIds)
      .eq('is_holiday', false)

    setSharedEvents(data || [])
  }

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

  async function revokeAccess(memberId) {
    const { error } = await supabase
      .from('calendar_members')
      .delete()
      .eq('id', memberId)
    if (!error) setSharedWith(prev => prev.filter(m => m.id !== memberId))
    return { error }
  }

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
