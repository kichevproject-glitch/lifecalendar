import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useCategories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchCategories()
  }, [user])

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    if (!error) setCategories(data || [])
    setLoading(false)
  }

  async function createCategory(cat) {
    const { data, error } = await supabase
      .from('categories')
      .insert({ ...cat, user_id: user.id })
      .select()
      .single()
    if (!error) setCategories(prev => [...prev, data].sort((a,b) => a.name.localeCompare(b.name)))
    return { data, error }
  }

  async function updateCategory(id, updates) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error) setCategories(prev => prev.map(c => c.id === id ? data : c).sort((a,b) => a.name.localeCompare(b.name)))
    return { data, error }
  }

  async function deleteCategory(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (!error) setCategories(prev => prev.filter(c => c.id !== id))
    return { error }
  }

  return { categories, loading, createCategory, updateCategory, deleteCategory, refetch: fetchCategories }
}
