'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, Eye, Pencil, Trash2, Copy, ExternalLink } from 'lucide-react'
import { VotingRoom } from '@/lib/types'
import Link from 'next/link'

interface RoomCardProps {
  room: VotingRoom
  onEdit?: (room: VotingRoom) => void
  onDelete?: (room: VotingRoom) => void
  onCopyLink?: (roomId: string) => void
}

export function RoomCard({ room, onEdit, onDelete, onCopyLink }: RoomCardProps) {
  const isActive = room.status === 'active'
  
  // Format date
  const createdDate = new Date(room.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  return (
    <Card className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
              {room.title}
            </CardTitle>
            <CardDescription className="mt-2 line-clamp-2">
              {room.description || 'No description provided'}
            </CardDescription>
          </div>
          <Badge 
            variant={isActive ? 'default' : 'secondary'}
            className={isActive 
              ? 'bg-green-500 hover:bg-green-600 text-white' 
              : 'bg-slate-500 hover:bg-slate-600 text-white'
            }
          >
            {isActive ? 'Active' : 'Closed'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Room Info */}
        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{createdDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>0 votes</span>
          </div>
        </div>

        {/* Room ID */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Room ID
          </p>
          <div className="flex items-center justify-between gap-2">
            <code className="text-sm font-mono text-slate-900 dark:text-white">
              {room.id.substring(0, 8)}...
            </code>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCopyLink?.(room.id)}
              className="h-7 px-2"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Link href={`/dashboard/rooms/${room.id}`} className="flex-1">
            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              size="sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </Link>
          
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(room)}
              className="border-slate-300 dark:border-slate-700"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(room)}
              className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Share Link */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
          onClick={() => {
            const link = `${window.location.origin}/vote/${room.id}`
            navigator.clipboard.writeText(link)
          }}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Copy Voting Link
        </Button>
      </CardContent>
    </Card>
  )
}