'use client'

import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple'
}

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = 'orange',
}: StatsCardProps) {
  return (
    <Card className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {title}
            </p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
              {value}
            </h3>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                {description}
              </p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.isPositive
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {trend.isPositive ? '+' : '-'}
                  {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-500">
                  vs last month
                </span>
              </div>
            )}
          </div>
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              colorClasses[color]
            )}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}