'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ReactNode } from 'react'

interface SettingsSectionProps {
  title: string
  description: string
  children: ReactNode
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  )
}