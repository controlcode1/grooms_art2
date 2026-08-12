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
      <svg viewBox="0 0 40 40" fill="none" className="w-12 h-12 transition-colors duration-500">
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
      <svg viewBox="0 0 40 40" fill="none" className="w-12 h-12 transition-colors duration-500">
        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="0.8" />
        <path d="M12 28h16M15 28V18l5-4 5 4v10" stroke="currentColor" strokeWidth="0.8" />
        <path d="M18 28v-5h4v5" stroke="currentColor" strokeWidth="0.8" />
      </svg>
    ),
  },
]

export function CityStep({ selected, onSelect }: CityStepProps) {
  const { t, locale } = useI18n()

  // User's background image
  const bgImage = '/images/fullday-bg.jpg'

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center p-4 z-10 overflow-hidden">
      {/* 100% Viewport background cover with no borders or margins */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat scale-[1.02] filter blur-[2px]"
        style={{
          backgroundImage: `url('${bgImage}')`,
        }}
        aria-hidden="true"
      />

      {/* Dark warm overlay for readability */}
      <div className="absolute inset-0 bg-charcoal/50" aria-hidden="true" />

      {/* Center Frosted Glass Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 w-full max-w-2xl bg-cream/10 backdrop-blur-xl border border-cream/20 rounded-3xl p-8 md:p-14 shadow-2xl flex flex-col items-center text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-10"
        >
          <h1
            className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream mb-4"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
          >
            {t.sessions.selectCity}
          </h1>
          <p
            className="font-sans text-xs md:text-sm tracking-[0.2em] uppercase text-cream/70"
            style={{ textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}
          >
            {locale === 'ar' ? 'اختر مدينة الجلسة للمتابعة' : 'Please select your city to continue'}
          </p>
        </motion.div>

        {/* Cities Grid inside the Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-md">
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
                  'group rounded-2xl border p-8 flex flex-col items-center gap-4 transition-all duration-500 shadow-md',
                  isSelected
                    ? 'border-cream bg-cream text-charcoal shadow-lg shadow-cream/5'
                    : 'border-white/10 bg-white/5 text-cream/90 hover:bg-white/10 hover:border-white/30 hover:text-cream',
                )}
                aria-pressed={isSelected}
              >
                <span className={clsx(isSelected ? 'text-charcoal' : 'text-cream/70 group-hover:text-cream')}>
                  {city.icon}
                </span>
                <span className="font-serif text-2xl font-medium">
                  {t.sessions.cities[city.id as 'baghdad' | 'erbil']}
                </span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
