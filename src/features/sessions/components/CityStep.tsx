import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { clsx } from 'clsx'
import { useI18n } from '@/lib/i18n'

interface CityStepProps {
  selected: string | null
  onSelect: (city: string) => void
  wizardType?: 'session' | 'full-day'
}

const CITIES = [
  {
    id: 'baghdad',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10 text-forest/70">
        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="0.8" />
        <path d="M14 28V16l6-6 6 6v12" stroke="currentColor" strokeWidth="0.8" />
        <path d="M18 28v-6h4v6" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="20" cy="14" r="2" stroke="currentColor" strokeWidth="0.6" />
      </svg>
    ),
  },
  {
    id: 'erbil',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10 text-forest/70">
        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="0.8" />
        <path d="M12 28h16M15 28V18l5-4 5 4v10" stroke="currentColor" strokeWidth="0.8" />
        <path d="M18 28v-5h4v5" stroke="currentColor" strokeWidth="0.8" />
      </svg>
    ),
  },
]

export function CityStep({ selected, onSelect, wizardType }: CityStepProps) {
  const { t, locale } = useI18n()
  const isFullDay = wizardType === 'full-day'
  const [showCities, setShowCities] = useState(false)

  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="font-serif text-4xl md:text-6xl text-charcoal mb-16">
          {t.sessions.selectCity}
        </h1>
      </motion.div>

      <motion.div
        key="cities-grid"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg"
      >
        {CITIES.map((city, i) => {
          const isSelected = selected === city.id
          return (
            <motion.button
              key={city.id}
              type="button"
              onClick={() => onSelect(city.id)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={clsx(
                'group rounded-2xl border p-10 flex flex-col items-center gap-5 transition-all duration-500',
                isSelected
                  ? 'border-forest bg-forest/[0.04] shadow-[0_0_0_1px_rgba(18,55,42,0.3)]'
                  : 'border-charcoal/15 hover:border-forest/40 hover:shadow-[0_4px_24px_rgba(18,55,42,0.08)]',
              )}
              aria-pressed={isSelected}
            >
              {city.icon}
              <span className="font-serif text-2xl text-charcoal">
                {t.sessions.cities[city.id as 'baghdad' | 'erbil']}
              </span>
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}
