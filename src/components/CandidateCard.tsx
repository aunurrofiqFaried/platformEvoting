'use client';

import type { Candidate } from '@/lib/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';

interface CandidateCardProps {
  candidate: Pick<Candidate, 'id' | 'name' | 'description' | 'image_url' | 'vote_count'>;
  isSelected: boolean;
  hasVoted: boolean;
  totalVotes: number;
  onSelect: (candidateId: string) => void;
  onVote: (candidateId: string) => Promise<void>;
  isVoting: boolean;
}

export function CandidateCard({
  candidate,
  isSelected,
  hasVoted,
  totalVotes,
  onSelect,
  onVote,
  isVoting,
}: CandidateCardProps) {
  const percentage = totalVotes > 0 ? ((candidate.vote_count / totalVotes) * 100).toFixed(1) : '0';

  const handleVote = async () => {
    await onVote(candidate.id);
  };

  return (
    <Card className="overflow-hidden border-2 transition-all hover:shadow-lg dark:bg-slate-900" 
      style={{
        borderColor: isSelected ? '#ea580c' : '#e5e7eb',
      }}>
      <CardContent className="p-0 space-y-0">
        {/* Image Section */}
        {candidate.image_url ? (
          <div className="relative w-full h-96 bg-slate-200 dark:bg-slate-800">
            <Image
              src={candidate.image_url}
              alt={candidate.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900 dark:to-orange-800 flex items-center justify-center">
            <span className="text-4xl">🗳️</span>
          </div>
        )}

        <div className="p-4 space-y-3">
        {/* Candidate Info */}
        <div className="space-y-1">
          <h3 className="font-bold text-lg dark:text-white">{candidate.name}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{candidate.description}</p>
        </div>

        {/* Vote Count */}
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">{candidate.vote_count} votes</span>
          <span className="font-semibold text-orange-600 dark:text-orange-400">{percentage}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 dark:bg-orange-600 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Vote Button */}
        {!hasVoted ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id={candidate.id}
                name="candidate"
                checked={isSelected}
                onChange={() => onSelect(candidate.id)}
                className="cursor-pointer"
              />
              <Label htmlFor={candidate.id} className="cursor-pointer text-sm">
                {isSelected ? 'Selected' : 'Select to vote'}
              </Label>
            </div>
            <Button
              onClick={handleVote}
              disabled={!isSelected || isVoting || hasVoted}
              className="w-full bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
              size="sm"
            >
              {isVoting ? 'Voting...' : 'Vote'}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-2 bg-green-50 dark:bg-green-900/30 rounded-md">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">Already Voted</span>
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  );
}