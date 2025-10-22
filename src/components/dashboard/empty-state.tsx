'use client'

import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-orange-100 dark:bg-orange-950 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-orange-600 dark:text-orange-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 text-center max-w-md mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}