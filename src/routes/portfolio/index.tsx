import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Section } from '@/features/shared/components/Section'
import { MasonryGrid } from '@/features/portfolio/components/MasonryGrid'
import { EmptyState } from '@/features/shared/components/EmptyState'
import {
  getPortfolioImages,
  getPortfolioCategories,
  staticPortfolioImages,
  DEFAULT_CATEGORIES,
  preloadIdbImages,
  type PortfolioImage,
  type CategoryInfo,
} from '@/lib/data/portfolio'
import { useI18n } from '@/lib/i18n'
import { motion } from 'motion/react'

export const Route = createFileRoute('/portfolio/')({
  head: () => ({
    meta: [
      { title: 'Portfolio — Grooms Art' },
      {
        name: 'description',
        content:
          'Editorial wedding photography, portraits, full-day galleries, and cinematic shorts by Grooms Art.',
      },
    ],
  }),
  component: PortfolioPage,
})

type FilterValue = 'all' | 'full-day' | string

function PortfolioPage() {
  const { t, locale } = useI18n()
  const [filter, setFilter] = useState<FilterValue>('all')
  const [hovered, setHovered] = useState<string | null>(null)

  // Initialize with server-safe defaults to avoid hydration mismatch
  const [allImages, setAllImages] = useState<PortfolioImage[]>(staticPortfolioImages)
  const [allCategories, setAllCategories] = useState<CategoryInfo[]>(DEFAULT_CATEGORIES)

  // Load database modifications after mounting
  useEffect(() => {
    preloadIdbImages().then(async () => {
      const [images, categories] = await Promise.all([
        getPortfolioImages(),
        getPortfolioCategories(),
      ])
      setAllImages(images)
      setAllCategories(categories)
    })
  }, [])

  // Build filter options
  const filterOptions = useMemo(() => {
    const opts: { key: FilterValue; label: string }[] = [
      { key: 'all', label: locale === 'ar' ? 'الكل' : 'All' },
      ...allCategories.map((c) => ({
        key: c.id,
        label: locale === 'ar' ? c.nameAr : c.name,
      })),
      { key: 'full-day', label: locale === 'ar' ? 'يوم كامل' : 'Full Day' },
    ]
    return opts
  }, [allCategories, locale])

  // Sections to display
  const sections = useMemo(() => {
    if (filter === 'full-day') {
      const imgs = allImages.filter((i) => i.partOfFullDay)
      return [{ id: 'full-day', label: locale === 'ar' ? 'يوم كامل' : 'Full Day', images: imgs }]
    }
    if (filter !== 'all') {
      const cat = allCategories.find((c) => c.id === filter)
      const imgs = allImages.filter((i) => i.category === filter)
      return [{ id: filter, label: cat ? (locale === 'ar' ? cat.nameAr : cat.name) : filter, images: imgs }]
    }
    // All → one section per category that has images
    const result = allCategories
      .map((cat) => ({
        id: cat.id,
        label: locale === 'ar' ? cat.nameAr : cat.name,
        images: allImages.filter((i) => i.category === cat.id),
      }))
      .filter((s) => s.images.length > 0)

    // Also add any full-day images that don't fall under the listed categories
    const fullDayOnly = allImages.filter(
      (i) => i.partOfFullDay && !allCategories.some((c) => c.id === i.category),
    )
    if (fullDayOnly.length > 0) {
      result.push({ id: 'full-day', label: locale === 'ar' ? 'يوم كامل' : 'Full Day', images: fullDayOnly })
    }
    return result
  }, [allImages, allCategories, filter, locale])

  const totalImages = sections.reduce((sum, s) => sum + s.images.length, 0)

  return (
    <Section className="pt-28 pb-20 md:pt-36 md:pb-28">
      {/* Header */}
      <div className="max-w-2xl mb-10">
        <h1 className="font-serif text-4xl md:text-6xl text-charcoal mb-4">
          {t.portfolio.title}
        </h1>
        <p className="font-sans text-sm md:text-base text-charcoal/65 leading-relaxed">
          {t.portfolio.subtitle}
        </p>
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-x-8 gap-y-3 border-b border-charcoal/10 pb-6 mb-14">
        {filterOptions.map((opt) => {
          const isActive = filter === opt.key
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setFilter(opt.key)}
              onMouseEnter={() => setHovered(opt.key)}
              onMouseLeave={() => setHovered(null)}
              className="relative font-sans text-xs md:text-sm tracking-[0.15em] uppercase pb-2 transition-colors duration-500"
              style={{ color: isActive ? '#12372A' : 'rgba(17,17,17,0.55)' }}
              aria-pressed={isActive}
            >
              {opt.label}
              {(isActive || hovered === opt.key) && (
                <motion.span
                  layoutId="portfolio-filter-underline"
                  className="absolute left-0 right-0 -bottom-px h-px bg-forest"
                  transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Sections */}
      {totalImages === 0 ? (
        <EmptyState title={t.portfolio.emptyTitle} body={t.portfolio.emptyBody} />
      ) : (
        <div className="space-y-14 md:space-y-20">
          {sections.map((section) => (
            <div key={section.id}>
              {/* Section label — shown only when "All" is selected or there is >1 section */}
              {(filter === 'all' || sections.length > 1) && (
                <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-8">
                  <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-charcoal">{section.label}</h2>
                  <span className="font-sans text-[10px] sm:text-[11px] text-charcoal/40 uppercase tracking-wider">
                    {section.images.length} {locale === 'ar' ? 'صورة' : 'photos'}
                  </span>
                  <div className="flex-1 h-px bg-charcoal/08" />
                </div>
              )}
              <MasonryGrid images={section.images} />
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}
