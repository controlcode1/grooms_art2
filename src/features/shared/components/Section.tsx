import type { ElementType, ReactNode } from 'react'
import { clsx } from 'clsx'

interface SectionProps {
  as?: ElementType
  className?: string
  children: ReactNode
  id?: string
}

/** Editorial section wrapper — generous vertical rhythm, consistent gutters. */
export function Section({ as: Tag = 'section', className, children, id }: SectionProps) {
  return (
    <Tag id={id} className={clsx('px-6 md:px-12 lg:px-20', className)}>
      {children}
    </Tag>
  )
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={clsx(
        'font-sans text-xs md:text-sm tracking-[0.28em] uppercase text-sage',
        className,
      )}
    >
      {children}
    </p>
  )
}
