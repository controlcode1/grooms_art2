import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { clsx } from 'clsx'
import { useI18n } from '@/lib/i18n'
import {
  loadPackages,
  getPackageDisplayName,
  getPackageDisplayDescription,
  getPackageDisplayBadge,
  getPackageDisplayFeatures,
  type Package,
} from '@/lib/data/packages'

interface SessionPackageStepProps {
  selected: string | null
  city: string | null
  onSelect: (packageId: string) => void
}

export function SessionPackageStep({ selected, city, onSelect }: SessionPackageStepProps) {
  const { t, locale } = useI18n()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [activeModalPkg, setActiveModalPkg] = useState<Package | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    loadPackages(city || 'baghdad', 'sessions').then((data) => {
      if (!cancelled) {
        setPackages(data)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [city])

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
      <div className="text-center mb-10">
        <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl text-charcoal mb-3">
          {t.sessions.packageTitle}
        </h2>
        <p className="font-sans text-xs tracking-[0.18em] uppercase text-charcoal/50">
          {locale === 'ar' ? 'اختر باقة الجلسة المناسبة لتوثيق لحظاتكم' : 'Select your preferred photography package'}
        </p>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-3xl border border-charcoal/10 bg-white p-7 animate-pulse h-[560px]">
              <div className="h-6 bg-charcoal/05 rounded-full w-1/2 mb-4" />
              <div className="h-10 bg-charcoal/05 rounded w-2/3 mb-6" />
              <div className="space-y-3">
                <div className="h-4 bg-charcoal/05 rounded w-3/4" />
                <div className="h-4 bg-charcoal/05 rounded w-2/3" />
                <div className="h-4 bg-charcoal/05 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State when no packages exist */}
      {!loading && packages.length === 0 && (
        <div className="bg-white border border-charcoal/10 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-forest/10 text-forest flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
            </svg>
          </div>
          <h3 className="font-serif text-xl text-charcoal mb-2">
            {locale === 'ar' ? 'لا توجد باقات متاحة حالياً' : 'No Packages Available'}
          </h3>
          <p className="font-sans text-xs text-charcoal/55 leading-relaxed">
            {locale === 'ar'
              ? 'يرجى التواصل مع الاستوديو مباشرة لترتيب تفاصيل جلستكم الخاصة.'
              : 'Please contact our studio directly to arrange custom session details.'}
          </p>
        </div>
      )}

      {/* 1. DESKTOP ACCORDION MOTION LAYOUT (STRICT HOVER / LEAVE) */}
      {!loading && packages.length > 0 && (
        <div
          className="hidden md:flex flex-row items-stretch gap-4 lg:gap-5 w-full min-h-[640px] mb-8"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {packages.map((pkg, i) => {
            const isSelected = selected === pkg.package_key
            const isExpanded = hoveredIndex === i
            const name = getPackageDisplayName(pkg, locale)
            const desc = getPackageDisplayDescription(pkg, locale)
            const badge = getPackageDisplayBadge(pkg, locale)
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
                  'rounded-3xl p-6 lg:p-7 flex flex-col justify-between relative overflow-hidden cursor-pointer select-none transition-all duration-500',
                  isExpanded
                    ? isSelected
                      ? 'border-2 border-forest bg-white shadow-2xl ring-4 ring-forest/05'
                      : 'border border-charcoal/20 bg-white shadow-xl'
                    : isSelected
                      ? 'border-2 border-forest/80 bg-forest/[0.02] shadow-sm hover:border-forest hover:bg-white'
                      : 'border border-charcoal/10 bg-[#FAF9F5] hover:bg-white hover:border-charcoal/25 hover:shadow-md',
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
                        {badge ? (
                          <span className="inline-block font-sans text-[9px] tracking-[0.22em] uppercase px-3 py-1 rounded-full bg-linen border border-charcoal/10 text-charcoal/80 font-semibold shadow-xs">
                            {badge}
                          </span>
                        ) : <span />}

                        {isSelected && (
                          <span className="inline-flex items-center gap-1 font-sans text-[10px] tracking-wider uppercase text-forest font-semibold bg-forest/10 px-3 py-1 rounded-full">
                            ✓ {locale === 'ar' ? 'تم الاختيار' : 'Selected'}
                          </span>
                        )}
                      </div>

                      {/* Package Title */}
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

                      {/* Feature sections */}
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
                                const isHeader = item.startsWith('—') || item.startsWith('-')
                                const isBullet = item.startsWith('•') || item.startsWith('*')
                                const cleanedItem = isHeader
                                  ? item.slice(1).trim()
                                  : isBullet
                                    ? item.slice(1).trim()
                                    : item

                                return (
                                  <li key={itemIdx} className={clsx(
                                    'flex gap-2 font-sans text-xs leading-relaxed',
                                    isHeader
                                      ? 'text-forest font-semibold mt-2.5 text-[10px] uppercase tracking-wider'
                                      : 'text-charcoal/75'
                                  )}>
                                    {!isHeader && <span className="text-forest/70 font-bold">•</span>}
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
                        ? (locale === 'ar' ? 'الباقة مختارة' : 'Package Selected')
                        : (locale === 'ar' ? 'اختيار هذه الباقة' : 'Select Package')}
                    </button>
                  </motion.div>
                ) : (
                  /* ─── COLLAPSED VIEW (Minimalist Editorial Brand Card) ─── */
                  <div className="flex flex-col items-center justify-between h-full py-4 text-center select-none">
                    {/* Top Identity / Badge Indicator */}
                    <div className="flex flex-col items-center gap-2">
                      {badge ? (
                        <span className="inline-block font-sans text-[8px] tracking-[0.2em] uppercase px-2.5 py-0.5 rounded-full bg-white/80 border border-charcoal/10 text-charcoal/60 font-semibold">
                          {badge}
                        </span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-charcoal/20" />
                      )}
                    </div>

                    {/* Center Area: Title & Dominant Price */}
                    <div className="flex flex-col items-center gap-3 my-auto px-1">
                      <h4 className="font-serif text-lg lg:text-xl text-charcoal/90 font-medium tracking-tight leading-snug">
                        {name}
                      </h4>

                      <div className="w-6 h-px bg-charcoal/15 my-1" />

                      {/* Prominent Price Centerpiece */}
                      <p className="font-serif text-2xl lg:text-3xl text-forest font-light tracking-tight">
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
            const badge = getPackageDisplayBadge(pkg, locale)
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
                                const isHeader = item.startsWith('—') || item.startsWith('-')
                                const isBullet = item.startsWith('•') || item.startsWith('*')
                                const cleanedItem = isHeader
                                  ? item.slice(1).trim()
                                  : isBullet
                                    ? item.slice(1).trim()
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

                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveModalPkg(pkg)
                          }}
                          className="font-sans text-xs tracking-wider uppercase border border-charcoal/20 text-charcoal/75 py-2.5 rounded-xl bg-linen/40 hover:bg-linen transition-colors text-center font-medium"
                        >
                          {locale === 'ar' ? 'التفاصيل' : 'Details'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelect(pkg.package_key)
                          }}
                          className={clsx(
                            'font-sans text-xs tracking-wider uppercase py-2.5 rounded-xl border transition-colors text-center font-medium shadow-xs',
                            isSelected
                              ? 'bg-forest border-forest text-cream'
                              : 'border-forest text-forest hover:bg-forest hover:text-cream',
                          )}
                        >
                          {isSelected ? (locale === 'ar' ? 'تم الاختيار' : 'Selected') : (locale === 'ar' ? 'اختيار' : 'Select')}
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

      {/* 3. DETAIL MODAL */}
      <AnimatePresence>
        {activeModalPkg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-charcoal/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#FAFAF7] w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-charcoal/10 max-h-[88vh] overflow-y-auto flex flex-col text-center relative"
            >
              <button
                type="button"
                onClick={() => setActiveModalPkg(null)}
                className="absolute top-4 right-4 rtl:right-auto rtl:left-4 w-9 h-9 rounded-full flex items-center justify-center text-charcoal/50 hover:text-charcoal hover:bg-charcoal/06 transition-colors text-base z-10"
                aria-label="Close modal"
              >
                ✕
              </button>

              {(() => {
                const name = getPackageDisplayName(activeModalPkg, locale)
                const desc = getPackageDisplayDescription(activeModalPkg, locale)
                const badge = getPackageDisplayBadge(activeModalPkg, locale)
                const featureGroups = getPackageDisplayFeatures(activeModalPkg, locale)

                return (
                  <>
                    {/* Header: Badge, Package Title, Price, Description */}
                    <div className="flex flex-col items-center pt-2 pb-2">
                      {badge && (
                        <span className="inline-block font-sans text-[9px] tracking-[0.22em] uppercase px-3.5 py-1 rounded-full bg-white border border-charcoal/10 text-charcoal/75 font-semibold mb-3 shadow-xs">
                          {badge}
                        </span>
                      )}

                      <h3 className="font-serif text-3xl sm:text-4xl text-charcoal font-medium tracking-tight">
                        {name}
                      </h3>

                      <p className="font-serif text-3xl sm:text-4xl text-forest font-normal mt-2">
                        ${activeModalPkg.price.toLocaleString()}
                      </p>

                      {desc && (
                        <p className="font-sans text-xs sm:text-sm text-charcoal/65 mt-3 max-w-md mx-auto leading-relaxed">
                          {desc}
                        </p>
                      )}
                    </div>

                    <div className="w-12 h-px bg-forest/25 mx-auto my-3" />

                    {/* Vertically Stacked & Centered Sections */}
                    <div className="space-y-6 flex-1 overflow-y-auto py-3 px-1">
                      {featureGroups.map((group, gIdx) => (
                        <div key={gIdx} className="space-y-2 text-center">
                          {group.title && (
                            <h4 className="font-sans text-[11px] tracking-[0.22em] uppercase text-forest font-bold">
                              {group.title}
                            </h4>
                          )}
                          <div className="space-y-1">
                            {group.items.map((item, itemIdx) => {
                              const isHeader = item.startsWith('—') || item.startsWith('-')
                              const isBullet = item.startsWith('•') || item.startsWith('*')
                              const cleanedItem = isHeader
                                ? item.slice(1).trim()
                                : isBullet
                                  ? item.slice(1).trim()
                                  : item

                              return (
                                <p key={itemIdx} className={clsx(
                                  'font-sans text-xs sm:text-sm leading-relaxed',
                                  isHeader
                                    ? 'text-forest font-semibold mt-3 text-[10px] uppercase tracking-wider'
                                    : 'text-charcoal/80'
                                )}>
                                  {cleanedItem}
                                </p>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-charcoal/08 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(activeModalPkg.package_key)
                          setActiveModalPkg(null)
                        }}
                        className="w-full text-center font-sans text-xs tracking-[0.18em] uppercase py-4 rounded-xl bg-forest text-cream border border-forest hover:bg-forest-deep transition-colors font-medium shadow-sm"
                      >
                        {selected === activeModalPkg.package_key
                          ? (locale === 'ar' ? 'الباقة مختارة بالفعل' : 'Package Already Selected')
                          : (locale === 'ar' ? 'اختيار هذه الباقة' : 'Select this Package')}
                      </button>
                    </div>
                  </>
                )
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
