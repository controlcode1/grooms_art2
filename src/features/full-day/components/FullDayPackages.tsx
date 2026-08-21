import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { clsx } from 'clsx'
import { useI18n } from '@/lib/i18n'
import { SharedBookingWizard } from '@/features/booking/SharedBookingWizard'
import {
  loadPackages,
  getPackageDisplayName,
  getPackageDisplayDescription,
  getPackageDisplayBadge,
  getPackageDisplayFeatures,
  type Package,
} from '@/lib/data/packages'

export function FullDayPackages() {
  const { t, locale } = useI18n()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  return (
    <SharedBookingWizard
      type="full-day"
      packageNames={{
        classic: 'Classic',
        royal: 'Royal',
      }}
      successTitle={t.fullDay.bookingSuccessTitle}
      successBody={t.fullDay.bookingSuccessBody}
      renderPackageStep={(city, selected, onSelect) => (
        <FullDayStepInner
          city={city}
          selected={selected}
          onSelect={onSelect}
          locale={locale}
          t={t}
          packages={packages}
          loading={loading}
          setPackages={setPackages}
          setLoading={setLoading}
        />
      )}
    />
  )
}

interface FullDayStepInnerProps {
  city: string | null
  selected: string | null
  onSelect: (pkgId: string) => void
  locale: string
  t: any
  packages: Package[]
  loading: boolean
  setPackages: (pkgs: Package[]) => void
  setLoading: (loading: boolean) => void
}

