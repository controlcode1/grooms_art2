interface SkeletonGridProps {
  count?: number
}

/**
 * Organic skeleton screen matching the masonry portfolio grid — varied
 * heights so the loading state doesn't read as a mechanical, repeating unit.
 */
export function SkeletonGrid({ count = 9 }: SkeletonGridProps) {
  const heights = ['h-64', 'h-80', 'h-96', 'h-72']

  return (
    <div className="columns-2 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton mb-4 break-inside-avoid rounded-lg ${heights[i % heights.length]}`}
        />
      ))}
    </div>
  )
}
