import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { UserProvider } from '@auth0/nextjs-auth0/client'; // to wrap page with UserProvider

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Closet Circle | Community Clothing Marketplace',
  description: 'Discover, buy, sell, and rent pre-loved clothing within a community.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <UserProvider>
      <body className={inter.className}>{children}</body>
      </UserProvider>
    </html>
  )
}
