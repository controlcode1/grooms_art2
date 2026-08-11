import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Section, Eyebrow } from '@/features/shared/components/Section'
import { CategoryFilter, type FilterValue } from '@/features/portfolio/components/CategoryFilter'
import { MasonryGrid } from '@/features/portfolio/components/MasonryGrid'
import { EmptyState } from '@/features/shared/components/EmptyState'
import { getPortfolioImages } from '@/lib/data/portfolio'
import { useI18n } from '@/lib/i18n'

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

function PortfolioPage() {
  const { t } = useI18n()
  const [filter, setFilter] = useState<FilterValue>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [filter])

  const filtered = useMemo(() => {
    const allImages = getPortfolioImages()
    if (filter === 'all') return allImages
    if (filter === 'full-day') return allImages.filter((i) => i.partOfFullDay)
    return allImages.filter((i) => i.category === filter)
  }, [filter])

  return (
    <Section className="pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="max-w-2xl mb-10">
        <Eyebrow className="mb-4">{t.portfolio.eyebrow}</Eyebrow>
        <h1 className="font-serif text-4xl md:text-6xl text-charcoal mb-5">
          {t.portfolio.title}
        </h1>
        <p className="font-sans text-sm md:text-base text-charcoal/60 leading-relaxed">
          {t.portfolio.subtitle}
        </p>
      </div>

      <div className="mb-10">
        <CategoryFilter value={filter} onChange={setFilter} />
      </div>

      {!loading && filtered.length === 0 ? (
        <EmptyState title={t.portfolio.emptyTitle} body={t.portfolio.emptyBody} />
      ) : (
        <MasonryGrid images={filtered} loading={loading} />
      )}
    </Section>
  )
}
