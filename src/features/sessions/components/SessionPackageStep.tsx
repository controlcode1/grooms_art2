import { motion } from 'motion/react'
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
    popular: true,
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
  const { t } = useI18n()

  return (
    <div>
      <h2 className="font-serif text-2xl md:text-3xl text-charcoal mb-8">
        {t.sessions.packageTitle}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SESSION_PACKAGES.map((pkg, i) => {
          const isSelected = selected === pkg.id
          const isPopular = 'popular' in pkg && pkg.popular
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
                'text-left rounded-2xl flex flex-col h-full transition-all duration-500 relative overflow-hidden',
                isPopular
                  ? isSelected
                    ? 'border-2 border-forest bg-forest/[0.04] p-[27px]'
                    : 'border-2 border-forest/25 hover:border-forest/50 p-[27px]'
                  : isSelected
                    ? 'border border-forest bg-forest/[0.04] p-7'
                    : 'border border-charcoal/15 hover:border-charcoal/40 p-7',
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
                  'mt-auto pt-4 text-center font-sans text-xs tracking-[0.15em] uppercase py-2.5 rounded-md border transition-colors duration-500',
                  isSelected
                    ? 'bg-forest text-cream border-forest'
                    : 'border-charcoal/30 text-charcoal/70',
                )}
              >
                {isSelected ? 'Selected' : 'Select Package'}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
