import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function usePhotos(eventId) {
  const { user } = useAuth()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchPhotos = useCallback(async () => {
    if (!user || !eventId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at')
    if (!error) setPhotos(data || [])
    setLoading(false)
  }, [user, eventId])

  useEffect(() => { fetchPhotos() }, [fetchPhotos])

  // Resolve a public URL for a storage path
  function getPhotoUrl(storagePath) {
    const { data } = supabase.storage.from('photos').getPublicUrl(storagePath)
    return data?.publicUrl || null
  }

  // Upload one image file, insert row into photos table
  async function uploadPhoto(file, caption = '') {
    if (!user || !eventId) return { error: new Error('Not ready') }
    const ext = file.name.split('.').pop()
    const storagePath = `${user.id}/${eventId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(storagePath, file, { cacheControl: '3600', upsert: false })
    if (uploadError) return { error: uploadError }

    const { data, error: insertError } = await supabase
      .from('photos')
      .insert({ user_id: user.id, event_id: eventId, storage_path: storagePath, caption })
      .select()
      .single()
    if (insertError) return { error: insertError }

    const url = getPhotoUrl(storagePath)
    const photoWithUrl = { ...data, url }
    setPhotos(prev => [...prev, photoWithUrl])
    return { data: photoWithUrl, error: null }
  }

  async function deletePhoto(photo) {
    await supabase.storage.from('photos').remove([photo.storage_path])
    const { error } = await supabase.from('photos').delete().eq('id', photo.id)
    if (!error) setPhotos(prev => prev.filter(p => p.id !== photo.id))
    return { error }
  }

  // Hydrate public URLs on photos that were fetched from DB (they only have storage_path)
  useEffect(() => {
    if (!photos.length) return
    const needsUrl = photos.some(p => !p.url)
    if (!needsUrl) return
    setPhotos(prev => prev.map(p => p.url ? p : { ...p, url: getPhotoUrl(p.storage_path) }))
  }, [photos.length]) // eslint-disable-line

  return { photos, loading, uploadPhoto, deletePhoto, refetch: fetchPhotos }
}
