import { useMemo, useRef, useState, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { clsx } from 'clsx'
import { useI18n } from '@/lib/i18n'
import { useHeaderTheme } from '@/lib/hooks/useHeaderTheme'
import { getPortfolioImages, imageSrcSet, preloadIdbImages, type PortfolioImage } from '@/lib/data/portfolio'
import type { FilterValue } from '@/features/portfolio/components/CategoryFilter'

interface PortfolioHeroProps {
  onSelectCategory?: (category: FilterValue) => void
  activeCategory?: FilterValue
}

export function PortfolioHero({ onSelectCategory, activeCategory }: PortfolioHeroProps) {
  const { t, locale } = useI18n()
  useHeaderTheme('light')

  const containerRef = useRef<HTMLDivElement>(null)
  const [images, setImages] = useState<PortfolioImage[]>([])
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    preloadIdbImages().then(async () => {
      setImages(await getPortfolioImages())
    })

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // ─── Partition images into 5 staggered columns ─────────────────────────────
  const columns = useMemo(() => {
    if (!images || images.length === 0) return [[], [], [], [], []]
    const colCount = 5
    const cols: PortfolioImage[][] = Array.from({ length: colCount }, () => [])

    images.forEach((img, idx) => {
      cols[idx % colCount].push(img)
    })

    // Ensure each column has items for a continuous loop
    return cols.map((col) => {
      if (col.length === 0) return images.slice(0, 4)
      return col
    })
  }, [images])

  // ─── Mouse Tilt Parallax Physics (Active on desktop) ─────────────────────────
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { stiffness: 60, damping: 20 }
  const smoothX = useSpring(mouseX, springConfig)
  const smoothY = useSpring(mouseY, springConfig)

  const rotateX = useTransform(smoothY, [-0.5, 0.5], isMobile ? [0, 0] : [6, -6])
  const rotateY = useTransform(smoothX, [-0.5, 0.5], isMobile ? [0, 0] : [-7, 7])
  const transX = useTransform(smoothX, [-0.5, 0.5], isMobile ? [0, 0] : [-20, 20])
  const transY = useTransform(smoothY, [-0.5, 0.5], isMobile ? [0, 0] : [-15, 15])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const scrollToGallery = () => {
    const gallerySection = document.getElementById('portfolio-gallery-start')
    if (gallerySection) {
      gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Staggered column animation classes
  const columnAnimationClasses = [
    'animate-float-up-medium',
    'animate-float-down-slow',
    'animate-float-up-fast',
    'animate-float-down-medium',
    'animate-float-up-slow',
  ]

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[92svh] min-h-[580px] md:min-h-[640px] max-h-[920px] overflow-hidden bg-[#0A0D0B] text-cream flex items-center justify-center select-none"
      style={{ perspective: isMobile ? 'none' : '1200px' }}
    >
      {/* ─── 1. INFINITE FLOATING GALLERY WALL CANVAS (Responsive Grid) ─── */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          x: transX,
          y: transY,
          transformStyle: isMobile ? 'flat' : 'preserve-3d',
        }}
        className="absolute -inset-x-6 sm:-inset-x-12 -inset-y-24 sm:-inset-y-36 flex justify-center items-center pointer-events-none opacity-50 sm:opacity-65 md:opacity-75 transition-opacity duration-1000"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 w-full max-w-[1550px] h-[160%] transform -rotate-3 md:-rotate-4 scale-[1.04] md:scale-[1.12]">
          {columns.map((colImages, colIndex) => {
            const animClass = columnAnimationClasses[colIndex]

            // Responsive visibility:
            // Mobile: 2 columns
            // Tablet (sm): 3 columns
            // Laptop (md): 4 columns
            // Desktop (lg): 5 columns
            const visibilityClass = clsx(
              colIndex >= 2 && 'hidden sm:flex',
              colIndex >= 3 && 'hidden md:flex',
              colIndex >= 4 && 'hidden lg:flex',
            )

            // Double the list for continuous infinite loop
            const loopedImages = [...colImages, ...colImages, ...colImages]

            return (
              <div
                key={colIndex}
                className={clsx(
                  'relative h-full overflow-hidden flex-col',
                  visibilityClass,
                )}
              >
                <div className={clsx('flex flex-col gap-3 sm:gap-5 will-change-transform-gpu', animClass)}>
                  {loopedImages.map((img, imgIndex) => {
                    const src = imageSrcSet(img.id)
                    return (
                      <div
                        key={`${img.id}-${imgIndex}`}
                        className="group/card relative rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 bg-white/5 shadow-xl backdrop-blur-xs transition-all duration-700 hover:border-emerald-400/40 pointer-events-auto"
                      >
                        <div className="aspect-[3/4] w-full overflow-hidden bg-charcoal">
                          <img
                            src={src.sm}
                            srcSet={`${src.sm} 480w, ${src.md} 960w`}
                            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 20vw"
                            alt={img.alt || img.title}
                            loading={imgIndex < 4 ? 'eager' : 'lazy'}
                            className="w-full h-full object-cover grayscale-[20%] contrast-[105%] group-hover/card:grayscale-0 group-hover/card:scale-105 transition-all duration-1000 ease-out"
                          />
                        </div>

                        {/* Subtle Card Vignette */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-75 group-hover/card:opacity-40 transition-opacity duration-500" />

                        {/* Bottom Tag */}
                        <div className="absolute bottom-2 inset-x-2 flex items-center justify-between pointer-events-none">
                          <span className="font-sans text-[7px] sm:text-[8px] tracking-[0.18em] uppercase px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/80 font-medium truncate max-w-[90%]">
                            {img.category ? img.category.toUpperCase() : 'EDITORIAL'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* ─── 2. LUXURY LIGHTING & VIGNETTE GRADIENTS (Edge Transitions) ─── */}
      {/* Center Emerald Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(18,55,42,0.65),rgba(10,13,11,0.9)_70%,#0A0D0B_100%)] pointer-events-none" />

      {/* Subtle Cyan/Emerald Glow Flare */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] sm:w-[600px] h-[200px] sm:h-[300px] bg-emerald-500/10 blur-[100px] sm:blur-[130px] rounded-full pointer-events-none" />

      {/* Top Edge Navbar Fade */}
      <div className="absolute top-0 inset-x-0 h-28 sm:h-36 bg-gradient-to-b from-[#0A0D0B] via-[#0A0D0B]/85 to-transparent pointer-events-none z-10" />

      {/* Bottom Edge Smooth Transition into Page (#FAFAF7) */}
      <div className="absolute bottom-0 inset-x-0 h-36 sm:h-44 bg-gradient-to-t from-[#FAFAF7] via-[#0A0D0B]/90 to-transparent pointer-events-none z-10" />

      {/* ─── 3. REFINED EDITORIAL SCROLL TRIGGER & INDICATOR ─── */}
      <motion.button
        type="button"
        onClick={scrollToGallery}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="group absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3.5 cursor-pointer select-none outline-none focus-visible:ring-1 focus-visible:ring-cream/40"
        aria-label="Explore Gallery"
      >
        <span className="font-sans text-[10px] sm:text-xs tracking-[0.32em] uppercase text-cream/75 group-hover:text-cream font-medium transition-colors duration-500 flex items-center gap-2">
          <span>{locale === 'ar' ? 'استكشف الأرشيف' : 'EXPLORE ARCHIVE'}</span>
          <span className="text-xs group-hover:translate-y-1 transition-transform duration-500 text-cream/60 group-hover:text-cream">↓</span>
        </span>

        {/* Minimalist animated hairline indicator */}
        <div className="relative w-px h-10 sm:h-12 bg-cream/20 overflow-hidden">
          <motion.div
            animate={{ y: ['-100%', '100%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-full h-1/2 bg-gradient-to-b from-transparent via-cream/90 to-transparent"
          />
        </div>
      </motion.button>
    </div>
  )
}
