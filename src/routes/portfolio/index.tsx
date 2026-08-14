import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Section, Eyebrow } from '@/features/shared/components/Section'
import { CategoryFilter, type FilterValue } from '@/features/portfolio/components/CategoryFilter'
import { MasonryGrid } from '@/features/portfolio/components/MasonryGrid'
import { EmptyState } from '@/features/shared/components/EmptyState'
import { 
  DEFAULT_CATEGORIES, 
  staticPortfolioImages, 
  getPublicUrl, 
  type CategoryInfo, 
  type PortfolioImage 
} from '@/lib/data/portfolio'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase/client'

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
  const [dbCategories, setDbCategories] = useState<CategoryInfo[]>([])
  const [dbImages, setDbImages] = useState<PortfolioImage[]>([])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    const loadData = async () => {
      // Load categories
      const { data: cats, error: catsErr } = await supabase
        .from('portfolio_categories')
        .select('*')
        .order('sort_order', { ascending: true })
      
      if (!catsErr && cats) {
        setDbCategories(
          cats.map((c: any) => ({
            id: c.id,
            name: c.name,
            nameAr: c.name_ar,
          }))
        )
      }

      // Load images
      const { data: imgs, error: imgsErr } = await supabase
        .from('portfolio_images')
        .select('*')
        .order('sort_order', { ascending: true })

      if (!imgsErr && imgs) {
        setDbImages(
          imgs.map((row: any) => ({
            id: getPublicUrl(row.storage_path),
            dbId: row.id,
            slug: row.slug,
            title: row.title,
            alt: row.alt || '',
            category: row.category,
            partOfFullDay: row.part_of_full_day,
            orientation: row.orientation || 'landscape',
            storagePath: row.storage_path,
            exif: {
              camera: 'Sony A7 IV',
              lens: '35mm f/1.4 GM',
              focalLength: '35mm',
              aperture: 'f/2.2',
              shutter: '1/500s',
              iso: 'ISO 100',
            },
          }))
        )
      }
      setLoading(false)
    }

    loadData()

    const catsChannel = supabase
      .channel('public_portfolio_categories_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio_categories' }, () => {
        loadData()
      })
      .subscribe()

    const imgsChannel = supabase
      .channel('public_portfolio_images_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio_images' }, () => {
        loadData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(catsChannel)
      supabase.removeChannel(imgsChannel)
    }
  }, [])

  const mergedCategories = useMemo(() => {
    const all = [...DEFAULT_CATEGORIES]
    dbCategories.forEach((c) => {
      if (!all.some((existing) => existing.id === c.id)) {
        all.push(c)
      }
    })
    return all
  }, [dbCategories])

  const mergedImages = useMemo(() => {
    return [...dbImages, ...staticPortfolioImages]
  }, [dbImages])

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(timer)
  }, [filter])

  const filtered = useMemo(() => {
    if (filter === 'all') return mergedImages
    if (filter === 'full-day') return mergedImages.filter((i) => i.partOfFullDay)
    return mergedImages.filter((i) => i.category === filter)
  }, [mergedImages, filter])

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
        <CategoryFilter value={filter} onChange={setFilter} categories={mergedCategories} />
      </div>

      {!loading && filtered.length === 0 ? (
        <EmptyState title={t.portfolio.emptyTitle} body={t.portfolio.emptyBody} />
      ) : (
        <MasonryGrid images={filtered} loading={loading} />
      )}
    </Section>
  )
}
