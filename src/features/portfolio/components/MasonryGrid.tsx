import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { PortfolioImage } from '@/lib/data/portfolio'
import { imageSrcSet, isInlineImage } from '@/lib/data/portfolio'
import { Lightbox } from './Lightbox'
import { SkeletonGrid } from '@/features/shared/components/SkeletonGrid'

interface MasonryGridProps {
  images: PortfolioImage[]
  loading?: boolean
  pageSize?: number
}

export function MasonryGrid({ images, loading = false, pageSize = 12 }: MasonryGridProps) {
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setVisibleCount(pageSize)
  }, [images, pageSize])

  const visibleImages = useMemo(
    () => images.slice(0, visibleCount),
    [images, visibleCount],
  )

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || visibleCount >= images.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((v) => Math.min(v + pageSize, images.length))
        }
      },
      { rootMargin: '480px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [visibleCount, images.length, pageSize])

  if (loading) return <SkeletonGrid count={pageSize} />

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {visibleImages.map((img, i) => {
          const src = imageSrcSet(img.id)
          return (
            <motion.button
              key={img.id}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="relative aspect-[3/4] w-full overflow-hidden rounded-xl sm:rounded-2xl bg-charcoal/05 text-left group shadow-xs border border-charcoal/08 focus:outline-none focus:ring-2 focus:ring-forest/50 transition-all duration-300"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: (i % 6) * 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <img
                src={src.md}
                srcSet={isInlineImage(img.id) ? undefined : `${src.sm} 480w, ${src.md} 960w, ${src.lg} 1600w`}
                sizes={isInlineImage(img.id) ? undefined : "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"}
                alt={img.alt}
                loading={i < 4 ? 'eager' : 'lazy'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              {/* Clean Subtle Gradient & Title on Hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 sm:p-4 pointer-events-none">
                {img.title && (
                  <p className="font-serif text-xs sm:text-sm text-cream drop-shadow-xs line-clamp-1">
                    {img.title}
                  </p>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>

      {visibleCount < images.length && (
        <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
      )}

      {lightboxIndex !== null && (
        <Lightbox
          images={visibleImages}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  )
}
