import '@/styles/tailwind.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

export const runtime = 'nodejs'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Tinfoil Browser Integration Demo',
  description: 'Minimal browser integration demo for testing streaming and model configurations.',
}

// Ensure proper mobile viewport behavior (iOS Safari friendly)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full w-full overflow-x-hidden`}>
      <body className="bg-surface-app h-full w-full overflow-x-hidden font-sans text-content-primary">{children}</body>
    </html>
  )
}
