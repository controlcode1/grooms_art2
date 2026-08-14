import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { getPortfolioCategories } from '@/lib/data/portfolio'
import { useI18n } from '@/lib/i18n'

export type FilterValue = string // 'all' | 'full-day' | PortfolioCategory

interface CategoryFilterProps {
  value: FilterValue
  onChange: (value: FilterValue) => void
  categories?: CategoryInfo[]
}

export function CategoryFilter({ value, onChange, categories }: CategoryFilterProps) {
  const { t, locale } = useI18n()
  const [hovered, setHovered] = useState<string | null>(null)

  const options = useMemo(() => {
    const dynamicCats = categories || getPortfolioCategories()
    const list: { key: FilterValue; label: string }[] = [
      { key: 'all', label: t.portfolio.filters.all },
    ]

    // Map dynamic categories
    dynamicCats.forEach((cat) => {
      list.push({
        key: cat.id,
        label: locale === 'ar' ? cat.nameAr : cat.name,
      })
    })

    // Insert Full Day before cinematic or at the end
    list.push({ key: 'full-day', label: t.portfolio.filters.fullDay })

    return list
  }, [t, locale, categories])

  return (
    <div className="flex flex-wrap gap-x-8 gap-y-3 border-b border-charcoal/10 pb-6">
      {options.map((opt) => {
        const isActive = value === opt.key
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
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
  )
}
