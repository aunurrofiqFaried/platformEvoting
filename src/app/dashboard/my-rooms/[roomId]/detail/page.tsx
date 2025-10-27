'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, AlertCircle, Users, CheckCircle2, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface VotingRoom {
  id: string
  title: string
  description: string | null
  status: 'active' | 'closed'
  created_at: string
  created_by: string
}

interface Candidate {
  id: string
  name: string
  vote_count: number
}

interface Vote {
  id: string
  user_id: string
  candidate_id: string
  created_at: string
  users: {
    email: string
  } | null
  candidates: {
    name: string
  } | null
}

export default function MyRoomDetailPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string

  const [room, setRoom] = useState<VotingRoom | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalVotes, setTotalVotes] = useState(0)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        loadRoomDetails(user.id)
      }
    }
    checkAuth()
  }, [roomId])

  const loadRoomDetails = async (currentUserId: string) => {
    try {
      setLoading(true)
      setError(null)

      // Load room
      const { data: roomData, error: roomError } = await supabase
        .from('voting_rooms')
        .select('*')
        .eq('id', roomId)
        .eq('created_by', currentUserId)
        .single()

      if (roomError) throw new Error('Room not found or you do not have permission')
      setRoom(roomData)

      // Load candidates with vote counts
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select('id, name, vote_count')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (candidatesError) throw candidatesError
      setCandidates(candidatesData || [])

      // Load all votes with user and candidate info
      const { data: votesRawData, error: votesError } = await supabase
        .from('votes')
        .select(`
          id,
          user_id,
          candidate_id,
          created_at,
          users (
            email
          ),
          candidates (
            name
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })

      if (votesError) throw votesError
      
      // Transform data to match Vote interface
      const transformedVotes: Vote[] = (votesRawData || []).map((item) => ({
        id: item.id,
        user_id: item.user_id,
        candidate_id: item.candidate_id,
        created_at: item.created_at,
        users: Array.isArray(item.users) ? item.users[0] : item.users,
        candidates: Array.isArray(item.candidates) ? item.candidates[0] : item.candidates
      }))
      
      setVotes(transformedVotes)

      // Calculate total votes
      const total = candidatesData?.reduce((sum, c) => sum + c.vote_count, 0) || 0
      setTotalVotes(total)
    } catch (err) {
      console.error('Error loading room details:', err)
      setError(err instanceof Error ? err.message : 'Failed to load room details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Room not found'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const leadingCandidate = candidates.length > 0
    ? candidates.reduce((prev, current) =>
        current.vote_count > prev.vote_count ? current : prev
      )
    : null

  const chartData = candidates.map(c => ({
    name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
    votes: c.vote_count,
    percentage: totalVotes > 0 ? ((c.vote_count / totalVotes) * 100).toFixed(1) : '0',
    fullName: c.name,
    isLeading: c.id === leadingCandidate?.id
  }))

  const uniqueVoters = new Set(votes.map(v => v.user_id)).size

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="mb-4 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {room.title}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              {room.description}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                room.status === 'active'
                  ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {room.status}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="dark:bg-slate-900">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Votes</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                    {totalVotes}
                  </p>
                </div>
                <BarChart3 className="w-10 h-10 text-orange-500 opacity-20" />
              </div>
            </div>
          </Card>

          <Card className="dark:bg-slate-900">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Unique Voters</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                    {uniqueVoters}
                  </p>
                </div>
                <Users className="w-10 h-10 text-blue-500 opacity-20" />
              </div>
            </div>
          </Card>

          <Card className="dark:bg-slate-900">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Candidates</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                    {candidates.length}
                  </p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-500 opacity-20" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2">
            <Card className="dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="dark:text-white">Voting Results</CardTitle>
                <CardDescription>Vote distribution by candidate</CardDescription>
              </CardHeader>
              <CardContent>
                {candidates.length === 0 || totalVotes === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-600 dark:text-slate-400">No votes yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value) => `${value} votes`}
                      />
                      <Bar dataKey="votes" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.isLeading ? '#f97316' : '#94a3b8'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            {leadingCandidate && (
              <Card className="border-orange-200 dark:border-orange-800 dark:bg-slate-900 bg-orange-50">
                <div className="p-6">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-2">
                    Leading
                  </p>
                  <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                    {leadingCandidate.name}
                  </h3>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {totalVotes > 0
                      ? ((leadingCandidate.vote_count / totalVotes) * 100).toFixed(1)
                      : '0'}
                    %
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-2">
                    {leadingCandidate.vote_count} votes
                  </p>
                </div>
              </Card>
            )}

            <Card className="dark:bg-slate-900">
              <div className="p-6">
                <h4 className="font-semibold mb-4 dark:text-white">Vote Breakdown</h4>
                <div className="space-y-3">
                  {chartData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: item.isLeading ? '#f97316' : '#94a3b8'
                          }}
                        />
                        <span className="text-sm font-medium dark:text-white">
                          {item.fullName.length > 15
                            ? item.fullName.substring(0, 15) + '...'
                            : item.fullName}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                          {item.percentage}%
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                          {item.votes}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Voters List */}
        <Card className="dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="dark:text-white">Voting History</CardTitle>
            <CardDescription>List of voters and their choices</CardDescription>
          </CardHeader>
          <CardContent>
            {votes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600 dark:text-slate-400">No votes yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        Voter
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        Voted For
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {votes.map((vote) => (
                      <tr
                        key={vote.id}
                        className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <td className="py-3 px-4 text-slate-900 dark:text-white">
                          {vote.users?.email || 'Unknown'}
                        </td>
                        <td className="py-3 px-4 text-slate-900 dark:text-white font-medium">
                          {vote.candidates?.name || 'Unknown'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {new Date(vote.created_at).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}