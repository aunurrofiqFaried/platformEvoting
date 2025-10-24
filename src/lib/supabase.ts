// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function untuk get current user
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Helper untuk fetch voting room dengan candidates
export async function getVotingRoomWithCandidates(roomId: string) {
  const { data, error } = await supabase
    .from('voting_rooms')
    .select(
      `
      *,
      candidates(*)
    `
    )
    .eq('id', roomId)
    .single();

  if (error) throw error;
  return data;
}

// Helper untuk cek apakah user sudah vote
export async function checkUserVoted(roomId: string, userId: string) {
  const { data, error } = await supabase
    .from('votes')
    .select('id')
    .eq('room_id', roomId)
    .eq('voter_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    return false; // Belum vote
  }
  if (error) throw error;
  return true; // Sudah vote
}

// Helper untuk submit vote
export async function submitVote(
  roomId: string,
  candidateId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from('votes')
    .insert({
      room_id: roomId,
      candidate_id: candidateId,
      voter_id: userId,
    })
    .select();

  if (error) throw error;
  return data;
}

// Helper untuk get vote results real-time
export async function getVoteResults(roomId: string) {
  const { data, error } = await supabase
    .from('candidates')
    .select('id, name, image_url, description, vote_count')
    .eq('room_id', roomId)
    .order('vote_count', { ascending: false });

  if (error) throw error;
  return data;
}

// Helper untuk subscribe ke real-time updates
export function subscribeToVoteUpdates(roomId: string, callback: () => void) {
  const subscription = supabase
    .channel(`votes:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'votes',
        filter: `room_id=eq.${roomId}`,
      },
      callback
    )
    .subscribe();

  return subscription;
}