interface ErrorStateProps {
  title: string
  body: string
  retryLabel?: string
  onRetry?: () => void
}

/** Non-intrusive editorial error alert with a swift recovery action. */
export function ErrorState({ title, body, retryLabel = 'Retry', onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-charcoal/15 bg-cream px-6 py-6 max-w-md"
    >
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-forest" />
        <p className="font-sans text-xs tracking-[0.2em] uppercase text-forest">{title}</p>
      </div>
      <p className="font-sans text-sm text-charcoal/70 leading-relaxed">{body}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="font-sans text-xs tracking-[0.2em] uppercase border-b border-charcoal/40 hover:border-forest hover:text-forest transition-colors duration-500 pb-0.5"
        >
          {retryLabel}
        </button>
      )}
    </div>
  )
}
