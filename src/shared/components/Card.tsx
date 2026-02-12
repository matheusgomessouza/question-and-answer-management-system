import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'glass' | 'solid'
}

export function Card({ children, className = '', variant = 'solid' }: CardProps) {
  const baseClass = variant === 'glass' ? 'glass-card' : 'glass-card-solid'

  return (
    <div className={`${baseClass} rounded-xl p-6 animate-fade-in ${className}`}>
      {children}
    </div>
  )
}
