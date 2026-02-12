import { ReactNode } from 'react'
import { Navbar } from './Navbar'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8" role="main">
        {children}
      </main>
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200" role="contentinfo">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-gray-600">
          © 2026 Q&A Management System. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
