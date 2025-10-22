'use client'

import React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

type NextThemesProviderProps = React.ComponentProps<typeof NextThemesProvider>

export function ThemeProvider(props: NextThemesProviderProps): React.ReactElement {
  return <NextThemesProvider {...props} />
}