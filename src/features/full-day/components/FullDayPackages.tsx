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

const PACKAGE_NAMES: Record<string, string> = {
  vip: 'VIP Collection',
  royal: 'Royal Collection',
}

export function FullDayPackages() {
  const { t, locale } = useI18n()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [activeModalPkg, setActiveModalPkg] = useState<Package | null>(null)

  return (
    <SharedBookingWizard
      type="full-day"
      packageNames={PACKAGE_NAMES}
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
          activeModalPkg={activeModalPkg}
          setActiveModalPkg={setActiveModalPkg}
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
  activeModalPkg: Package | null
  setActiveModalPkg: (pkg: Package | null) => void
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
  activeModalPkg,
  setActiveModalPkg,
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
            <div key={n} className="rounded-3xl border border-charcoal/10 bg-white p-8 md:p-10 animate-pulse h-[520px]">
              <div className="h-6 bg-charcoal/05 rounded-full w-1/3 mb-4" />
              <div className="h-8 bg-charcoal/05 rounded w-1/2 mb-3" />
              <div className="h-10 bg-charcoal/05 rounded w-1/3 mb-8" />
              <div className="space-y-4">
                <div className="h-4 bg-charcoal/05 rounded w-3/4" />
                <div className="h-4 bg-charcoal/05 rounded w-2/3" />
                <div className="h-4 bg-charcoal/05 rounded w-4/5" />
                <div className="h-4 bg-charcoal/05 rounded w-1/2" />
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

      {/* 1. DESKTOP GRID LAYOUT (Task 3: Redesigned Collection Cards) */}
      {!loading && packages.length > 0 && (
        <div className="hidden md:grid grid-cols-2 gap-8 max-w-5xl mx-auto">
          {packages.map((pkg, i) => {
            const isSelected = selected === pkg.package_key
            const name = getPackageDisplayName(pkg, locale)
            const desc = getPackageDisplayDescription(pkg, locale)
            const badge = getPackageDisplayBadge(pkg, locale) || (locale === 'ar' ? 'تغطية اليوم الكامل' : 'Full Day Coverage')
            const featureGroups = getPackageDisplayFeatures(pkg, locale)

            return (
              <motion.button
                key={pkg.id}
                type="button"
                onClick={() => onSelect(pkg.package_key)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className={clsx(
                  'text-left rounded-3xl p-8 lg:p-10 flex flex-col transition-all duration-500 relative group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50',
                  isSelected
                    ? 'border-2 border-forest bg-forest/[0.03] shadow-xl'
                    : 'border border-charcoal/12 bg-white hover:border-charcoal/30 hover:shadow-md',
                )}
                style={pkg.accent_color && isSelected ? { borderColor: pkg.accent_color } : undefined}
                aria-pressed={isSelected}
              >
                {/* Header with Elegant White Pill/Badge */}
                <div className="mb-6">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="inline-flex items-center font-sans text-[10px] tracking-[0.22em] uppercase px-3.5 py-1.5 rounded-full bg-white border border-charcoal/10 text-charcoal/80 font-semibold shadow-xs">
                      {badge}
                    </span>

                    {isSelected && (
                      <span className="inline-flex items-center gap-1 font-sans text-[10px] tracking-wider uppercase text-forest font-semibold bg-forest/10 px-3 py-1 rounded-full">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {locale === 'ar' ? 'تم الاختيار' : 'Selected'}
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-2xl lg:text-3xl text-charcoal mb-2 font-medium">
                    {name}
                  </h3>

                  <div className="flex items-baseline gap-2">
                    <p className="font-serif text-3xl lg:text-4xl text-forest font-normal">
                      ${pkg.price.toLocaleString()}
                    </p>
                    <span className="font-sans text-[11px] uppercase tracking-wider text-charcoal/40">USD</span>
                  </div>

                  {desc && (
                    <p className="font-sans text-xs text-charcoal/60 mt-3 leading-relaxed">
                      {desc}
                    </p>
                  )}
                </div>

                <div className="divider-hairline mb-6" />

                {/* Features Group */}
                <div className="space-y-5 mb-8 flex-1">
                  {featureGroups.map((group, gIdx) => (
                    <div key={gIdx}>
                      <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-charcoal/45 mb-2.5 font-semibold">
                        {group.title}
                      </p>
                      <ul className="space-y-2">
                        {group.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex gap-2.5 font-sans text-xs text-charcoal/75 leading-relaxed">
                            <span className="text-forest/80 font-bold mt-0.5">—</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <div
                  className={clsx(
                    'mt-auto text-center font-sans text-xs tracking-[0.18em] uppercase py-3.5 rounded-xl border transition-all duration-300 w-full font-medium',
                    isSelected
                      ? 'bg-forest text-cream border-forest shadow-sm'
                      : 'border-charcoal/20 text-charcoal/80 hover:bg-charcoal/5',
                  )}
                >
                  {isSelected ? (locale === 'ar' ? 'المجموعة مختارة' : 'Collection Selected') : (locale === 'ar' ? 'اختيار هذه المجموعة' : 'Select Collection')}
                </div>
              </motion.button>
            )
          })}
        </div>
      )}

      {/* 2. MOBILE COMPACT LAYOUT */}
      {!loading && packages.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {packages.map((pkg) => {
            const isSelected = selected === pkg.package_key
            const name = getPackageDisplayName(pkg, locale)
            const badge = getPackageDisplayBadge(pkg, locale) || (locale === 'ar' ? 'تغطية اليوم الكامل' : 'Full Day')

            return (
              <div
                key={pkg.id}
                className={clsx(
                  'rounded-2xl border p-6 flex flex-col min-h-[160px] transition-all duration-300 bg-white',
                  isSelected
                    ? 'border-2 border-forest bg-forest/[0.03] shadow-md'
                    : 'border-charcoal/15 shadow-sm',
                )}
              >
                {/* White pill badge */}
                <div className="mb-3">
                  <span className="inline-block font-sans text-[9px] tracking-[0.2em] uppercase px-3 py-1 rounded-full bg-sand border border-charcoal/10 text-charcoal/70 font-semibold">
                    {badge}
                  </span>
                </div>

                {/* Name + price */}
                <div className="flex-1 mb-5">
                  <span className="font-serif text-2xl font-medium text-charcoal block">{name}</span>
                  <p className="font-serif text-3xl text-forest mt-1">${pkg.price.toLocaleString()}</p>
                </div>

                {/* Bottom actions */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveModalPkg(pkg)}
                    className="font-sans text-xs tracking-wider uppercase border border-charcoal/20 text-charcoal/75 py-3 rounded-xl bg-linen/30 hover:bg-linen/60 transition-colors text-center font-medium"
                  >
                    {locale === 'ar' ? 'التفاصيل' : 'Details'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelect(pkg.package_key)}
                    className={clsx(
                      'font-sans text-xs tracking-wider uppercase py-3 rounded-xl border transition-colors text-center font-medium',
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
                const badge = getPackageDisplayBadge(activeModalPkg, locale) || (locale === 'ar' ? 'تغطية اليوم الكامل' : 'Full Day')
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
                          ? (locale === 'ar' ? 'المجموعة مختارة بالفعل' : 'Collection Already Selected')
                          : (locale === 'ar' ? 'اختيار هذه المجموعة' : 'Select this Collection')}
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
