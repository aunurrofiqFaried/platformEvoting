'use client'

import { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

interface SettingsItemProps {
  label: string
  description?: string
  children: ReactNode
  htmlFor?: string
}

export function SettingsItem({ label, description, children, htmlFor }: SettingsItemProps) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor={htmlFor} className="text-sm font-semibold text-slate-900 dark:text-white">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}