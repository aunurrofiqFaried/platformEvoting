'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { RoomCard } from '@/components/dashboard/room-card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { StatsCard } from '@/components/dashboard/stat-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
// import { Badge } from '@/components/ui/badge'
import { Vote, Search, Loader2, Filter } from 'lucide-react'
import { VotingRoom } from '@/lib/types'
import { toast } from 'sonner'

export default function AllRoomsPage() {
  const [rooms, setRooms] = useState<VotingRoom[]>([])
  const [filteredRooms, setFilteredRooms] = useState<VotingRoom[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'closed'>('all')
  // const { toast } = useToast()

  useEffect(() => {
    loadRooms()
  }, [])

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

  const loadRooms = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('voting_rooms')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setRooms(data || [])
      setFilteredRooms(data || [])
    } catch (error) {
      console.error('Error loading rooms:', error)
      toast.error('Failed to load voting rooms')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = (roomId: string): void => {
    const link = `${window.location.origin}/vote/${roomId}`
    navigator.clipboard.writeText(link)
    toast.success('Room link copied to clipboard')
  }

  const handleDelete = async (room: VotingRoom): Promise<void> => {
    if (!confirm(`Are you sure you want to delete "${room.title}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('voting_rooms')
        .delete()
        .eq('id', room.id)

      if (error) throw error

      setRooms(rooms.filter(r => r.id !== room.id))
      toast.success('Room deleted successfully')
    } catch (error) {
      console.error('Error deleting room:', error)
      toast.error('Failed to delete room')
    }
  }

  const handleToggleStatus = async (room: VotingRoom): Promise<void> => {
    const newStatus = room.status === 'active' ? 'closed' : 'active'
    
    try {
      const { error } = await supabase
        .from('voting_rooms')
        .update({ status: newStatus })
        .eq('id', room.id)

      if (error) throw error

      setRooms(rooms.map(r =>
        r.id === room.id ? { ...r, status: newStatus } : r
      ))

      toast.success(`Room status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating room status:', error)
      toast.error('Failed to update room status')
    }
  }

  // Calculate stats
  const totalRooms = rooms.length
  const activeRooms = rooms.filter(r => r.status === 'active').length
  const closedRooms = rooms.filter(r => r.status === 'closed').length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          All Voting Rooms
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Monitor and manage all voting rooms in the system
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Rooms"
          value={totalRooms}
          icon={Vote}
          description="All voting rooms"
          color="blue"
        />
        <StatsCard
          title="Active Rooms"
          value={activeRooms}
          icon={Vote}
          description="Currently open for voting"
          color="green"
        />
        <StatsCard
          title="Closed Rooms"
          value={closedRooms}
          icon={Vote}
          description="Voting has ended"
          color="orange"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
            className={filterStatus === 'all' ? 'bg-orange-500 hover:bg-orange-600' : ''}
          >
            All
          </Button>
          <Button
            variant={filterStatus === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('active')}
            className={filterStatus === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}
          >
            Active
          </Button>
          <Button
            variant={filterStatus === 'closed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('closed')}
            className={filterStatus === 'closed' ? 'bg-slate-500 hover:bg-slate-600' : ''}
          >
            Closed
          </Button>
        </div>
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        </div>
      ) : filteredRooms.length === 0 ? (
        <EmptyState
          icon={Vote}
          title={searchQuery || filterStatus !== 'all' ? 'No Rooms Found' : 'No Voting Rooms Yet'}
          description={
            searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'No voting rooms have been created yet'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onCopyLink={handleCopyLink}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}