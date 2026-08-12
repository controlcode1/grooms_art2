import { motion } from 'motion/react'
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
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10 md:w-12 md:h-12 transition-colors duration-500">
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
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10 md:w-12 md:h-12 transition-colors duration-500">
        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="0.8" />
        <path d="M12 28h16M15 28V18l5-4 5 4v10" stroke="currentColor" strokeWidth="0.8" />
        <path d="M18 28v-5h4v5" stroke="currentColor" strokeWidth="0.8" />
      </svg>
    ),
  },
]

export function CityStep({ selected, onSelect }: CityStepProps) {
  const { t, locale } = useI18n()
  const bgImage = '/images/fullday-bg.jpg'

  return (
    /*
     * This wrapper fills remaining viewport height under the navbar.
     * We use a negative margin trick to escape the Section padding
     * so the background bleeds edge-to-edge.
     */
    <div
      className="relative -mx-6 md:-mx-12 lg:-mx-20 -mt-20 md:-mt-28 flex items-center justify-center"
      style={{ minHeight: '100svh' }}
    >
      {/* Full-bleed background image — covers entire element */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${bgImage}')` }}
        aria-hidden="true"
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      {/* Frosted-glass card — centered in viewport, respects mobile padding */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-xl mx-auto my-auto px-4 py-10 md:py-0"
      >
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl flex flex-col items-center text-center">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 md:mb-10"
          >
            <h1
              className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-3"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
            >
              {t.sessions.selectCity}
            </h1>
            <p
              className="font-sans text-[10px] md:text-xs tracking-[0.2em] uppercase text-white/65"
              style={{ textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}
            >
              {locale === 'ar' ? 'اختر مدينة الجلسة للمتابعة' : 'Please select your city to continue'}
            </p>
          </motion.div>

          {/* Cities Grid */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full">
            {CITIES.map((city, i) => {
              const isSelected = selected === city.id
              return (
                <motion.button
                  key={city.id}
                  type="button"
                  onClick={() => onSelect(city.id)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className={clsx(
                    'group rounded-xl sm:rounded-2xl border p-5 sm:p-7 md:p-8 flex flex-col items-center gap-3 sm:gap-4 transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                    isSelected
                      ? 'border-white bg-white text-gray-800 shadow-lg'
                      : 'border-white/15 bg-white/5 text-white/85 hover:bg-white/12 hover:border-white/35 hover:text-white',
                  )}
                  aria-pressed={isSelected}
                >
                  <span className={clsx(isSelected ? 'text-gray-700' : 'text-white/65 group-hover:text-white/90')}>
                    {city.icon}
                  </span>
                  <span className="font-serif text-xl sm:text-2xl font-medium">
                    {t.sessions.cities[city.id as 'baghdad' | 'erbil']}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
