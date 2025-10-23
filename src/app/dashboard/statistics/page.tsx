'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Interface untuk data chart
interface RoomVoteData {
  name: string
  votes: number
}

interface StatusData {
  name: string
  value: number
}

export default function StatisticsPage() {
  const [loading, setLoading] = useState<boolean>(true)
  const [roomVotes, setRoomVotes] = useState<RoomVoteData[]>([])
  const [statusData, setStatusData] = useState<StatusData[]>([])

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async (): Promise<void> => {
    try {
      // 1. Load voting rooms dengan vote count
      const { data: rooms } = await supabase
        .from('voting_rooms')
        .select('id, title')
        .limit(5)

      if (rooms) {
        // Untuk setiap room, hitung total votes
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
      const { count: activeCount } = await supabase
        .from('voting_rooms')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')

      const { count: closedCount } = await supabase
        .from('voting_rooms')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'closed')

      setStatusData([
        { name: 'Active', value: activeCount || 0 },
        { name: 'Closed', value: closedCount || 0 }
      ])

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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Votes per Room */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Votes per Room</CardTitle>
            <CardDescription>Number of votes in each voting room</CardDescription>
          </CardHeader>
          <CardContent>
            {roomVotes.length === 0 ? (
              <p className="text-center py-12 text-slate-500 dark:text-slate-400">
                No voting data available yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={roomVotes}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis tick={{ fill: 'currentColor' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="votes" fill="#f97316" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - Room Status */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Room Status Distribution</CardTitle>
            <CardDescription>Active vs Closed voting rooms</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.every(d => d.value === 0) ? (
              <p className="text-center py-12 text-slate-500 dark:text-slate-400">
                No rooms created yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}