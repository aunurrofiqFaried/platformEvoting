import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Candidate {
  id: string
  name: string
  vote_count: number
  room_id: string
}

export function useRealtimeCandidates(roomId: string) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCandidates = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('candidates')
        .select('id, name, vote_count, room_id')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError
      setCandidates(data || [])
      setError(null)
    } catch (err) {
      console.error('Error loading candidates:', err)
      setError('Failed to load candidates')
    } finally {
      setLoading(false)
    }
  }, [roomId])

  useEffect(() => {
    loadCandidates()
  }, [loadCandidates])

  useEffect(() => {
    if (!roomId) return

    // Subscribe to all changes on candidates table for this room
    const channel = supabase
      .channel(`candidates-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candidates',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('Change received!', payload)
          // Reload candidates on any change
          loadCandidates()
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    return () => {
      channel.unsubscribe()
    }
  }, [roomId, loadCandidates])

  return { candidates, loading, error, refetch: loadCandidates }
}