import type { Metadata } from 'next'
// import { ThemeProvider } from '@/components/theme-provider'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'E-Voting Platform',
  description: 'Simple and elegant e-voting platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      
      <body className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors">
        <Toaster />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}