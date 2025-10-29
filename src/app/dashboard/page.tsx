'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCard } from '@/components/dashboard/stat-card'
import { Users, Vote, BarChart3, TrendingUp, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DashboardStats {
  totalMembers: number
  totalRooms: number
  activeRooms: number
  totalVotes: number
  myRooms?: number
  myVotes?: number
}

interface RecentRoom {
  id: string
  title: string
  description: string | null
  created_by: string
  status: 'active' | 'closed'
  created_at: string
  updated_at: string
  users: {
    email: string
  } | null
}

interface VoteData {
  date: string
  votes: number
}

interface RoomStatusData {
  name: string
  value: number
  [key: string]: string | number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    totalRooms: 0,
    activeRooms: 0,
    totalVotes: 0,
    myRooms: 0,
    myVotes: 0,
  })
  
  const [userRole, setUserRole] = useState<'admin' | 'member' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([])
  const [votingActivityData, setVotingActivityData] = useState<VoteData[]>([])
  const [roomStatusData, setRoomStatusData] = useState<RoomStatusData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async (): Promise<void> => {
    try {
      setError(null)
      
      // Small delay untuk ensure localStorage ready
      await new Promise(resolve => setTimeout(resolve, 50))

      // Check dari localStorage dulu (email/password)
      let currentUserId = localStorage.getItem('userId')
      let currentUserRole = localStorage.getItem('userRole') as 'admin' | 'member' | null

      console.log('Dashboard auth check:', { 
        hasLocalStorageAuth: !!currentUserId,
        userRole: currentUserRole 
      })

      // Fallback ke Supabase Auth jika tidak ada di localStorage
      if (!currentUserId || !currentUserRole) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.log('No user found')
          setLoading(false)
          return
        }

        currentUserId = user.id
        setUserId(user.id)

        // Get user role dari database
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (userData) {
          currentUserRole = userData.role
          setUserRole(userData.role)
        }
      } else {
        setUserId(currentUserId)
        setUserRole(currentUserRole)
      }

      console.log('Loading dashboard for:', { currentUserId, currentUserRole })

      if (currentUserRole === 'admin') {
        // ADMIN: Load all stats
        console.log('Loading admin stats...')
        const [membersResult, roomsResult, activeRoomsResult, votesResult] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('voting_rooms').select('id', { count: 'exact', head: true }),
          supabase.from('voting_rooms').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('votes').select('id', { count: 'exact', head: true }),
        ])

        console.log('Admin stats:', {
          totalMembers: membersResult.count,
          totalRooms: roomsResult.count,
          activeRooms: activeRoomsResult.count,
          totalVotes: votesResult.count,
        })

        setStats({
          totalMembers: membersResult.count || 0,
          totalRooms: roomsResult.count || 0,
          activeRooms: activeRoomsResult.count || 0,
          totalVotes: votesResult.count || 0,
        })

        // Load recent rooms - SIMPLE QUERY tanpa JOIN
        const { data: rooms, error: roomsError } = await supabase
          .from('voting_rooms')
          .select('id, title, description, created_by, status, created_at, updated_at')
          .order('created_at', { ascending: false })
          .limit(5)

        if (roomsError) {
          console.error('Error loading admin rooms:', roomsError)
          setError(`Cannot load rooms: ${roomsError.message}`)
        } else {
          console.log('Admin recent rooms:', rooms?.length)
          setRecentRooms((rooms?.map(r => ({ ...r, users: null })) as RecentRoom[]) || [])
        }

        // Load voting activity (votes per day for last 7 days)
        const { data: allVotes } = await supabase
          .from('votes')
          .select('created_at')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: true })

        // Group votes by date
        const votesPerDay: { [key: string]: number } = {}
        allVotes?.forEach((vote) => {
          const date = new Date(vote.created_at).toLocaleDateString('id-ID', {
            month: 'short',
            day: 'numeric'
          })
          votesPerDay[date] = (votesPerDay[date] || 0) + 1
        })

        const chartData = Object.entries(votesPerDay).map(([date, votes]) => ({
          date,
          votes
        }))
        setVotingActivityData(chartData)

        // Load room status
        const closedCount = (roomsResult.count || 0) - (activeRoomsResult.count || 0)
        setRoomStatusData([
          { name: 'Active', value: activeRoomsResult.count || 0 },
          { name: 'Closed', value: closedCount }
        ])
      } else {
        // MEMBER: Load only personal stats
        console.log('Loading member stats for user:', currentUserId)
        const [myRoomsResult, activeMyRoomsResult, myVotesResult] = await Promise.all([
          supabase
            .from('voting_rooms')
            .select('id', { count: 'exact', head: true })
            .eq('created_by', currentUserId!),
          supabase
            .from('voting_rooms')
            .select('id', { count: 'exact', head: true })
            .eq('created_by', currentUserId!)
            .eq('status', 'active'),
          supabase
            .from('votes')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', currentUserId!),
        ])

        console.log('Member stats:', {
          myRooms: myRoomsResult.count,
          activeRooms: activeMyRoomsResult.count,
          myVotes: myVotesResult.count,
        })

        setStats({
          totalMembers: 0,
          totalRooms: myRoomsResult.count || 0,
          activeRooms: activeMyRoomsResult.count || 0,
          totalVotes: myVotesResult.count || 0,
          myRooms: myRoomsResult.count || 0,
          myVotes: myVotesResult.count || 0,
        })

        // Load member's rooms - SIMPLE QUERY tanpa JOIN
        console.log('Fetching member rooms for:', currentUserId)
        
        const { data: rooms, error: roomsError } = await supabase
          .from('voting_rooms')
          .select('id, title, description, created_by, status, created_at, updated_at')
          .eq('created_by', currentUserId!)
          .order('created_at', { ascending: false })
          .limit(5)

        if (roomsError) {
          console.error('Query error:', {
            code: roomsError.code,
            message: roomsError.message,
            details: roomsError.details,
          })
          setError(`Query error: ${roomsError.message}`)
        } else {
          console.log('Query success, member rooms:', rooms?.length)
          setRecentRooms((rooms?.map(r => ({ ...r, users: null })) as RecentRoom[]) || [])
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  const COLORS = ['#f97316', '#64748b']

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          {userRole === 'admin' 
            ? 'Monitor and manage your e-voting platform' 
            : 'Welcome back! Here is your voting activity overview'}
        </p>
      </div>

      {/* Debug Info - Remove in production */}
      {/* {process.env.NODE_ENV === 'development' && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
          <CardContent className="pt-6">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              Debug: userId={userId}, role={userRole}, rooms={stats.totalRooms}, error={error || 'none'}
            </p>
          </CardContent>
        </Card>
      )} */}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {userRole === 'admin' ? (
          // ADMIN STATS
          <>
            <StatsCard
              title="Total Members"
              value={stats.totalMembers || 0}
              icon={Users}
              description="Registered users"
              color="blue"
            />
            <StatsCard
              title="Total Rooms"
              value={stats.totalRooms || 0}
              icon={Vote}
              description="All voting rooms"
              color="green"
            />
            <StatsCard
              title="Active Rooms"
              value={stats.activeRooms || 0}
              icon={TrendingUp}
              description="Currently running"
              color="orange"
            />
            <StatsCard
              title="Total Votes"
              value={stats.totalVotes || 0}
              icon={BarChart3}
              description="All time votes"
              color="purple"
            />
          </>
        ) : (
          // MEMBER STATS
          <>
            <StatsCard
              title="My Rooms"
              value={stats.myRooms || 0}
              icon={Vote}
              description="Rooms created"
              color="blue"
            />
            <StatsCard
              title="Active Rooms"
              value={stats.activeRooms || 0}
              icon={TrendingUp}
              description="Currently running"
              color="green"
            />
            <StatsCard
              title="My Votes"
              value={stats.myVotes || 0}
              icon={BarChart3}
              description="Votes cast"
              color="orange"
            />
            <StatsCard
              title="Total Votes"
              value={stats.totalVotes || 0}
              icon={Vote}
              description="All time votes"
              color="purple"
            />
          </>
        )}
      </div>

      {/* Charts Row - For Admin Only */}
      {userRole === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Voting Activity Chart */}
          <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">Voting Activity</CardTitle>
              <CardDescription>Vote distribution over last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {votingActivityData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">
                  No voting data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={votingActivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="votes" 
                      stroke="#f97316" 
                      strokeWidth={2}
                      dot={{ fill: '#f97316' }}
                      name="Votes"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Room Status Chart */}
          <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">Room Status</CardTitle>
              <CardDescription>Active vs Closed rooms</CardDescription>
            </CardHeader>
            <CardContent>
              {roomStatusData.length === 0 || roomStatusData.every(d => d.value === 0) ? (
                <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">
                  No rooms created yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roomStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {roomStatusData.map((entry, index) => (
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
      )}

      {/* Recent Rooms */}
      <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg dark:text-white">
                {userRole === 'admin' ? 'Recent Voting Rooms' : 'My Voting Rooms'}
              </CardTitle>
              <CardDescription>
                {userRole === 'admin' ? 'Latest voting rooms in the system' : 'Rooms you created'}
              </CardDescription>
            </div>
            {userRole === 'admin' && (
              <Link href="/dashboard/rooms">
                <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-white">
                  View All
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recentRooms.length === 0 ? (
            <p className="text-center py-8 text-slate-500 dark:text-slate-400">
              {userRole === 'admin' ? 'No rooms created yet' : 'You haven\'t created any rooms yet'}
            </p>
          ) : (
            <div className="space-y-3">
              {recentRooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Vote className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {room.title}
                        </p>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                            room.status === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {room.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Created {new Date(room.created_at).toLocaleDateString('id-ID')}
                        {userRole === 'admin' && room.users?.email && ` • by ${room.users.email}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {room.status === 'active' && userRole === 'member' ? (
                      <Link href={`/vote/${room.id}`}>
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white dark:text-white">
                          Vote
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/dashboard/rooms/${room.id}`}>
                        <Button variant="ghost" size="sm" className="dark:text-white">
                          {room.status === 'active' ? 'Manage' : 'View Results'}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions - For Member */}
      {userRole === 'member' && (
        <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">Quick Actions</CardTitle>
            <CardDescription>Get started with voting</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard/create-room" className="flex-1">
              <Button className="w-full bg-orange-500 hover:bg-orange-600">
                <Vote className="w-4 h-4 mr-2" />
                Create New Room
              </Button>
            </Link>
            <Link href="/dashboard/my-rooms" className="flex-1">
              <Button variant="outline" className="w-full dark:border-slate-600 dark:text-white">
                View All My Rooms
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}