function FullDayStepInner({
  city,
  selected,
  onSelect,
  locale,
  t,
  packages,
  loading,
  setPackages,
  setLoading,
}: FullDayStepInnerProps) {
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    loadPackages(city || 'baghdad', 'full-day').then((data) => {
      if (!cancelled) {
        setPackages(data)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [city, setLoading, setPackages])

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [activeAccordionIndex, setActiveAccordionIndex] = useState<number>(0)

  useEffect(() => {
    if (selected && packages.length > 0) {
      const idx = packages.findIndex((p) => p.package_key === selected)
      if (idx !== -1) {
        setActiveAccordionIndex(idx)
      }
    }
  }, [selected, packages])

  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-charcoal mb-3 font-normal">
          {t.fullDay.packagesTitle}
        </h2>
        <p className="font-sans text-xs tracking-[0.2em] uppercase text-charcoal/50">
          {locale === 'ar' ? 'مجموعات التوثيق السينمائي لليوم الكامل' : 'Full Day Cinematic Wedding Collections'}
        </p>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {[1, 2].map((n) => (
            <div key={n} className="rounded-3xl border border-charcoal/10 bg-white p-8 md:p-10 animate-pulse h-[560px]">
              <div className="h-6 bg-charcoal/05 rounded-full w-1/3 mb-4" />
              <div className="h-8 bg-charcoal/05 rounded w-1/2 mb-3" />
              <div className="h-10 bg-charcoal/05 rounded w-1/3 mb-8" />
              <div className="space-y-4">
                <div className="h-4 bg-charcoal/05 rounded w-3/4" />
                <div className="h-4 bg-charcoal/05 rounded w-2/3" />
                <div className="h-4 bg-charcoal/05 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && packages.length === 0 && (
        <div className="bg-white border border-charcoal/10 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-forest/10 text-forest flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
            </svg>
          </div>
          <h3 className="font-serif text-xl text-charcoal mb-2">
            {locale === 'ar' ? 'لا توجد مجموعات متاحة حالياً' : 'No Collections Available'}
          </h3>
          <p className="font-sans text-xs text-charcoal/55 leading-relaxed">
            {locale === 'ar'
              ? 'يرجى التواصل مع الاستوديو مباشرة لترتيب تفاصيل حجز يومكم الكامل.'
              : 'Please contact our studio directly for custom full-day wedding coverage.'}
          </p>
        </div>
      )}

      {/* 1. DESKTOP ACCORDION MOTION LAYOUT (STRICT HOVER / LEAVE) */}
      {!loading && packages.length > 0 && (
        <div
          className="hidden md:flex flex-row items-stretch gap-5 w-full min-h-[640px] max-w-5xl mx-auto mb-8"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {packages.map((pkg, i) => {
            const isSelected = selected === pkg.package_key
            const isExpanded = hoveredIndex === i
            const name = getPackageDisplayName(pkg, locale)
            const desc = getPackageDisplayDescription(pkg, locale)
            const badge = getPackageDisplayBadge(pkg, locale) || (locale === 'ar' ? 'تغطية اليوم الكامل' : 'Full Day Coverage')
            const featureGroups = getPackageDisplayFeatures(pkg, locale)

            return (
              <div
                key={pkg.id}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onSelect(pkg.package_key)}
                style={{
                  flex: isExpanded ? '3.8 1 0%' : '1 1 0%',
                  transition: 'flex 0.55s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease, border-color 0.4s ease, background-color 0.4s ease',
                }}
                className={clsx(
                  'rounded-3xl p-7 lg:p-8 flex flex-col justify-between relative overflow-hidden cursor-pointer select-none transition-all duration-500',
                  isExpanded
                    ? isSelected
                      ? 'border-2 border-forest bg-white shadow-2xl ring-4 ring-forest/05'
                      : 'border border-charcoal/20 bg-white shadow-xl'
                    : isSelected
                      ? 'border-2 border-forest/80 bg-forest/[0.02] shadow-sm hover:border-forest hover:bg-white'
                      : 'border border-charcoal/12 bg-[#FAF9F5] hover:bg-white hover:border-charcoal/25 hover:shadow-md',
                )}
              >
                {/* ─── EXPANDED VIEW (ACTIVE ON HOVER ONLY) ─── */}
                {isExpanded ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="flex flex-col h-full justify-between"
                  >
                    <div>
                      {/* Top Bar with Badge & Selection Indicator */}
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <span className="inline-flex items-center font-sans text-[10px] tracking-[0.22em] uppercase px-3.5 py-1.5 rounded-full bg-linen border border-charcoal/10 text-charcoal/80 font-semibold shadow-xs">
                          {badge}
                        </span>

                        {isSelected && (
                          <span className="inline-flex items-center gap-1 font-sans text-[10px] tracking-wider uppercase text-forest font-semibold bg-forest/10 px-3 py-1 rounded-full">
                            ✓ {locale === 'ar' ? 'تم الاختيار' : 'Selected'}
                          </span>
                        )}
                      </div>

                      {/* Collection Title */}
                      <h3 className="font-serif text-2xl lg:text-3xl text-charcoal mb-2 font-medium tracking-tight">
                        {name}
                      </h3>

                      {/* Prominent Hero Price Centerpiece */}
                      <div className="flex items-baseline gap-2 mb-3">
                        <p className="font-serif text-4xl lg:text-5xl text-forest font-light tracking-tight">
                          ${pkg.price.toLocaleString()}
                        </p>
                        <span className="font-sans text-[11px] uppercase tracking-widest text-charcoal/40 font-medium">USD</span>
                      </div>

                      {desc && (
                        <p className="font-sans text-xs text-charcoal/65 mb-4 leading-relaxed line-clamp-2">
                          {desc}
                        </p>
                      )}

                      <div className="w-12 h-px bg-forest/20 mb-4" />

                      {/* Features Group */}
                      <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
                        {featureGroups.map((group, gIdx) => (
                          <div key={gIdx} className="space-y-1.5">
                            {group.title && (
                              <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-forest font-bold">
                                {group.title}
                              </p>
                            )}
                            <ul className="space-y-1">
                              {group.items.map((item, itemIdx) => {
                                const isHeader = item.startsWith('#') || item.startsWith('—') || item.startsWith('-')
                                const isBullet = item.startsWith('•') || item.startsWith('*')
                                const cleanedItem = isHeader
                                  ? item.replace(/^[#—\-]+\s*/, '')
                                  : isBullet
                                    ? item.replace(/^[•\*]+\s*/, '')
                                    : item

                                return (
                                  <li key={itemIdx} className={clsx(
                                    'flex gap-2.5 font-sans text-xs leading-relaxed',
                                    isHeader
                                      ? 'text-forest font-semibold mt-2.5 text-[10px] uppercase tracking-wider'
                                      : 'text-charcoal/75'
                                  )}>
                                    {!isHeader && <span className="text-forest/80 font-bold mt-0.5">•</span>}
                                    <span>{cleanedItem}</span>
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelect(pkg.package_key)
                      }}
                      className={clsx(
                        'mt-6 text-center font-sans text-xs tracking-[0.18em] uppercase py-3.5 rounded-xl border transition-all duration-300 w-full font-medium shadow-xs',
                        isSelected
                          ? 'bg-forest text-cream border-forest hover:bg-forest-deep'
                          : 'border-charcoal/25 text-charcoal hover:bg-forest hover:text-cream hover:border-forest',
                      )}
                    >
                      {isSelected
                        ? (locale === 'ar' ? 'المجموعة مختارة' : 'Collection Selected')
                        : (locale === 'ar' ? 'اختيار هذه المجموعة' : 'Select Collection')}
                    </button>
                  </motion.div>
                ) : (
                  /* ─── COLLAPSED VIEW (Minimalist Editorial Brand Card) ─── */
                  <div className="flex flex-col items-center justify-between h-full py-4 text-center select-none">
                    {/* Top Identity / Badge Indicator */}
                    <div className="flex flex-col items-center gap-2">
                      <span className="inline-block font-sans text-[8px] tracking-[0.2em] uppercase px-2.5 py-0.5 rounded-full bg-white/80 border border-charcoal/10 text-charcoal/60 font-semibold">
                        {badge}
                      </span>
                    </div>

                    {/* Center Area: Title & Dominant Price */}
                    <div className="flex flex-col items-center gap-3 my-auto px-1">
                      <h4 className="font-serif text-xl lg:text-2xl text-charcoal/90 font-medium tracking-tight leading-snug">
                        {name}
                      </h4>

                      <div className="w-6 h-px bg-charcoal/15 my-1" />

                      {/* Prominent Price Centerpiece */}
                      <p className="font-serif text-3xl lg:text-4xl text-forest font-light tracking-tight">
                        ${pkg.price.toLocaleString()}
                      </p>
                      <span className="font-sans text-[9px] uppercase tracking-widest text-charcoal/40 font-medium">USD</span>
                    </div>

                    {/* Bottom Hover Cue */}
                    <div className="flex items-center gap-1.5 font-sans text-[9px] tracking-[0.2em] uppercase text-charcoal/40 group-hover:text-forest transition-colors">
                      <span>{locale === 'ar' ? 'استعراض' : 'Expand'}</span>
                      <span className="text-xs">→</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 2. MOBILE INTERACTIVE VERTICAL ACCORDION */}
      {!loading && packages.length > 0 && (
        <div className="flex flex-col gap-3.5 md:hidden">
          {packages.map((pkg, i) => {
            const isSelected = selected === pkg.package_key
            const isExpanded = activeAccordionIndex === i
            const name = getPackageDisplayName(pkg, locale)
            const desc = getPackageDisplayDescription(pkg, locale)
            const badge = getPackageDisplayBadge(pkg, locale) || (locale === 'ar' ? 'تغطية اليوم الكامل' : 'Full Day Coverage')
            const featureGroups = getPackageDisplayFeatures(pkg, locale)

            return (
              <div
                key={pkg.id}
                onClick={() => setActiveAccordionIndex(isExpanded ? -1 : i)}
                className={clsx(
                  'rounded-2xl border transition-all duration-300 overflow-hidden bg-white cursor-pointer',
                  isSelected
                    ? 'border-2 border-forest bg-forest/[0.02] shadow-md'
                    : 'border-charcoal/15 shadow-xs hover:border-charcoal/30',
                )}
              >
                {/* Header Strip */}
                <div className="p-5 flex items-center justify-between gap-3">
                  <div>
                    {badge && (
                      <span className="inline-block font-sans text-[8px] tracking-[0.2em] uppercase px-2.5 py-0.5 rounded-full bg-forest/10 text-forest font-semibold mb-1.5">
                        {badge}
                      </span>
                    )}
                    <h3 className="font-serif text-xl font-medium text-charcoal">{name}</h3>
                    <p className="font-serif text-2xl text-forest mt-0.5">${pkg.price.toLocaleString()} <span className="font-sans text-[10px] uppercase text-charcoal/40 font-normal">USD</span></p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-forest text-cream flex items-center justify-center text-xs font-bold shadow-xs">
                        ✓
                      </span>
                    )}
                    <div className={clsx('w-8 h-8 rounded-full border border-charcoal/15 flex items-center justify-center text-charcoal/60 transition-transform duration-300', isExpanded && 'rotate-180 bg-forest/10 text-forest border-forest/30')}>
                      ↓
                    </div>
                  </div>
                </div>

                {/* Inline Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="px-5 pb-5 pt-1 border-t border-charcoal/08"
                    >
                      {desc && (
                        <p className="font-sans text-xs text-charcoal/65 mb-4 leading-relaxed">
                          {desc}
                        </p>
                      )}

                      <div className="space-y-3 mb-5">
                        {featureGroups.map((group, gIdx) => (
                          <div key={gIdx} className="space-y-1">
                            {group.title && (
                              <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-forest font-bold">
                                {group.title}
                              </p>
                            )}
                            <ul className="space-y-1">
                              {group.items.map((item, itemIdx) => {
                                const isHeader = item.startsWith('#') || item.startsWith('—') || item.startsWith('-')
                                const isBullet = item.startsWith('•') || item.startsWith('*')
                                const cleanedItem = isHeader
                                  ? item.replace(/^[#—\-]+\s*/, '')
                                  : isBullet
                                    ? item.replace(/^[•\*]+\s*/, '')
                                    : item

                                return (
                                  <li key={itemIdx} className={clsx(
                                    'flex gap-2 font-sans text-xs',
                                    isHeader
                                      ? 'text-forest font-semibold mt-2 text-[10px] uppercase tracking-wider'
                                      : 'text-charcoal/80'
                                  )}>
                                    {!isHeader && <span className="text-forest font-bold">•</span>}
                                    <span>{cleanedItem}</span>
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelect(pkg.package_key)
                          }}
                          className={clsx(
                            'w-full font-sans text-xs tracking-wider uppercase py-3 rounded-xl border transition-colors text-center font-medium shadow-xs',
                            isSelected
                              ? 'bg-forest border-forest text-cream'
                              : 'border-forest text-forest hover:bg-forest hover:text-cream',
                          )}
                        >
                          {isSelected ? (locale === 'ar' ? 'تم الاختيار' : 'Selected') : (locale === 'ar' ? 'اختيار هذه المجموعة' : 'Select Collection')}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
