'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Copy, Share2, Trophy, Loader2, Calendar, User } from 'lucide-react'
// import { useToast } from '@/components/ui/use-toast'
import { toast } from 'sonner'
import Link from 'next/link'

// Interface untuk room
interface Room {
  id: string
  title: string
  description: string | null
  status: 'active' | 'closed'
  created_at: string
  created_by: string
  users: {
    email: string
  } | null
}

// Interface untuk candidate dengan vote count
interface Candidate {
  id: string
  name: string
  description: string | null
  image_url: string | null
  vote_count: number
}

export default function RoomDetailPage() {
  const params = useParams()
  const router = useRouter()
  // const { toast } = useToast()
  const roomId = params.id as string

  const [room, setRoom] = useState<Room | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [totalVotes, setTotalVotes] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    loadRoomDetails()
  }, [roomId])

  const loadRoomDetails = async (): Promise<void> => {
    try {
      // 1. Load room data
      const { data: roomData, error: roomError } = await supabase
        .from('voting_rooms')
        .select('*, users(email)')
        .eq('id', roomId)
        .single()

      if (roomError) throw roomError
      setRoom(roomData)

      // 2. Load candidates
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .eq('room_id', roomId)
        .order('vote_count', { ascending: false })

      if (candidatesError) throw candidatesError

      // 3. Hitung vote count untuk setiap candidate dari table votes
      const candidatesWithVotes = await Promise.all(
        (candidatesData || []).map(async (candidate) => {
          const { count } = await supabase
            .from('votes')
            .select('id', { count: 'exact', head: true })
            .eq('candidate_id', candidate.id)

          return {
            ...candidate,
            vote_count: count || 0
          }
        })
      )

      // Sort by vote_count descending
      candidatesWithVotes.sort((a, b) => b.vote_count - a.vote_count)

      setCandidates(candidatesWithVotes)

      // 4. Hitung total votes
      const total = candidatesWithVotes.reduce((sum, c) => sum + c.vote_count, 0)
      setTotalVotes(total)

    } catch (error) {
      console.error('Error loading room details:', error)
      toast.error('Failed to load room details')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = (): void => {
    const link = `${window.location.origin}/vote/${roomId}`
    navigator.clipboard.writeText(link)
    toast.success('Voting Link Copied to Clipboard')
  }

  // Hitung percentage untuk setiap candidate
  const getPercentage = (votes: number): number => {
    if (totalVotes === 0) return 0
    return Math.round((votes / totalVotes) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  if (!room) return null

  // Cari winner (candidate dengan vote terbanyak)
  const winner = candidates.length > 0 ? candidates[0] : null

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/rooms">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Rooms
        </Button>
      </Link>

      {/* Room Header */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{room.title}</CardTitle>
                <Badge variant={room.status === 'active' ? 'default' : 'secondary'}>
                  {room.status}
                </Badge>
              </div>
              <CardDescription className="text-base">
                {room.description || 'No description provided'}
              </CardDescription>
            </div>
            <Button
              onClick={handleCopyLink}
              className="bg-orange-500 hover:bg-orange-600 gap-2 shrink-0"
            >
              <Share2 className="w-4 h-4" />
              Share Link
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Created {new Date(room.created_at).toLocaleDateString('id-ID')}</span>
            </div>
            {room.users?.email && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>By {room.users.email}</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              Voting Link
            </p>
            <div className="flex items-center gap-2">
              <code className="text-sm text-slate-900 dark:text-white break-all">
                {`${window.location.origin}/vote/${roomId}`}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voting Results */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Voting Results</span>
            <span className="text-base font-normal text-slate-600 dark:text-slate-400">
              {totalVotes} total votes
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {candidates.length === 0 ? (
            <p className="text-center py-8 text-slate-500 dark:text-slate-400">
              No candidates added yet
            </p>
          ) : (
            candidates.map((candidate, index) => {
              const percentage = getPercentage(candidate.vote_count)
              const isWinner = index === 0 && candidate.vote_count > 0

              return (
                <div
                  key={candidate.id}
                  className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3"
                >
                  <div className="flex items-start gap-4">
                    {/* Candidate Image/Avatar */}
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                      {candidate.image_url ? (
                        <img
                          src={candidate.image_url}
                          alt={candidate.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        candidate.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Candidate Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {candidate.name}
                        </h3>
                        {isWinner && (
                          <Trophy className="w-5 h-5 text-yellow-500" />
                        )}
                      </div>
                      {candidate.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {candidate.description}
                        </p>
                      )}
                    </div>

                    {/* Vote Count */}
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {candidate.vote_count}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        votes
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        {percentage}%
                      </span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2"
                    />
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}