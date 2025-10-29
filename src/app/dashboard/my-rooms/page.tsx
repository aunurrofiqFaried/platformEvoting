'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Vote, Loader2, Search, Copy, Edit, Trash2, AlertTriangle, Plus } from 'lucide-react'
import { VotingRoom } from '@/lib/types'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/dashboard/empty-state'

interface User {
  id: string
  email: string
  role: 'admin' | 'member'
}

interface ConfirmState {
  isOpen: boolean
  action: 'delete' | 'deactivate' | null
  room: VotingRoom | null
  isLoading: boolean
}

export default function MyRoomsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [rooms, setRooms] = useState<VotingRoom[]>([])
  const [filteredRooms, setFilteredRooms] = useState<VotingRoom[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'closed'>('all')
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState>({
    isOpen: false,
    action: null,
    room: null,
    isLoading: false,
  })
  const router = useRouter()

  useEffect(() => {
    const checkUser = async (): Promise<void> => {
      try {
        // Small delay untuk ensure localStorage ready
        await new Promise(resolve => setTimeout(resolve, 50))

        // Check dari localStorage dulu (email/password)
        const userId = localStorage.getItem('userId')
        const userEmail = localStorage.getItem('userEmail')
        const userRole = localStorage.getItem('userRole')

        if (userId && userEmail) {
          setUser({
            id: userId,
            email: userEmail,
            role: (userRole as 'admin' | 'member') || 'member',
          })
          await loadRooms(userId)
          return
        }

        // Fallback ke Supabase Auth (OAuth)
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

        setUser({
          id: userData.id,
          email: userData.email,
          role: userData.role || 'member',
        })
        await loadRooms(userData.id)
      } catch (error) {
        console.error('Check user error:', error)
        setLoading(false)
        router.push('/auth/login')
      }
    }

    checkUser()
  }, [router])

  useEffect(() => {
    let filtered = rooms

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(room =>
        room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(room => room.status === filterStatus)
    }

    setFilteredRooms(filtered)
  }, [searchQuery, filterStatus, rooms])

  const loadRooms = async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('voting_rooms')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setRooms(data || [])
      setFilteredRooms(data || [])
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

  const openDeleteDialog = (room: VotingRoom): void => {
    setConfirmDialog({
      isOpen: true,
      action: 'delete',
      room,
      isLoading: false,
    })
  }

  const openDeactivateDialog = (room: VotingRoom): void => {
    setConfirmDialog({
      isOpen: true,
      action: 'deactivate',
      room,
      isLoading: false,
    })
  }

  const closeDialog = (): void => {
    setConfirmDialog({
      isOpen: false,
      action: null,
      room: null,
      isLoading: false,
    })
  }

  const handleConfirm = async (): Promise<void> => {
    if (!confirmDialog.room) return

    setConfirmDialog(prev => ({ ...prev, isLoading: true }))

    try {
      if (confirmDialog.action === 'delete') {
        const { error } = await supabase
          .from('voting_rooms')
          .delete()
          .eq('id', confirmDialog.room.id)
          .eq('created_by', user?.id)

        if (error) throw error

        setRooms(rooms.filter(r => r.id !== confirmDialog.room!.id))
        toast.success('Room Deleted Successfully')
      } else if (confirmDialog.action === 'deactivate') {
        const { error } = await supabase
          .from('voting_rooms')
          .update({ status: 'closed' })
          .eq('id', confirmDialog.room.id)
          .eq('created_by', user?.id)

        if (error) throw error

        setRooms(rooms.map(r => 
          r.id === confirmDialog.room!.id ? { ...r, status: 'closed' } : r
        ))
        toast.success('Room Deactivated Successfully')
      }

      closeDialog()
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = confirmDialog.action === 'delete' 
        ? 'Failed to delete Room'
        : 'Failed to deactivate Room'
      toast.error(errorMessage)
      setConfirmDialog(prev => ({ ...prev, isLoading: false }))
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

      {/* Room Limit Alert */}
      <div className="p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
        <p className="text-sm text-orange-800 dark:text-orange-200">
          <strong>Room Limit:</strong> You have created {rooms.length} out of 3 maximum rooms.
          {rooms.length >= 3 && ' Delete a room to create a new one.'}
        </p>
      </div>

      {/* Filters */}
      {rooms.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 dark:bg-slate-900 dark:border-slate-800"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
              className={filterStatus === 'all' ? 'bg-orange-500 hover:bg-orange-600' : 'dark:border-slate-700 dark:text-white'}
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('active')}
              className={filterStatus === 'active' ? 'bg-green-500 hover:bg-green-600' : 'dark:border-slate-700 dark:text-white'}
            >
              Active
            </Button>
            <Button
              variant={filterStatus === 'closed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('closed')}
              className={filterStatus === 'closed' ? 'bg-slate-500 hover:bg-slate-600' : 'dark:border-slate-700 dark:text-white'}
            >
              Closed
            </Button>
          </div>
        </div>
      )}

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <EmptyState
          icon={Vote}
          title={rooms.length === 0 ? "No Voting Rooms Yet" : "No Rooms Found"}
          description={
            rooms.length === 0
              ? "Create your first voting room to get started."
              : 'Try adjusting your search or filter criteria'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onCopyLink={handleCopyLink}
              onDelete={openDeleteDialog}
              onDeactivate={openDeactivateDialog}
              onEdit={(room) => router.push(`/dashboard/rooms/${room.id}/edit`)}
              onDetails={(roomId) => router.push(`/dashboard/rooms/${roomId}?from=my-rooms`)}
            />
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={
          confirmDialog.action === 'delete'
            ? `Delete "${confirmDialog.room?.title}"?`
            : `Deactivate "${confirmDialog.room?.title}"?`
        }
        description={
          confirmDialog.action === 'delete'
            ? 'This action cannot be undone. The room and all its data will be permanently deleted.'
            : 'The room will be closed and voting will stop. Users will not be able to vote.'
        }
        actionLabel={confirmDialog.action === 'delete' ? 'Delete' : 'Deactivate'}
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={confirmDialog.isLoading}
        onConfirm={handleConfirm}
        onCancel={closeDialog}
      />
    </div>
  )
}

// Room Card Component
function RoomCard({
  room,
  onCopyLink,
  onDelete,
  onDeactivate,
  onEdit,
  onDetails
}: {
  room: VotingRoom
  onCopyLink: (roomId: string) => void
  onDelete: (room: VotingRoom) => void
  onDeactivate: (room: VotingRoom) => void
  onEdit: (room: VotingRoom) => void
  onDetails: (roomId: string) => void
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onDetails(room.id)}
    >
      <div className="p-6 space-y-4">
        {/* Room Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                {room.title}
              </h3>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                  room.status === 'active'
                    ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {room.status}
              </span>
            </div>
            {room.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                {room.description}
              </p>
            )}
          </div>
        </div>

        {/* Room Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Created</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {new Date(room.created_at).toLocaleDateString('id-ID')}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Status</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">
              {room.status}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800 flex-wrap"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Copy Link */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopyLink(room.id)}
            className="dark:text-white dark:hover:bg-slate-800"
            title="Copy voting link"
          >
            <Copy className="w-4 h-4" />
          </Button>

          {/* Edit */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(room)}
            className="dark:text-white dark:hover:bg-slate-800"
            title="Edit room"
          >
            <Edit className="w-4 h-4" />
          </Button>

          {/* Deactivate */}
          {room.status === 'active' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeactivate(room)}
              className="dark:text-orange-400 dark:hover:bg-orange-950 text-orange-600 hover:bg-orange-50"
              title="Deactivate room"
            >
              <AlertTriangle className="w-4 h-4" />
            </Button>
          )}

          {/* Delete */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(room)}
            className="dark:text-red-400 dark:hover:bg-red-950 text-red-600 hover:bg-red-50"
            title="Delete room"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}