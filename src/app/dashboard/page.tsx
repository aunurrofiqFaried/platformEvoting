'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCard } from '@/components/dashboard/stat-card'
import { Users, Vote, BarChart3, TrendingUp, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async (): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      // Get user role
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData) {
        setUserRole(userData.role)

        if (userData.role === 'admin') {
          // ADMIN: Load all stats
          const [membersResult, roomsResult, activeRoomsResult, votesResult] = await Promise.all([
            supabase.from('users').select('id', { count: 'exact', head: true }),
            supabase.from('voting_rooms').select('id', { count: 'exact', head: true }),
            supabase.from('voting_rooms').select('id', { count: 'exact', head: true }).eq('status', 'active'),
            supabase.from('votes').select('id', { count: 'exact', head: true }),
          ])

          setStats({
            totalMembers: membersResult.count || 0,
            totalRooms: roomsResult.count || 0,
            activeRooms: activeRoomsResult.count || 0,
            totalVotes: votesResult.count || 0,
          })

          // Load recent rooms (all)
          const { data: rooms } = await supabase
            .from('voting_rooms')
            .select('*, users(email)')
            .order('created_at', { ascending: false })
            .limit(5)

          setRecentRooms(rooms || [])
        } else {
          // MEMBER: Load only personal stats
          const [myRoomsResult, activeMyRoomsResult, myVotesResult] = await Promise.all([
            supabase
              .from('voting_rooms')
              .select('id', { count: 'exact', head: true })
              .eq('created_by', user.id),
            supabase
              .from('voting_rooms')
              .select('id', { count: 'exact', head: true })
              .eq('created_by', user.id)
              .eq('status', 'active'),
            supabase
              .from('votes')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', user.id),
          ])

          setStats({
            totalMembers: 0,
            totalRooms: myRoomsResult.count || 0,
            activeRooms: activeMyRoomsResult.count || 0,
            totalVotes: myVotesResult.count || 0,
            myRooms: myRoomsResult.count || 0,
            myVotes: myVotesResult.count || 0,
          })

          // Load member's rooms
          const { data: rooms } = await supabase
            .from('voting_rooms')
            .select('*, users(email)')
            .eq('created_by', user.id)
            .order('created_at', { ascending: false })
            .limit(5)

          setRecentRooms(rooms || [])
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
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
          {/* Placeholder for Charts */}
          <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">Voting Activity</CardTitle>
              <CardDescription>Vote distribution over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">
                Chart will be implemented with recharts
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">Room Status</CardTitle>
              <CardDescription>Active vs Closed rooms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">
                Pie chart will be here
              </div>
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