import type React from 'react'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google' 

import { TRPCProvider } from '@/app/trpc/Provider'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'No-Code RAG Chatbot',
  description: 'Create powerful AI chatbots from your documents in minutes',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <TRPCProvider>
          {children}
        </TRPCProvider> 
      </body>
    </html>
  )
}