import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { clsx } from 'clsx'
import { useI18n } from '@/lib/i18n'

interface SessionPackageStepProps {
  selected: string | null
  city: string | null
  onSelect: (packageId: string) => void
}

// Baghdad base prices — Erbil adds $200 to each
const SESSION_PACKAGES = [
  {
    id: 'essential',
    name: 'Essential',
    priceBase: 250,
    sections: [
      {
        title: 'Album',
        items: ['30×60 cm', '5 Pages', '15–20 Photos'],
      },
      {
        title: 'Includes',
        items: ['Wall Frame', '2 Table Frames'],
      },
      {
        title: 'Gift',
        items: ['A Little Piece of Your Story', '5 Printed Photos'],
      },
    ],
  },
  {
    id: 'signature',
    name: 'Signature',
    priceBase: 400,
    sections: [
      {
        title: 'Album',
        items: ['30×60 cm', '7 Pages', '25–30 Photos'],
      },
      {
        title: 'Wedding Reel',
        items: ['30–60 Seconds'],
      },
      {
        title: 'Includes',
        items: ['Wall Frame', '2 Table Frames'],
      },
      {
        title: 'Gift',
        items: ['Your Little Memory Box', 'Photo Box', '10 Printed Photos'],
      },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    priceBase: 600,
    sections: [
      {
        title: 'Bag Album',
        items: ['30×80 cm', '10 Pages', '33–45 Photos'],
      },
      {
        title: 'Promo Film',
        items: ['3–5 Minutes'],
      },
      {
        title: 'Includes',
        items: ['Wall Frame', '2 Table Frames'],
      },
      {
        title: 'Gift',
        items: ['Mini Album'],
      },
    ],
  },
]

function getPriceForCity(basePrice: number, city: string | null): string {
  const erbilSurcharge = 200
  const finalPrice = city === 'erbil' ? basePrice + erbilSurcharge : basePrice
  return `$${finalPrice.toLocaleString()}`
}

export function SessionPackageStep({ selected, city, onSelect }: SessionPackageStepProps) {
  const { t, locale } = useI18n()
  const [activeModalPkgId, setActiveModalPkgId] = useState<string | null>(null)

  const activePkg = SESSION_PACKAGES.find((p) => p.id === activeModalPkgId)

  return (
    <div>
      <h2 className="font-serif text-2xl md:text-3xl text-charcoal mb-8">
        {t.sessions.packageTitle}
      </h2>

      {/* 1. DESKTOP LAYOUT (hidden on mobile, grid on desktop) */}
      <div className="hidden md:grid grid-cols-3 gap-6">
        {SESSION_PACKAGES.map((pkg, i) => {
          const isSelected = selected === pkg.id
          const price = getPriceForCity(pkg.priceBase, city)
          return (
            <motion.button
              key={pkg.id}
              type="button"
              onClick={() => onSelect(pkg.id)}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={clsx(
                'text-left rounded-2xl p-7 flex flex-col h-full transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50',
                isSelected
                  ? 'border-2 border-forest bg-forest/[0.04]'
                  : 'border border-charcoal/15 hover:border-charcoal/40',
              )}
              aria-pressed={isSelected}
            >
              <div>
                <p className="font-serif text-xl text-charcoal mb-1">{pkg.name}</p>
                <p className="font-serif text-2xl md:text-3xl text-forest mb-5">{price}</p>

                <div className="divider-hairline mb-5" />

                {pkg.sections.map((section) => (
                  <div key={section.title} className="mb-4">
                    <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-charcoal/40 mb-2">
                      {section.title}
                    </p>
                    <ul className="space-y-1">
                      {section.items.map((item) => (
                        <li key={item} className="flex gap-2 font-sans text-xs text-charcoal/70">
                          <span className="text-forest/60 mt-0.5">—</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div
                className={clsx(
                  'mt-auto pt-4 text-center font-sans text-xs tracking-[0.15em] uppercase py-2.5 rounded-md border transition-colors duration-500 w-full',
                  isSelected
                    ? 'bg-forest text-cream border-forest'
                    : 'border-charcoal/30 text-charcoal/70 hover:bg-charcoal/5',
                )}
              >
                {isSelected ? 'Selected' : 'Select Package'}
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* 2. MOBILE LAYOUT (vertical stacked cards, hidden on desktop) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {SESSION_PACKAGES.map((pkg) => {
          const isSelected = selected === pkg.id
          const price = getPriceForCity(pkg.priceBase, city)
          return (
            <div
              key={pkg.id}
              className={clsx(
                'rounded-xl border p-5 flex flex-col min-h-[140px] transition-all duration-300 bg-white',
                isSelected
                  ? 'border-forest bg-forest/[0.04] shadow-sm'
                  : 'border-charcoal/15',
              )}
            >
              {/* Top: name + price */}
              <div className="flex-1 mb-4">
                <span className="font-serif text-lg font-medium text-charcoal block">{pkg.name}</span>
                <p className="font-serif text-xl text-forest mt-1">{price}</p>
              </div>

              {/* Bottom: 2-col button grid */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModalPkgId(pkg.id)}
                  className="font-sans text-xs tracking-wider uppercase border border-charcoal/20 text-charcoal/70 py-2.5 rounded-lg bg-sand/40 hover:bg-sand transition-colors text-center"
                >
                  {locale === 'ar' ? 'التفاصيل' : 'Details'}
                </button>
                <button
                  type="button"
                  onClick={() => onSelect(pkg.id)}
                  className={clsx(
                    'font-sans text-xs tracking-wider uppercase py-2.5 rounded-lg border transition-colors text-center',
                    isSelected
                      ? 'bg-forest border-forest text-cream'
                      : 'border-forest text-forest hover:bg-forest/[0.04]',
                  )}
                >
                  {isSelected ? (locale === 'ar' ? 'مختارة' : 'Selected') : (locale === 'ar' ? 'اختر' : 'Select')}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* 3. ELEGANT MOBILE DETAIL MODAL */}
      <AnimatePresence>
        {activeModalPkgId && activePkg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-sand w-full max-w-md rounded-2xl p-6 shadow-2xl border border-charcoal/10 max-h-[80vh] overflow-y-auto flex flex-col text-left"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-serif text-2xl text-charcoal">{activePkg.name}</h3>
                  <p className="font-serif text-3xl text-forest mt-1">
                    {getPriceForCity(activePkg.priceBase, city)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModalPkgId(null)}
                  className="font-sans text-sm text-charcoal/50 hover:text-charcoal p-1"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <div className="divider-hairline mb-6" />

              {/* Package contents */}
              <div className="space-y-5 flex-1 overflow-y-auto mb-8 pr-1">
                {activePkg.sections.map((section) => (
                  <div key={section.title}>
                    <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-charcoal/40 mb-2">
                      {section.title}
                    </p>
                    <ul className="space-y-2">
                      {section.items.map((item) => (
                        <li key={item} className="flex gap-2.5 font-sans text-sm text-charcoal/75">
                          <span className="text-forest/60">—</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Selection button inside modal */}
              <button
                type="button"
                onClick={() => {
                  onSelect(activePkg.id)
                  setActiveModalPkgId(null)
                }}
                className={clsx(
                  'w-full text-center font-sans text-xs tracking-[0.18em] uppercase py-3.5 rounded-lg border transition-colors duration-500',
                  selected === activePkg.id
                    ? 'bg-forest text-cream border-forest'
                    : 'bg-forest text-cream border-forest hover:bg-forest-deep',
                )}
              >
                {selected === activePkg.id
                  ? (locale === 'ar' ? 'الباقة مختارة بالفعل' : 'Package Already Selected')
                  : (locale === 'ar' ? 'اختيار هذه الباقة' : 'Select this Package')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
