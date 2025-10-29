'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ImageUploader } from '@/components/imageUploader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Loader2, Plus, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface User {
  id: string
  email: string
  role: 'admin' | 'member'
}

interface Candidate {
  id?: string
  name: string
  description: string
  image_url: string
}

interface Room {
  id: string
  title: string
  description: string
  created_by: string
  status: string
}

export default function EditRoomPage() {
  const params = useParams()
  const roomId = params.id as string
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [title, setTitle] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [candidates, setCandidates] = useState<Candidate[]>([
    { name: '', description: '', image_url: '' }
  ])
  const [deletedCandidateIds, setDeletedCandidateIds] = useState<string[]>([])

  const router = useRouter()

  useEffect(() => {
    const loadRoomData = async (): Promise<void> => {
      try {
        setError(null)

        // Small delay untuk ensure localStorage ready
        await new Promise(resolve => setTimeout(resolve, 50))

        // Check localStorage dulu
        let userId = localStorage.getItem('userId')
        let userEmail = localStorage.getItem('userEmail')
        let userRole = localStorage.getItem('userRole') as 'admin' | 'member' | null

        console.log('Edit room auth check:', { hasAuth: !!userId, role: userRole })

        // Fallback ke Supabase Auth
        if (!userId || !userRole) {
          const { data: { user: authUser } } = await supabase.auth.getUser()
          
          if (!authUser) {
            router.push('/auth/login')
            return
          }

          userId = authUser.id
          userEmail = authUser.email || ''

          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single()

          if (!userData) {
            router.push('/auth/login')
            return
          }

          userRole = userData.role
          setUser(userData)
        } else {
          setUser({
            id: userId,
            email: userEmail || '',
            role: userRole
          })
        }

        console.log('Loading room:', roomId, 'for user:', userId)

        // Load room data - simple query
        const { data: roomData, error: roomError } = await supabase
          .from('voting_rooms')
          .select('id, title, description, created_by, status')
          .eq('id', roomId)
          .single()

        if (roomError || !roomData) {
          console.error('Room load error:', roomError)
          const errorMsg = roomError?.message || 'Room not found'
          setError(`Failed to load room: ${errorMsg}`)
          toast.error(errorMsg)
          setTimeout(() => router.push('/dashboard/my-rooms'), 1500)
          return
        }

        console.log('Room loaded:', roomData)

        // Check if user is the owner
        if (roomData.created_by !== userId) {
          setError('You do not have permission to edit this room')
          toast.error('You do not have permission to edit this room')
          setTimeout(() => router.push('/dashboard/my-rooms'), 1500)
          return
        }

        setTitle(roomData.title || '')
        setDescription(roomData.description || '')

        // Load candidates
        const { data: candidatesData, error: candidatesError } = await supabase
          .from('candidates')
          .select('id, name, description, image_url')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true })

        if (candidatesError) {
          console.error('Candidates load error:', candidatesError)
        } else if (candidatesData && candidatesData.length > 0) {
          console.log('Candidates loaded:', candidatesData.length)
          setCandidates(candidatesData.map(c => ({
            id: c.id,
            name: c.name || '',
            description: c.description || '',
            image_url: c.image_url || ''
          })))
        }

        setLoading(false)
      } catch (err) {
        console.error('Error loading room data:', err)
        const errorMsg = err instanceof Error ? err.message : 'Failed to load room'
        setError(errorMsg)
        toast.error(errorMsg)
        setLoading(false)
      }
    }

    if (roomId) {
      loadRoomData()
    }
  }, [router, roomId])

  const addCandidate = (): void => {
    if (candidates.length >= 10) {
      toast.error('Maximum of 10 candidates allowed')
      return
    }
    setCandidates([...candidates, { name: '', description: '', image_url: '' }])
  }

  const removeCandidate = (index: number): void => {
    if (candidates.length <= 1) {
      toast.error('At least one candidate is required')
      return
    }
    
    const candidate = candidates[index]
    if (candidate.id) {
      setDeletedCandidateIds([...deletedCandidateIds, candidate.id])
    }
    
    setCandidates(candidates.filter((_, i) => i !== index))
  }

  const updateCandidate = (index: number, field: keyof Candidate, value: string): void => {
    const updated = [...candidates]
    updated[index][field] = value
    setCandidates(updated)
  }

  const handleImageUploaded = (index: number, url: string): void => {
    updateCandidate(index, 'image_url', url)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()

    // Validation
    if (!title.trim()) {
      toast.error('Room title is required')
      return
    }

    const validCandidates = candidates.filter(c => c.name.trim())
    if (validCandidates.length < 2) {
      toast.error('At least two candidates with names are required')
      return
    }

    setSubmitting(true)

    try {
      // Update room
      const { error: roomError } = await supabase
        .from('voting_rooms')
        .update({
          title: title.trim(),
          description: description.trim(),
        })
        .eq('id', roomId)

      if (roomError) {
        console.error('Room update error:', roomError)
        throw roomError
      }

      // Delete removed candidates
      if (deletedCandidateIds.length > 0) {
        console.log('Deleting candidates:', deletedCandidateIds)
        const { error: deleteError } = await supabase
          .from('candidates')
          .delete()
          .in('id', deletedCandidateIds)

        if (deleteError) {
          console.error('Delete candidates error:', deleteError)
          throw deleteError
        }
      }

      // Update or insert candidates
      for (const candidate of validCandidates) {
        if (candidate.id) {
          // Update existing candidate
          console.log('Updating candidate:', candidate.id)
          const { error: updateError } = await supabase
            .from('candidates')
            .update({
              name: candidate.name.trim(),
              description: candidate.description.trim(),
              image_url: candidate.image_url.trim() || null,
            })
            .eq('id', candidate.id)

          if (updateError) {
            console.error('Update candidate error:', updateError)
            throw updateError
          }
        } else {
          // Insert new candidate
          console.log('Inserting new candidate:', candidate.name)
          const { error: insertError } = await supabase
            .from('candidates')
            .insert({
              room_id: roomId,
              name: candidate.name.trim(),
              description: candidate.description.trim(),
              image_url: candidate.image_url.trim() || null,
              vote_count: 0,
            })

          if (insertError) {
            console.error('Insert candidate error:', insertError)
            throw insertError
          }
        }
      }

      toast.success('Voting Room Updated Successfully')
      router.push('/dashboard/my-rooms')
    } catch (error) {
      console.error('Error updating room:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to update Voting Room'
      toast.error(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 p-4">
        <Link href="/dashboard/my-rooms">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to My Rooms
          </Button>
        </Link>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Back Button */}
      <Link href="/dashboard/my-rooms">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to My Rooms
        </Button>
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Edit Voting Room
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Update your voting room details and candidates
        </p>
      </div>

      {/* Debug Info - Development only */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
          <CardContent className="pt-6">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              Debug: userId={user.id}, candidates={candidates.length}, deletedIds={deletedCandidateIds.length}
            </p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Room Details */}
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="dark:text-white">Room Details</CardTitle>
            <CardDescription>Basic information about your voting room</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="dark:text-slate-200">Room Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Class President Election 2024"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={submitting}
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="dark:text-slate-200">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose of this voting room..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                disabled={submitting}
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Candidates */}
        <Card className="dark:bg-slate-900 dark:border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="dark:text-white">Candidates</CardTitle>
                <CardDescription>Add or update candidates for this voting room (min: 2, max: 10)</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCandidate}
                disabled={submitting || candidates.length >= 10}
                className="gap-2 dark:border-slate-600 dark:text-white"
              >
                <Plus className="w-4 h-4" />
                Add Candidate
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {candidates.map((candidate, index) => (
              <div key={candidate.id || index} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-900 dark:text-white">
                    Candidate {index + 1} {candidate.id && <span className="text-xs text-slate-500">(Existing)</span>}
                  </h4>
                  {candidates.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCandidate(index)}
                      disabled={submitting}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="dark:text-slate-200">Candidate Name *</Label>
                  <Input
                    placeholder="Enter candidate name"
                    value={candidate.name}
                    onChange={(e) => updateCandidate(index, 'name', e.target.value)}
                    required
                    disabled={submitting}
                    className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="dark:text-slate-200">Description</Label>
                  <Textarea
                    placeholder="Brief description about the candidate"
                    value={candidate.description}
                    onChange={(e) => updateCandidate(index, 'description', e.target.value)}
                    rows={2}
                    disabled={submitting}
                    className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>

                {/* Image Uploader */}
                <ImageUploader
                  roomId={roomId}
                  onImageUploaded={(url) => handleImageUploaded(index, url)}
                  disabled={submitting}
                  existingUrl={candidate.image_url}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {submitting ? 'Updating...' : 'Update Voting Room'}
          </Button>
          <Link href="/dashboard/my-rooms">
            <Button type="button" variant="outline" disabled={submitting} className="dark:border-slate-600 dark:text-white">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}