'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
// import { DashboardLayout } from '@/components/dashboard/layout'
import { RoomCard } from '@/components/dashboard/room-card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Button } from '@/components/ui/button'
import { Plus, Vote, Loader2 } from 'lucide-react'
import { VotingRoom } from '@/lib/types'
// import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  role: 'admin' | 'member'
}

export default function MyRoomsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [rooms, setRooms] = useState<VotingRoom[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const router = useRouter()
  // const { toast } = Toaster()

  useEffect(() => {
    const checkUser = async (): Promise<void> => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (!userData) {
        router.push('/auth/login')
        return
      }

      setUser(userData)
      await loadRooms(userData.id)
    }

    checkUser()
  }, [router])

  const loadRooms = async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('voting_rooms')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setRooms(data || [])
    } catch (error) {
      console.error('Error loading rooms:', error)
      toast.error('Failed to load voting Rooms')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = (roomId: string): void => {
    const link = `${window.location.origin}/vote/${roomId}`
    navigator.clipboard.writeText(link)
    toast.success('Voting Link Copied to Clipboard')
  }

  const handleDelete = async (room: VotingRoom): Promise<void> => {
    if (!confirm(`Are you sure you want to delete "${room.title}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('voting_rooms')
        .delete()
        .eq('id', room.id)

      if (error) throw error

      setRooms(rooms.filter(r => r.id !== room.id))
      toast.success('Room Deleted Successfully')
    } catch (error) {
      console.error('Error deleting room:', error)
      toast.error('Failed to delete Room')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  if (!user) return null

  return (
    // <DashboardLayout
    //   userRole={user.role}
    //   userName={user.email?.split('@')[0] || 'User'}
    //   userEmail={user.email || ''}
    // >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              My Voting Rooms
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage your voting rooms and track participation
            </p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/create-room')}
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={rooms.length >= 3}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Room
          </Button>
        </div>

        {/* Room Limit Info */}
        <div className="p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
          <p className="text-sm text-orange-800 dark:text-orange-200">
            <strong>Room Limit:</strong> You have created {rooms.length} out of 3 maximum rooms.
            {rooms.length >= 3 && ' Delete a room to create a new one.'}
          </p>
        </div>

        {/* Rooms Grid */}
        {rooms.length === 0 ? (
          <EmptyState
            icon={Vote}
            title="No Voting Rooms Yet"
            description="Create your first voting room to get started. You can create up to 3 rooms."
            actionLabel="Create Your First Room"
            onAction={() => router.push('/dashboard/create-room')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onCopyLink={handleCopyLink}
                onDelete={handleDelete}
                onEdit={(room) => router.push(`/dashboard/rooms/${room.id}/edit`)}
              />
            ))}
          </div>
        )}
      </div>
    // </DashboardLayout>
  )
}