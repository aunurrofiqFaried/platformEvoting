'use client';

import {  useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useVoting } from '@/hooks/useVoting';
import { CandidateCard } from '@/components/CandidateCard';
import { VotingResults } from '@/components/VotingResults';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { Loader2, LogOut, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function VotePage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const {
    room,
    candidates,
    user,
    hasVoted,
    loading,
    error,
    vote,
  } = useVoting(roomId);

  const [isVoting, setIsVoting] = useState(false);
  const [selectedCandidateLocal, setSelectedCandidateLocal] = useState<string | null>(null);

  const totalVotes = candidates.reduce((sum, c) => sum + c.vote_count, 0);

  const handleVote = async (candidateId: string): Promise<void> => {
    if (selectedCandidateLocal !== candidateId) return;
    
    setIsVoting(true);
    const success = await vote(candidateId);
    setIsVoting(false);
    
    if (success) {
      setSelectedCandidateLocal(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto" />
          <p className="text-lg">Loading voting room...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Please login to vote</AlertDescription>
            </Alert>
            <Button
              onClick={() => router.push('/auth/login')}
              className="w-full mt-4"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full mt-4"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b bg-white dark:bg-slate-900 dark:border-slate-800">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold dark:text-white">{room?.title}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">{room?.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium dark:text-white">{user.email}</p>
                {hasVoted && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">✓ Voted</p>
                )}
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="gap-2 dark:border-slate-600 dark:text-white"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {hasVoted && (
          <Alert className="mb-6 bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800">
            <CheckCircle2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-800 dark:text-orange-300">
              Thank you for voting! You can now see the live results below.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Candidates */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2 dark:text-white">Candidates</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {candidates.length} candidates • {totalVotes} total votes
              </p>
            </div>

            {candidates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    isSelected={selectedCandidateLocal === candidate.id}
                    hasVoted={hasVoted}
                    totalVotes={totalVotes}
                    onSelect={(id) => {
                      if (!hasVoted) {
                        setSelectedCandidateLocal(id);
                      }
                    }}
                    onVote={handleVote}
                    isVoting={isVoting}
                  />
                ))}
              </div>
            ) : (
              <Card className="dark:bg-slate-900">
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-600 dark:text-slate-400">No candidates available</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <VotingResults candidates={candidates} roomId={roomId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}