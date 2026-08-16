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
            <div key={n} className="rounded-2xl border border-charcoal/10 bg-white p-7 animate-pulse h-96">
              <div className="h-6 bg-charcoal/05 rounded w-1/2 mb-3" />
              <div className="h-8 bg-charcoal/05 rounded w-1/3 mb-6" />
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

      {/* 1. DESKTOP LAYOUT */}
      {!loading && packages.length > 0 && (
        <div className="hidden md:grid grid-cols-3 gap-6">
          {packages.map((pkg, i) => {
            const isSelected = selected === pkg.package_key
            const name = getPackageDisplayName(pkg, locale)
            const desc = getPackageDisplayDescription(pkg, locale)
            const badge = getPackageDisplayBadge(pkg, locale)
            const featureGroups = getPackageDisplayFeatures(pkg, locale)

            return (
              <motion.button
                key={pkg.id}
                type="button"
                onClick={() => onSelect(pkg.package_key)}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className={clsx(
                  'text-left rounded-2xl p-7 flex flex-col h-full transition-all duration-300 relative group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50',
                  isSelected
                    ? 'border-2 border-forest bg-forest/[0.03] shadow-md'
                    : 'border border-charcoal/10 bg-white hover:border-charcoal/30 hover:shadow-sm',
                )}
                style={pkg.accent_color && isSelected ? { borderColor: pkg.accent_color } : undefined}
                aria-pressed={isSelected}
              >
                <div>
                  {/* Badge pill */}
                  {badge && (
                    <span className="inline-block font-sans text-[9px] tracking-[0.2em] uppercase px-3 py-1 rounded-full bg-forest text-cream font-semibold mb-3">
                      {badge}
                    </span>
                  )}

                  <h3 className="font-serif text-2xl text-charcoal mb-1 font-medium">{name}</h3>
                  <p className="font-serif text-3xl text-forest mb-5 font-normal">
                    ${pkg.price.toLocaleString()}
                  </p>

                  {desc && (
                    <p className="font-sans text-xs text-charcoal/60 mb-4 leading-relaxed">
                      {desc}
                    </p>
                  )}

                  <div className="divider-hairline mb-5" />

                  {featureGroups.map((group, gIdx) => (
                    <div key={gIdx} className="mb-4">
                      <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-charcoal/40 mb-2 font-semibold">
                        {group.title}
                      </p>
                      <ul className="space-y-1.5">
                        {group.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex gap-2 font-sans text-xs text-charcoal/70">
                            <span className="text-forest/70 font-bold">—</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div
                  className={clsx(
                    'mt-auto pt-4 text-center font-sans text-xs tracking-[0.15em] uppercase py-3 rounded-lg border transition-all duration-300 w-full font-medium',
                    isSelected
                      ? 'bg-forest text-cream border-forest shadow-sm'
                      : 'border-charcoal/20 text-charcoal/70 hover:bg-charcoal/5',
                  )}
                >
                  {isSelected ? (locale === 'ar' ? 'تم الاختيار' : 'Selected') : (locale === 'ar' ? 'اختيار الباقة' : 'Select Package')}
                </div>
              </motion.button>
            )
          })}
        </div>
      )}

      {/* 2. MOBILE LAYOUT */}
      {!loading && packages.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {packages.map((pkg) => {
            const isSelected = selected === pkg.package_key
            const name = getPackageDisplayName(pkg, locale)
            const badge = getPackageDisplayBadge(pkg, locale)

            return (
              <div
                key={pkg.id}
                className={clsx(
                  'rounded-2xl border p-5 flex flex-col min-h-[140px] transition-all duration-300 bg-white',
                  isSelected
                    ? 'border-2 border-forest bg-forest/[0.03] shadow-md'
                    : 'border-charcoal/15 shadow-sm',
                )}
              >
                {badge && (
                  <span className="inline-block font-sans text-[8px] tracking-[0.2em] uppercase px-2.5 py-0.5 rounded-full bg-forest/10 text-forest font-semibold mb-2 self-start">
                    {badge}
                  </span>
                )}

                <div className="flex-1 mb-4">
                  <span className="font-serif text-xl font-medium text-charcoal block">{name}</span>
                  <p className="font-serif text-2xl text-forest mt-1">${pkg.price.toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveModalPkg(pkg)}
                    className="font-sans text-xs tracking-wider uppercase border border-charcoal/20 text-charcoal/75 py-2.5 rounded-xl bg-linen/30 hover:bg-linen/60 transition-colors text-center font-medium"
                  >
                    {locale === 'ar' ? 'التفاصيل' : 'Details'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelect(pkg.package_key)}
                    className={clsx(
                      'font-sans text-xs tracking-wider uppercase py-2.5 rounded-xl border transition-colors text-center font-medium',
                      isSelected
                        ? 'bg-forest border-forest text-cream'
                        : 'border-forest text-forest hover:bg-forest/[0.05]',
                    )}
                  >
                    {isSelected ? (locale === 'ar' ? 'مختارة' : 'Selected') : (locale === 'ar' ? 'اختر' : 'Select')}
                  </button>
                </div>
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
                          <h4 className="font-sans text-[11px] tracking-[0.22em] uppercase text-forest font-bold">
                            {group.title}
                          </h4>
                          <div className="space-y-1">
                            {group.items.map((item, itemIdx) => (
                              <p key={itemIdx} className="font-sans text-xs sm:text-sm text-charcoal/80 leading-relaxed">
                                {item}
                              </p>
                            ))}
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
