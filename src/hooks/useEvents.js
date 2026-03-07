import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useEvents(year, month) {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || year == null || month == null) return
    fetchEvents()
  }, [user, year, month])

  async function fetchEvents() {
    setLoading(true)
    const start = new Date(year, month, 1).toISOString()
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

    const { data, error } = await supabase
      .from('events')
      .select('*, categories(id, name, color, icon)')
      .eq('user_id', user.id)
      .gte('start_at', start)
      .lte('start_at', end)
      .order('start_at')

    if (!error) setEvents(data || [])
    setLoading(false)
  }

  async function createEvent(event) {
    const { data, error } = await supabase
      .from('events')
      .insert({ ...event, user_id: user.id })
      .select('*, categories(id, name, color, icon)')
      .single()
    if (!error) setEvents(prev => [...prev, data])
    return { data, error }
  }

  async function updateEvent(id, updates) {
    const { data, error } = await supabase
      .from('events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, categories(id, name, color, icon)')
      .single()
    if (!error) setEvents(prev => prev.map(e => e.id === id ? data : e))
    return { data, error }
  }

  async function deleteEvent(id) {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (!error) setEvents(prev => prev.filter(e => e.id !== id))
    return { error }
  }

  return { events, loading, createEvent, updateEvent, deleteEvent, refetch: fetchEvents }
}
