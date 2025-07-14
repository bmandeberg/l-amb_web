import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'L-AMB Sequencer and Synthesizer',
  description: 'Custom musical sequencer and synthesizer using a binary tree of mixers',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
