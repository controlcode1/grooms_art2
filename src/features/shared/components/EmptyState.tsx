import type { ReactNode } from 'react'
import { PalmEmblem } from './PalmEmblem'

interface EmptyStateProps {
  title: string
  body: string
  action?: ReactNode
}

/** Warm, brand-aligned empty state — used for empty filters, galleries, etc. */
export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center py-24 px-6 max-w-md mx-auto">
      <PalmEmblem className="w-12 h-12 text-sage/70 mb-6" />
      <h3 className="font-serif text-2xl md:text-3xl text-charcoal mb-3">{title}</h3>
      <p className="font-sans text-sm text-charcoal/60 leading-relaxed mb-6">{body}</p>
      {action}
    </div>
  )
}
