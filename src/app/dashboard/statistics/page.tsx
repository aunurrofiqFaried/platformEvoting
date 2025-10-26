'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, TrendingUp, Users, Vote, BarChart3 } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, type PieLabelRenderProps } from 'recharts'

// Interfaces
interface RoomVoteData {
  name: string
  votes: number
}

interface RoomStatus {
  name: string
  value: number
  [key: string]: string | number
}

interface StatisticsData {
  totalRooms: number
  totalVotes: number
  totalCandidates: number
  activeRooms: number
}

export default function StatisticsPage() {
  const [loading, setLoading] = useState<boolean>(true)
  const [roomVotes, setRoomVotes] = useState<RoomVoteData[]>([])
  const [statusData, setStatusData] = useState<RoomStatus[]>([])
  const [stats, setStats] = useState<StatisticsData>({
    totalRooms: 0,
    totalVotes: 0,
    totalCandidates: 0,
    activeRooms: 0
  })

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async (): Promise<void> => {
    try {
      // 1. Load voting rooms dengan vote count
      const { data: rooms, error: roomsError } = await supabase
        .from('voting_rooms')
        .select('id, title, status')
        .order('created_at', { ascending: false })
        .limit(5)

      if (!roomsError && rooms && rooms.length > 0) {
        const roomVotePromises = rooms.map(async (room) => {
          const { count } = await supabase
            .from('votes')
            .select('id', { count: 'exact', head: true })
            .eq('room_id', room.id)

          return {
            name: room.title.length > 20 ? room.title.substring(0, 20) + '...' : room.title,
            votes: count || 0
          }
        })

        const roomVoteData = await Promise.all(roomVotePromises)
        setRoomVotes(roomVoteData)
      }

      // 2. Load room status (active vs closed)
      const { count: activeCount, error: activeError } = await supabase
        .from('voting_rooms')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')

      const { count: closedCount, error: closedError } = await supabase
        .from('voting_rooms')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'closed')

      if (!activeError && !closedError) {
        setStatusData([
          { name: 'Active', value: activeCount || 0 },
          { name: 'Closed', value: closedCount || 0 }
        ])
      }

      // 3. Load overall statistics
      const { count: totalRoomsCount } = await supabase
        .from('voting_rooms')
        .select('id', { count: 'exact', head: true })

      const { count: totalVotesCount } = await supabase
        .from('votes')
        .select('id', { count: 'exact', head: true })

      const { count: totalCandidatesCount } = await supabase
        .from('candidates')
        .select('id', { count: 'exact', head: true })

      setStats({
        totalRooms: totalRoomsCount || 0,
        totalVotes: totalVotesCount || 0,
        totalCandidates: totalCandidatesCount || 0,
        activeRooms: activeCount || 0
      })

    } catch (error) {
      console.error('Error loading statistics:', error)
    } finally {
      setLoading(false)
    }
  }



  // Warna untuk pie chart
  const COLORS = ['#22c55e', '#64748b']

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Statistics
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Voting data visualization and insights
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Rooms */}
        <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-900 dark:text-white">Total Rooms</CardTitle>
            <BarChart3 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.totalRooms}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              All voting rooms created
            </p>
          </CardContent>
        </Card>

        {/* Active Rooms */}
        <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-900 dark:text-white">Active Rooms</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.activeRooms}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Currently accepting votes
            </p>
          </CardContent>
        </Card>

        {/* Total Votes */}
        <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-900 dark:text-white">Total Votes</CardTitle>
            <Vote className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.totalVotes}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Votes cast across all rooms
            </p>
          </CardContent>
        </Card>

        {/* Total Candidates */}
        <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-900 dark:text-white">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.totalCandidates}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Candidates in all rooms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Votes per Room */}
        <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Votes per Room</CardTitle>
            <CardDescription>Top 5 voting rooms by vote count</CardDescription>
          </CardHeader>
          <CardContent>
            {roomVotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-center text-slate-500 dark:text-slate-400">
                  No voting data available yet
                </p>
                <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-1">
                  Create a voting room to see statistics
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={roomVotes}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#cbd5e1"
                  />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <Tooltip />
                  <Bar 
                    dataKey="votes" 
                    fill="#f97316" 
                    radius={[8, 8, 0, 0]}
                    name="Total Votes"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - Room Status */}
        <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Room Status Distribution</CardTitle>
            <CardDescription>Active vs Closed voting rooms</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 || statusData.every(d => d.value === 0) ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Vote className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-center text-slate-500 dark:text-slate-400">
                  No rooms created yet
                </p>
                <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-1">
                  Start by creating your first voting room
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: PieLabelRenderProps) => `${props.name}: ${props.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}