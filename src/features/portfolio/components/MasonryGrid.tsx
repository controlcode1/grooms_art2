import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { PortfolioImage } from '@/lib/data/portfolio'
import { imageSrcSet } from '@/lib/data/portfolio'
import { Lightbox } from './Lightbox'
import { SkeletonGrid } from '@/features/shared/components/SkeletonGrid'

interface MasonryGridProps {
  images: PortfolioImage[]
  loading?: boolean
  pageSize?: number
}

export function MasonryGrid({ images, loading = false, pageSize = 9 }: MasonryGridProps) {
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
      <div className="columns-2 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
        {visibleImages.map((img, i) => {
          const src = imageSrcSet(img.id)
          return (
            <motion.button
              key={img.id}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="mb-4 block w-full break-inside-avoid overflow-hidden rounded-lg bg-linen text-left group"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, delay: (i % pageSize) * 0.04, ease: [0.16, 1, 0.3, 1] }}
            >
              <img
                src={src.md}
                srcSet={img.id.startsWith('data:') || img.id.startsWith('blob:') ? undefined : `${src.sm} 480w, ${src.md} 960w, ${src.lg} 1600w`}
                sizes={img.id.startsWith('data:') || img.id.startsWith('blob:') ? undefined : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
                alt={img.alt}
                loading={i < 4 ? 'eager' : 'lazy'}
                className="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
              />
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
