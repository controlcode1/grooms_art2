import { useState, useRef, useEffect } from 'react'
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
      <svg viewBox="0 0 40 40" fill="none" className="w-5 h-5 text-cream/70">
        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1" />
        <path d="M14 28V16l6-6 6 6v12" stroke="currentColor" strokeWidth="1" />
        <path d="M18 28v-6h4v6" stroke="currentColor" strokeWidth="1" />
        <circle cx="20" cy="14" r="2" stroke="currentColor" strokeWidth="0.8" />
      </svg>
    ),
  },
  {
    id: 'erbil',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-5 h-5 text-cream/70">
        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1" />
        <path d="M12 28h16M15 28V18l5-4 5 4v10" stroke="currentColor" strokeWidth="1" />
        <path d="M18 28v-5h4v5" stroke="currentColor" strokeWidth="1" />
      </svg>
    ),
  },
]

export function CityStep({ selected, onSelect, wizardType }: CityStepProps) {
  const { t, locale } = useI18n()
  const isFullDay = wizardType === 'full-day'
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Use frame-19 for full-day (from FullDayHero) and frame-01 for session
  const bgImage = isFullDay
    ? '/images/portfolio/frame-19-lg.webp'
    : '/images/portfolio/frame-01-lg.webp'

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedCityObj = CITIES.find((c) => c.id === selected)
  const triggerLabel = selected
    ? t.sessions.cities[selected as 'baghdad' | 'erbil']
    : (locale === 'ar' ? 'اختر المدينة...' : 'Select your City...')

  return (
    <div className="relative min-h-[60vh] w-full flex flex-col items-center justify-center py-20 px-6 overflow-hidden rounded-3xl">
      {/* Full-page Background Cover with subtle blur and scale to prevent white edges */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-[2.5px] scale-[1.05] transition-transform duration-[1200ms] -z-20"
        style={{
          backgroundImage: `url('${bgImage}')`,
        }}
      />
      
      {/* Premium dark mask for ultimate text legibility and contrast */}
      <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-[0.5px] -z-10" />

      {/* Content overlay */}
      <div className="relative z-20 flex flex-col items-center text-center max-w-xl w-full">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <h1 
            className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream drop-shadow-md"
            style={{ textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}
          >
            {t.sessions.selectCity}
          </h1>
          <p 
            className="font-sans text-xs md:text-sm tracking-[0.2em] uppercase text-cream/70 mt-3"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}
          >
            {locale === 'ar' ? 'يرجى تحديد مدينة الجلسة للمتابعة' : 'Please select your session city to continue'}
          </p>
        </motion.div>

        {/* Custom Premium Dropdown */}
        <div ref={dropdownRef} className="relative w-full max-w-xs mt-6">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={clsx(
              'w-full flex items-center justify-between px-6 py-4 rounded-xl border font-sans text-sm tracking-wide transition-all duration-300 shadow-lg',
              isOpen
                ? 'border-cream bg-cream/15 text-cream shadow-cream/5'
                : 'border-cream/25 bg-charcoal/30 text-cream hover:border-cream/50 hover:bg-charcoal/40',
            )}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <div className="flex items-center gap-3">
              {selectedCityObj && selectedCityObj.icon}
              <span className="font-serif text-lg">{triggerLabel}</span>
            </div>
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className={clsx(
                'w-4 h-4 text-cream/75 transition-transform duration-500',
                isOpen && 'rotate-180',
              )}
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.ul
                role="listbox"
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 4, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-0 right-0 z-50 overflow-hidden rounded-xl border border-cream/20 bg-charcoal/85 backdrop-blur-xl shadow-2xl py-1.5 divide-y divide-cream/5"
              >
                {CITIES.map((city) => {
                  const isSelected = selected === city.id
                  return (
                    <li key={city.id} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(city.id)
                          setIsOpen(false)
                        }}
                        className={clsx(
                          'w-full flex items-center gap-4 px-6 py-3.5 text-left font-serif text-lg transition-all duration-300',
                          isSelected
                            ? 'bg-cream text-charcoal'
                            : 'text-cream/90 hover:bg-cream/10 hover:text-cream',
                        )}
                      >
                        <span className={clsx('transition-colors', isSelected ? 'text-charcoal' : 'text-cream/70')}>
                          {city.icon}
                        </span>
                        <span>{t.sessions.cities[city.id as 'baghdad' | 'erbil']}</span>
                        {isSelected && (
                          <svg
                            viewBox="0 0 20 20"
                            fill="none"
                            className="w-4 h-4 ms-auto text-charcoal"
                          >
                            <path
                              d="M4 10L8 14L16 6"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    </li>
                  )
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
