'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
// import { DashboardLayout } from '@/components/dashboard/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface User {
  id: string
  email: string
  role: 'admin' | 'member'
}

interface Candidate {
  name: string
  description: string
  image_url: string
}

export default function CreateRoomPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [roomCount, setRoomCount] = useState<number>(0)
  
  // Form state
  const [title, setTitle] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [candidates, setCandidates] = useState<Candidate[]>([
    { name: '', description: '', image_url: '' }
  ])

  const router = useRouter()
  // const { toast } = useToast()

  useEffect(() => {
    const checkUser = async (): Promise<void> => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (!userData) {
        router.push('/auth/login')
        return
      }

      setUser(userData)

      // Check room count
      const { data: rooms } = await supabase
        .from('voting_rooms')
        .select('id')
        .eq('created_by', userData.id)

      setRoomCount(rooms?.length || 0)
      setLoading(false)
    }

    checkUser()
  }, [router])

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
    setCandidates(candidates.filter((_, i) => i !== index))
  }

  const updateCandidate = (index: number, field: keyof Candidate, value: string): void => {
    const updated = [...candidates]
    updated[index][field] = value
    setCandidates(updated)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    
    if (roomCount >= 3) {
      toast.error('Room limit reached. Delete an existing room to create a new one.')
      return
    }

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
      // Create room
      const { data: room, error: roomError } = await supabase
        .from('voting_rooms')
        .insert({
          title: title.trim(),
          description: description.trim(),
          created_by: user!.id,
          status: 'active',
        })
        .select()
        .single()

      if (roomError) throw roomError

      // Create candidates
      const candidatesData = validCandidates.map(c => ({
        room_id: room.id,
        name: c.name.trim(),
        description: c.description.trim(),
        image_url: c.image_url.trim() || null,
        vote_count: 0,
      }))

      const { error: candidatesError } = await supabase
        .from('candidates')
        .insert(candidatesData)

      if (candidatesError) throw candidatesError

      toast.success('Voting Room Created Successfully')

      router.push('/dashboard/my-rooms')
    } catch (error) {
      console.error('Error creating room:', error)
      toast.error('Failed to create Voting Room')
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

  if (!user) return null

  return (
    // <DashboardLayout
    //   userRole={user.role}
    //   userName={user.email?.split('@')[0] || 'User'}
    //   userEmail={user.email || ''}
    // >
      <div className="max-w-4xl mx-auto space-y-6">
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
            Create Voting Room
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Set up a new voting room with candidates
          </p>
        </div>

        {/* Room Limit Warning */}
        {roomCount >= 3 && (
          <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Limit Reached:</strong> You have reached the maximum of 3 rooms. Delete an existing room to create a new one.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Details */}
          <Card>
            <CardHeader>
              <CardTitle>Room Details</CardTitle>
              <CardDescription>Basic information about your voting room</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Room Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Class President Election 2024"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={submitting || roomCount >= 3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose of this voting room..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  disabled={submitting || roomCount >= 3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Candidates */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Candidates</CardTitle>
                  <CardDescription>Add candidates for this voting room (min: 2, max: 10)</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCandidate}
                  disabled={submitting || roomCount >= 3 || candidates.length >= 10}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Candidate
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {candidates.map((candidate, index) => (
                <div key={index} className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      Candidate {index + 1}
                    </h4>
                    {candidates.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCandidate(index)}
                        disabled={submitting || roomCount >= 3}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Candidate Name *</Label>
                    <Input
                      placeholder="Enter candidate name"
                      value={candidate.name}
                      onChange={(e) => updateCandidate(index, 'name', e.target.value)}
                      required
                      disabled={submitting || roomCount >= 3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Brief description about the candidate"
                      value={candidate.description}
                      onChange={(e) => updateCandidate(index, 'description', e.target.value)}
                      rows={2}
                      disabled={submitting || roomCount >= 3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Image URL (Optional)</Label>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={candidate.image_url}
                      onChange={(e) => updateCandidate(index, 'image_url', e.target.value)}
                      disabled={submitting || roomCount >= 3}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Paste a direct link to the candidates photo
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={submitting || roomCount >= 3}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {submitting ? 'Creating...' : 'Create Voting Room'}
            </Button>
            <Link href="/dashboard/my-rooms">
              <Button type="button" variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    // </DashboardLayout>
  )
}