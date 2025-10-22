export interface User {
  id: string
  email: string
  role: 'admin' | 'member'
  created_at: string
}

export interface VotingRoom {
  id: string
  title: string
  description: string
  created_by: string
  status: 'active' | 'closed'
  created_at: string
  updated_at: string
}

export interface Candidate {
  id: string
  room_id: string
  name: string
  description: string
  image_url: string | null
  vote_count: number
  created_at: string
}

export interface Vote {
  id: string
  room_id: string
  candidate_id: string
  voter_id: string
  created_at: string
}