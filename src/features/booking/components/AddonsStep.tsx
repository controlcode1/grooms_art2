import { clsx } from 'clsx'
import { addonsCatalog } from '@/lib/data/portfolio'
import { useI18n } from '@/lib/i18n'

interface AddonsStepProps {
  selected: string[]
  onToggle: (addonId: string) => void
}

export function AddonsStep({ selected, onToggle }: AddonsStepProps) {
  const { t } = useI18n()

  return (
    <div>
      <h2 className="font-serif text-2xl md:text-3xl text-charcoal mb-8">
        {t.booking.addons.title}
      </h2>
      <div className="flex flex-col gap-3 max-w-xl">
        {addonsCatalog.map((addon) => {
          const isChecked = selected.includes(addon.id)
          return (
            <label
              key={addon.id}
              className={clsx(
                'flex items-center justify-between gap-4 rounded-lg border px-5 py-4 cursor-pointer transition-colors duration-400',
                isChecked ? 'border-forest bg-forest/[0.04]' : 'border-charcoal/15 hover:border-charcoal/35',
              )}
            >
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggle(addon.id)}
                  className="w-4 h-4 accent-forest"
                />
                <span className="font-sans text-sm text-charcoal">{addon.name}</span>
              </span>
              <span className="font-sans text-xs text-sage">{addon.priceLabel}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
