import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'
import { Link, type LinkComponentProps } from '@tanstack/react-router'

type Variant = 'primary' | 'outline' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'md' | 'lg'
  children: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-sans tracking-wide uppercase transition-colors duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)] disabled:opacity-40 disabled:cursor-not-allowed'

const variants: Record<Variant, string> = {
  primary:
    'bg-forest text-cream hover:bg-forest-deep border border-forest',
  outline:
    'bg-transparent text-charcoal border border-charcoal/70 hover:border-forest hover:text-forest',
  ghost:
    'bg-transparent text-charcoal border-b border-charcoal/40 hover:border-forest hover:text-forest rounded-none px-0',
}

const sizes = {
  md: 'text-xs px-6 py-3',
  lg: 'text-sm px-8 py-4',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        base,
        variant !== 'ghost' && sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function LinkButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant
  size?: 'md' | 'lg'
  href: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      className={clsx(
        base,
        variant !== 'ghost' && sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </a>
  )
}

type RouterLinkButtonProps = LinkComponentProps<'a'> & {
  variant?: Variant
  size?: 'md' | 'lg'
  children: ReactNode
  className?: string
}

/** Internal, client-routed version of Button for TanStack Router links. */
export function RouterLinkButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: RouterLinkButtonProps) {
  return (
    <Link
      className={clsx(
        base,
        variant !== 'ghost' && sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  )
}
