// hooks/useVoting.ts
import { useEffect, useState, useCallback } from 'react';
import { supabase, checkUserVoted, submitVote, getVoteResults } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

interface Candidate {
  id: string;
  name: string;
  description: string;
  image_url: string;
  vote_count: number;
}

interface VotingRoomData {
  id: string;
  title: string;
  description: string;
  status: string;
  candidates: Candidate[];
}

interface UseVotingReturn {
  room: VotingRoomData | null;
  candidates: Candidate[];
  user: User | null;
  hasVoted: boolean;
  selectedCandidate: string | null;
  loading: boolean;
  error: string | null;
  vote: (candidateId: string) => Promise<boolean>;
}

interface VotingError extends Error {
  message: string;
}

export function useVoting(roomId: string): UseVotingReturn {
  const [room, setRoom] = useState<VotingRoomData | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);

  // Load user & room data
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        setLoading(true);
        
        // Get current user
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        setUser(currentUser);

        if (!currentUser) {
          throw new Error('User not authenticated');
        }

        // Get voting room dengan candidates
        const { data: roomData, error: roomError } = await supabase
          .from('voting_rooms')
          .select(
            `
            id,
            title,
            description,
            status,
            candidates(id, name, description, image_url, vote_count)
          `
          )
          .eq('id', roomId)
          .single();

        if (roomError) throw roomError;

        setRoom(roomData as VotingRoomData);
        setCandidates((roomData as VotingRoomData).candidates || []);

        // Check if user already voted
        const voted = await checkUserVoted(roomId, currentUser.id);
        setHasVoted(voted);

        setError(null);
      } catch (err) {
        const error = err as VotingError;
        setError(error.message || 'An error occurred');
        console.error('Error loading voting room:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [roomId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!roomId || !user) return;

    const channel = supabase
      .channel(`votes:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes',
          filter: `room_id=eq.${roomId}`,
        },
        async (): Promise<void> => {
          // Refresh vote results
          try {
            const results = await getVoteResults(roomId);
            setCandidates(results);
          } catch (err) {
            console.error('Error updating vote results:', err);
          }
        }
      )
      .subscribe();

    setSubscription(channel);

    return (): void => {
      channel.unsubscribe();
    };
  }, [roomId, user]);

  const vote = useCallback(
    async (candidateId: string): Promise<boolean> => {
      if (!user || hasVoted) {
        setError('Anda sudah melakukan voting atau belum login');
        return false;
      }

      try {
        setSelectedCandidate(candidateId);
        await submitVote(roomId, candidateId, user.id);
        
        // Update local state
        setCandidates((prevCandidates) =>
          prevCandidates.map((c) =>
            c.id === candidateId
              ? { ...c, vote_count: c.vote_count + 1 }
              : c
          )
        );
        
        setHasVoted(true);
        setError(null);
        return true;
      } catch (err) {
        const error = err as VotingError;
        setError(error.message || 'Error submitting vote');
        console.error('Error submitting vote:', err);
        return false;
      }
    },
    [roomId, user, hasVoted]
  );

  return {
    room,
    candidates,
    user,
    hasVoted,
    selectedCandidate,
    loading,
    error,
    vote,
  };
}