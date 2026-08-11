interface PalmEmblemProps {
  className?: string
  light?: boolean
}

/**
 * Brand emblem — two intertwined palm trees,
 * symbolising union & growth. Rendered from the brand asset.
 */
export function PalmEmblem({ className, light = false }: PalmEmblemProps) {
  return (
    <img
      src={light ? '/images/palm-trees-light.png' : '/images/palm-trees.png'}
      alt="Grooms Art Emblem"
      className={className}
      style={{ objectFit: 'contain' }}
    />
  )
}
