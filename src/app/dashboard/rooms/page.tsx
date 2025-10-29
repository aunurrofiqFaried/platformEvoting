'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { RoomCard } from '@/components/dashboard/room-card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { StatsCard } from '@/components/dashboard/stat-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
// import { Badge } from '@/components/ui/badge'
import { Vote, Search, Loader2, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { VotingRoom } from '@/lib/types'
import { toast } from 'sonner'

const ITEMS_PER_PAGE = 12 // 3 columns x 4 rows

export default function AllRoomsPage() {
  const [rooms, setRooms] = useState<VotingRoom[]>([])
  const [filteredRooms, setFilteredRooms] = useState<VotingRoom[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'closed'>('all')
  const [currentPage, setCurrentPage] = useState<number>(1)
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
    // Reset to page 1 when filters change
    setCurrentPage(1)
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

  // Calculate pagination
  const totalRooms = rooms.length
  const filteredTotal = filteredRooms.length
  const totalPages = Math.ceil(filteredTotal / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedRooms = filteredRooms.slice(startIndex, endIndex)

  // Calculate stats
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
            className="pl-10 dark:bg-slate-800 dark:border-slate-700"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
            className={filterStatus === 'all' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'dark:border-slate-600 dark:text-white'}
          >
            All
          </Button>
          <Button
            variant={filterStatus === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('active')}
            className={filterStatus === 'active' ? 'bg-green-500 hover:bg-green-600 text-white' : 'dark:border-slate-600 dark:text-white'}
          >
            Active
          </Button>
          <Button
            variant={filterStatus === 'closed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('closed')}
            className={filterStatus === 'closed' ? 'bg-slate-500 hover:bg-slate-600 text-white' : 'dark:border-slate-600 dark:text-white'}
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
        <div className="space-y-6">
          {/* Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onCopyLink={handleCopyLink}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              {/* Info Text */}
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Showing <span className="font-semibold">{Math.min(startIndex + 1, filteredTotal)}-{Math.min(endIndex, filteredTotal)}</span> of <span className="font-semibold">{filteredTotal}</span> rooms
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="gap-1 dark:border-slate-600 dark:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>

                {/* Page Indicators */}
                <div className="flex items-center gap-1">
                  {totalPages <= 5 ? (
                    // Show all page numbers if 5 or fewer pages
                    Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        className={
                          currentPage === page
                            ? 'bg-orange-500 hover:bg-orange-600 text-white w-10 h-10'
                            : 'dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 w-10 h-10'
                        }
                      >
                        {page}
                      </Button>
                    ))
                  ) : (
                    // Show abbreviated page numbers if more than 5 pages
                    <>
                      {[1, currentPage > 3 ? '...' : null, currentPage - 1, currentPage, currentPage + 1, currentPage < totalPages - 2 ? '...' : null, totalPages]
                        .filter((page, index, arr) => page !== null && arr.indexOf(page) === index)
                        .map((page, idx) => (
                          typeof page === 'string' ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-slate-600 dark:text-slate-400">
                              {page}
                            </span>
                          ) : (
                            <Button
                              key={page}
                              onClick={() => setCurrentPage(page as number)}
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              className={
                                currentPage === page
                                  ? 'bg-orange-500 hover:bg-orange-600 text-white w-10 h-10'
                                  : 'dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 w-10 h-10'
                              }
                            >
                              {page}
                            </Button>
                          )
                        ))}
                    </>
                  )}
                </div>

                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="gap-1 dark:border-slate-600 dark:text-white"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Page Counter */}
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}