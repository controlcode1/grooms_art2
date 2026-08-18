import { useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { clsx } from 'clsx'
import { useI18n } from '@/lib/i18n'
import { Section, Eyebrow } from '@/features/shared/components/Section'
import { imageSrcSet, getPortfolioImages } from '@/lib/data/portfolio'

const PREVIEW_IDS = ['frame-03', 'frame-10', 'frame-07', 'frame-18', 'frame-22', 'frame-25']

export function PortfolioPreview() {
  const { t, locale } = useI18n()
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  const previewImages = useMemo(() => {
    const allImgs = getPortfolioImages()
    const activePreview = PREVIEW_IDS.map((id) =>
      allImgs.find((img) => img.id === id),
    ).filter(Boolean) as typeof allImgs

    if (activePreview.length < 6) {
      const remaining = allImgs.filter((img) => !activePreview.some((ap) => ap.id === img.id))
      return [...activePreview, ...remaining].slice(0, 6)
    }
    return activePreview
  }, [])

  return (
    <Section className="py-24 md:py-32">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div>
          <Eyebrow className="mb-4">{t.home.previewEyebrow}</Eyebrow>
          <h2 className="font-serif text-3xl md:text-5xl text-charcoal">
            {t.home.previewTitle}
          </h2>
        </div>
        <Link
          to="/portfolio"
          className="font-sans text-xs tracking-[0.2em] uppercase border-b border-charcoal/40 hover:border-forest hover:text-forest transition-colors duration-500 pb-1 w-fit"
        >
          {t.home.previewCta}
        </Link>
      </div>

      {/* 1. DESKTOP HORIZONTAL ACCORDION GALLERY */}
      <div
        onMouseLeave={() => setActiveIdx(null)}
        className="hidden md:flex flex-row items-stretch gap-3.5 h-[560px] w-full rounded-3xl overflow-hidden"
      >
        {previewImages.map((img, i) => {
          const isExpanded = activeIdx === i
          const src = imageSrcSet(img.id)

          return (
            <div
              key={img.id}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => setActiveIdx(i)}
              style={{
                flex: isExpanded ? '4.5 1 0%' : '1 1 0%',
                transition: 'flex 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="relative h-full overflow-hidden rounded-2xl cursor-pointer group bg-charcoal"
            >
              {/* Background High-Res Image */}
              <img
                src={src.lg}
                srcSet={`${src.sm} 480w, ${src.md} 960w, ${src.lg} 1600w`}
                sizes="(min-width: 1024px) 50vw, 80vw"
                alt={img.alt}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
              />

              {/* Gradient Vignette Overlays */}
              <div
                className={clsx(
                  'absolute inset-0 transition-opacity duration-500',
                  isExpanded
                    ? 'bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-90'
                    : 'bg-black/45 group-hover:bg-black/30',
                )}
              />

              {/* Expanded Content Card Overlay */}
              {isExpanded ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="absolute bottom-6 inset-x-6 z-10 bg-black/40 backdrop-blur-md border border-white/15 rounded-2xl p-6 text-cream shadow-2xl flex items-end justify-between gap-4"
                >
                  <div>
                    <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-cream/70 font-semibold block mb-1">
                      {img.category ? (locale === 'ar' ? 'معرض الصور' : img.category.toUpperCase()) : 'EDITORIAL'}
                    </span>
                    <h3 className="font-serif text-2xl lg:text-3xl text-cream font-medium tracking-tight">
                      {img.title}
                    </h3>
                  </div>

                  <Link
                    to="/portfolio/$slug"
                    params={{ slug: img.slug }}
                    className="font-sans text-xs tracking-[0.18em] uppercase bg-cream text-charcoal px-5 py-3 rounded-xl font-medium hover:bg-white transition-colors duration-300 shadow-md whitespace-nowrap"
                  >
                    {locale === 'ar' ? 'عرض العمل' : 'View Work'} →
                  </Link>
                </motion.div>
              ) : (
                /* Collapsed Vertical Title Strip */
                <div className="absolute inset-0 flex flex-col items-center justify-between py-6 px-2 z-10 pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-cream/70 shadow-sm" />
                  <span
                    className="font-serif text-lg text-cream/90 font-medium tracking-wider whitespace-nowrap drop-shadow-md select-none"
                    style={{
                      transform: 'rotate(-90deg)',
                    }}
                  >
                    {img.title}
                  </span>
                  <span className="font-sans text-[9px] tracking-widest text-cream/50 uppercase">
                    0{i + 1}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 2. MOBILE TOUCH-FRIENDLY SCROLLABLE ACCORDION */}
      <div className="flex md:hidden flex-row gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 no-scrollbar">
        {previewImages.map((img) => {
          const src = imageSrcSet(img.id)
          return (
            <div
              key={img.id}
              className="snap-center shrink-0 w-[82vw] max-w-[320px] h-[440px] relative rounded-2xl overflow-hidden shadow-lg border border-charcoal/10"
            >
              <img
                src={src.md}
                alt={img.alt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-5 inset-x-5 text-cream flex items-end justify-between gap-3">
                <div>
                  <span className="font-sans text-[9px] tracking-[0.2em] uppercase text-cream/70 block mb-1">
                    {img.category ? img.category.toUpperCase() : 'EDITORIAL'}
                  </span>
                  <h3 className="font-serif text-xl text-cream font-medium">
                    {img.title}
                  </h3>
                </div>
                <Link
                  to="/portfolio/$slug"
                  params={{ slug: img.slug }}
                  className="font-sans text-[10px] tracking-wider uppercase bg-cream text-charcoal px-3.5 py-2.5 rounded-lg font-semibold"
                >
                  {locale === 'ar' ? 'عرض' : 'View'}
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}
