'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useVoting } from '@/hooks/useVoting';
import { useRealtimeCandidates } from '@/hooks/useRealtimeCandidates';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogOut, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function VotePage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const {
    room,
    user,
    hasVoted,
    loading: votingLoading,
    error,
    vote,
  } = useVoting(roomId);

  const { candidates, loading: candidatesLoading, refetch: refetchCandidates } = useRealtimeCandidates(roomId);

  const [isVoting, setIsVoting] = useState(false);
  const [selectedCandidateLocal, setSelectedCandidateLocal] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const loading = votingLoading || candidatesLoading;

  const totalVotes = candidates.reduce((sum, c) => sum + c.vote_count, 0);

  // Calculate winner
  const leadingCandidate = candidates.length > 0 
    ? candidates.reduce((prev, current) => 
        current.vote_count > prev.vote_count ? current : prev
      )
    : null;

  // Prepare chart data
  const chartData = candidates.map(c => ({
    name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
    votes: c.vote_count,
    percentage: totalVotes > 0 ? ((c.vote_count / totalVotes) * 100).toFixed(1) : '0',
    fullName: c.name,
    isLeading: c.id === leadingCandidate?.id
  }));

  const handleVote = async (candidateId: string): Promise<void> => {
    if (selectedCandidateLocal !== candidateId) return;
    
    setIsVoting(true);
    const success = await vote(candidateId);
    setIsVoting(false);
    
    if (success) {
      setSelectedCandidateLocal(null);
      setShowResults(true);
      // Refetch candidates to get latest results
      await refetchCandidates();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
          </div>
          <p className="text-lg text-slate-900 dark:text-white">Loading voting room...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <Card className="w-full max-w-md dark:bg-slate-900">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Please login to vote</AlertDescription>
            </Alert>
            <Button
              onClick={() => router.push('/auth/login')}
              className="w-full mt-4 bg-orange-500 hover:bg-orange-600"
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <Card className="w-full max-w-md dark:bg-slate-900">
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
        {!hasVoted && !showResults ? (
          // Voting Phase - Select Candidate
          <div>
            {selectedCandidateLocal && (
              <Alert className="mb-6 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800">
                <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-300">
                  You selected a candidate. Click Vote to confirm your choice.
                </AlertDescription>
              </Alert>
            )}

            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2 dark:text-white">Select a Candidate</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {candidates.length} candidates available
                </p>
              </div>
              <Button
                onClick={() => setShowResults(true)}
                variant="outline"
                className="dark:border-slate-600 dark:text-white"
              >
                View Results
              </Button>
            </div>

            {candidates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    onClick={() => setSelectedCandidateLocal(candidate.id)}
                    className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedCandidateLocal === candidate.id
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950'
                        : 'border-slate-200 dark:border-slate-800 hover:border-orange-300'
                    }`}
                  >
                    <h3 className="text-lg font-semibold mb-2 dark:text-white">
                      {candidate.name}
                    </h3>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      <p>Votes: {candidate.vote_count}</p>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(candidate.id);
                      }}
                      disabled={selectedCandidateLocal !== candidate.id || isVoting}
                      className={`w-full ${
                        selectedCandidateLocal === candidate.id
                          ? 'bg-orange-500 hover:bg-orange-600'
                          : 'bg-slate-300 hover:bg-slate-300'
                      }`}
                    >
                      {isVoting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Voting...
                        </>
                      ) : (
                        'Vote'
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-600 dark:text-slate-400">No candidates available</p>
              </div>
            )}
          </div>
        ) : (
          // Results Phase
          <div className="space-y-8">
            <Alert className="bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800">
              <CheckCircle2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-800 dark:text-orange-300">
                {hasVoted ? 'Thank you for voting! Here are the current results.' : 'Here are the current voting results.'}
              </AlertDescription>
            </Alert>

            {/* Results Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bar Chart */}
              <div className="lg:col-span-2">
                <Card className="dark:bg-slate-900">
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-4 dark:text-white">Voting Results (Live)</h3>
                    
                    {chartData.length === 0 || totalVotes === 0 ? (
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
                          <YAxis 
                            tick={{ fontSize: 12, fill: '#64748b' }}
                          />
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
                  </div>
                </Card>
              </div>

              {/* Results Summary */}
              <div className="space-y-4">
                {leadingCandidate && (
                  <Card className="border-orange-200 dark:border-orange-800 dark:bg-slate-900 bg-orange-50">
                    <div className="p-6">
                      <p className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-2">Leading</p>
                      <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                        {leadingCandidate.name}
                      </h3>
                      <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                        {totalVotes > 0 ? ((leadingCandidate.vote_count / totalVotes) * 100).toFixed(1) : '0'}%
                      </p>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mt-2">
                        {leadingCandidate.vote_count} votes
                      </p>
                    </div>
                  </Card>
                )}

                <Card className="dark:bg-slate-900">
                  <div className="p-6">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Total Votes</p>
                    <p className="text-3xl font-bold dark:text-white">{totalVotes}</p>
                  </div>
                </Card>

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
                              {item.fullName.length > 12 ? item.fullName.substring(0, 12) + '...' : item.fullName}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                            {item.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {hasVoted && (
              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                Back to Dashboard
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}