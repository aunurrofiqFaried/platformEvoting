'use client';

import type { Candidate } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VotingResultsProps {
  candidates: Array<Pick<Candidate, 'id' | 'name' | 'vote_count'>>;
  roomId: string;
}

export function VotingResults({ candidates }: VotingResultsProps) {
  const totalVotes = candidates.reduce((sum, c) => sum + c.vote_count, 0);
  const sorted = [...candidates].sort((a, b) => b.vote_count - a.vote_count);

  return (
    <Card className="dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="text-lg dark:text-white">Live Results</CardTitle>
        <p className="text-sm text-slate-600 dark:text-slate-400">Total: {totalVotes} votes</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {sorted.map((candidate, index) => {
          const percentage = totalVotes > 0 ? ((candidate.vote_count / totalVotes) * 100).toFixed(1) : '0';

          return (
            <div key={candidate.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">{index + 1}</Badge>
                  <span className="font-semibold dark:text-white">{candidate.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-orange-600 dark:text-orange-400">{candidate.vote_count}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">{percentage}%</div>
                </div>
              </div>

              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 dark:bg-orange-600 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}