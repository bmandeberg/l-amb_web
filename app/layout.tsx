import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const dinCondensed = localFont({
  src: [
    {
      path: '../public/fonts/DINCondensed-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/DINCondensed-Bold.woff',
      weight: '700',
      style: 'normal',
    },
  ],
})

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
    <html lang="en" className={dinCondensed.className}>
      <body>{children}</body>
    </html>
  )
}
