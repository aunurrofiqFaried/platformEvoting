'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Copy, Share2, Trophy, Loader2, Calendar, User, AlertCircle } from 'lucide-react'
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRoomDetails()
  }, [roomId])

  const loadRoomDetails = async (): Promise<void> => {
    try {
      setError(null)
      console.log('Loading room details for:', roomId)

      // 1. Load room data - simple query tanpa JOIN dulu
      const { data: roomData, error: roomError } = await supabase
        .from('voting_rooms')
        .select('id, title, description, status, created_at, created_by')
        .eq('id', roomId)
        .single()

      if (roomError) {
        console.error('Room query error:', roomError)
        throw new Error(`Room not found: ${roomError.message}`)
      }

      console.log('Room loaded:', roomData)
      setRoom(roomData as Room)

      // 2. Load candidates
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (candidatesError) {
        console.error('Candidates query error:', candidatesError)
        throw new Error(`Failed to load candidates: ${candidatesError.message}`)
      }

      console.log('Candidates loaded:', candidatesData?.length)

      if (!candidatesData || candidatesData.length === 0) {
        setCandidates([])
        setTotalVotes(0)
        setLoading(false)
        return
      }

      // 3. Hitung vote count untuk setiap candidate dari table votes
      const candidatesWithVotes = await Promise.all(
        (candidatesData || []).map(async (candidate) => {
          const { count, error: countError } = await supabase
            .from('votes')
            .select('id', { count: 'exact', head: true })
            .eq('candidate_id', candidate.id)

          if (countError) {
            console.error('Vote count error for candidate', candidate.id, countError)
            return {
              ...candidate,
              vote_count: 0
            }
          }

          return {
            ...candidate,
            vote_count: count || 0
          }
        })
      )

      // Sort by vote_count descending
      candidatesWithVotes.sort((a, b) => b.vote_count - a.vote_count)

      console.log('Candidates with votes:', candidatesWithVotes)
      setCandidates(candidatesWithVotes)

      // 4. Hitung total votes
      const total = candidatesWithVotes.reduce((sum, c) => sum + c.vote_count, 0)
      console.log('Total votes:', total)
      setTotalVotes(total)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load room details'
      console.error('Error loading room details:', error)
      setError(errorMessage)
      toast.error(errorMessage)
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

  if (error || !room) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        {/* <Link href="/dashboard/my-rooms">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to My Rooms
          </Button>
        </Link> */}
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Room not found'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Cari winner (candidate dengan vote terbanyak)
  const winner = candidates.length > 0 ? candidates[0] : null

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      {/* <Link href="/dashboard/my-rooms">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to My Rooms
        </Button>
      </Link> */}

      {/* Room Header */}
      <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
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
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Creator ID: {room.created_by.substring(0, 8)}...</span>
            </div>
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
      <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
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
                  className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3 dark:bg-slate-800/50"
                >
                  <div className="flex items-start gap-4">
                    {/* Candidate Image/Avatar */}
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden">
                      {candidate.image_url ? (
                        <img
                          src={candidate.image_url}
                          alt={candidate.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        candidate.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Candidate Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {candidate.name}
                        </h3>
                        {isWinner && (
                          <Trophy className="w-5 h-5 text-yellow-500 shrink-0" />
                        )}
                      </div>
                      {candidate.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
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