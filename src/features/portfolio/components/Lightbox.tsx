import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { imageSrcSet, type PortfolioImage } from '@/lib/data/portfolio'
import { useI18n } from '@/lib/i18n'

interface LightboxProps {
  images: PortfolioImage[]
  index: number
  onClose: () => void
  onNavigate: (nextIndex: number) => void
}

export function Lightbox({ images, index, onClose, onNavigate }: LightboxProps) {
  const { t } = useI18n()
  const closeRef = useRef<HTMLButtonElement>(null)
  const image = images[index]

  useEffect(() => {
    closeRef.current?.focus()
    const previouslyFocused = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      previouslyFocused?.focus?.()
    }
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNavigate((index + 1) % images.length)
      if (e.key === 'ArrowLeft') onNavigate((index - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [index, images.length, onClose, onNavigate])

  if (!image) return null
  const src = imageSrcSet(image.id)

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={image.title}
        className="fixed inset-0 z-[100] bg-charcoal/95 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
        onClick={onClose}
      >
        <div className="flex items-center justify-between px-6 py-5 md:px-10">
          <p className="font-sans text-xs tracking-[0.2em] uppercase text-cream/60">
            {index + 1} / {images.length}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="font-sans text-xs tracking-[0.2em] uppercase text-cream/80 hover:text-cream"
          >
            {t.common.close}
          </button>
        </div>

        <div
          className="relative flex-1 flex items-center justify-center px-4 pb-4"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onNavigate((index - 1 + images.length) % images.length)}
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-cream/60 hover:text-cream font-serif text-3xl px-2"
            aria-label={t.common.previous}
          >
            ‹
          </button>

          <motion.img
            key={image.id}
            src={src.lg}
            alt={image.alt}
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-h-[72svh] md:max-h-[78svh] max-w-full object-contain rounded-lg"
          />

          <button
            type="button"
            onClick={() => onNavigate((index + 1) % images.length)}
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-cream/60 hover:text-cream font-serif text-3xl px-2"
            aria-label={t.common.next}
          >
            ›
          </button>
        </div>

        <div
          className="px-6 py-6 md:px-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-t border-cream/10"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="font-serif text-xl md:text-2xl text-cream">{image.title}</h3>
          <div className="flex flex-wrap gap-x-6 gap-y-1 font-sans text-[11px] tracking-[0.1em] uppercase text-cream/50">
            <span>{image.exif.camera}</span>
            <span>{image.exif.focalLength}</span>
            <span>{image.exif.aperture}</span>
            <span>{image.exif.shutter}</span>
            <span>{image.exif.iso}</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
