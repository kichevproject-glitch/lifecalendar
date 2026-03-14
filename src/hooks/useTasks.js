import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*, categories(id, name, color, icon)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) setTasks(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function createTask(task) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, user_id: user.id })
      .select('*, categories(id, name, color, icon)')
      .single()
    if (!error) setTasks(prev => [data, ...prev])
    return { data, error }
  }

  async function updateTask(id, updates) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select('*, categories(id, name, color, icon)')
      .single()
    if (!error) setTasks(prev => prev.map(t => t.id === id ? data : t))
    return { data, error }
  }

  async function deleteTask(id) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) setTasks(prev => prev.filter(t => t.id !== id))
    return { error }
  }

  return { tasks, loading, createTask, updateTask, deleteTask, refetch: fetchTasks }
}