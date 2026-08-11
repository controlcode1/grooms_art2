import { motion } from 'motion/react'
import { clsx } from 'clsx'
import { packages } from '@/lib/data/portfolio'
import { useI18n } from '@/lib/i18n'

interface PackageStepProps {
  selected: string | null
  onSelect: (packageId: string) => void
}

export function PackageStep({ selected, onSelect }: PackageStepProps) {
  const { t } = useI18n()

  return (
    <div>
      <h2 className="font-serif text-2xl md:text-3xl text-charcoal mb-8">
        {t.booking.package.title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg, i) => {
          const isSelected = selected === pkg.id
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
                'text-left rounded-2xl border p-7 flex flex-col h-full transition-colors duration-500',
                isSelected
                  ? 'border-forest bg-forest/[0.04]'
                  : 'border-charcoal/15 hover:border-charcoal/40',
              )}
              aria-pressed={isSelected}
            >
              <p className="font-serif text-xl text-charcoal mb-1">{pkg.name}</p>
              <p className="font-sans text-xs tracking-[0.15em] uppercase text-sage mb-4">
                {pkg.priceLabel} · {pkg.durationLabel}
              </p>
              <p className="font-sans text-sm text-charcoal/60 leading-relaxed mb-5">
                {pkg.description}
              </p>
              <ul className="mt-auto space-y-2 font-sans text-xs text-charcoal/70">
                {pkg.deliverables.map((d) => (
                  <li key={d} className="flex gap-2">
                    <span className="text-forest">—</span>
                    {d}
                  </li>
                ))}
              </ul>
              <div
                className={clsx(
                  'mt-6 text-center font-sans text-xs tracking-[0.15em] uppercase py-2.5 rounded-md border transition-colors duration-500',
                  isSelected
                    ? 'bg-forest text-cream border-forest'
                    : 'border-charcoal/30 text-charcoal/70',
                )}
              >
                {isSelected ? t.booking.package.selected : t.booking.package.selectCta}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
