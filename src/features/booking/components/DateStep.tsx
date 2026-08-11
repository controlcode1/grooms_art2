import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'motion/react'
import { getAvailabilityForMonth, toLocalISODate, type AvailabilityStatus } from '../availability'
import { useI18n } from '@/lib/i18n'
import { ErrorState } from '@/features/shared/components/ErrorState'

interface DateStepProps {
  selected: string | null
  onSelect: (date: string) => void
}

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })

export function DateStep({ selected, onSelect }: DateStepProps) {
  const { t } = useI18n()
  const today = new Date()
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [availability, setAvailability] = useState<Record<string, AvailabilityStatus> | null>(null)
  const [error, setError] = useState(false)

  const load = () => {
    setAvailability(null)
    setError(false)
    getAvailabilityForMonth(cursor.year, cursor.month)
      .then(setAvailability)
      .catch(() => setError(true))
  }

  useEffect(load, [cursor])

  const firstOfMonth = new Date(cursor.year, cursor.month, 1)
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate()
  const leadingBlanks = firstOfMonth.getDay()
  const todayIso = toLocalISODate(today)

  return (
    <div>
      <h2 className="font-serif text-2xl md:text-3xl text-charcoal mb-2">
        {t.booking.date.title}
      </h2>
      <p className="font-sans text-sm text-charcoal/55 mb-8">{t.booking.date.helper}</p>

      {error ? (
        <ErrorState
          title={t.booking.errorTitle}
          body={t.booking.errorBody}
          retryLabel={t.common.retry}
          onRetry={load}
        />
      ) : !availability ? (
        <div className="skeleton h-96 max-w-md" />
      ) : (
        <div className="max-w-md">
          {/* Calendar card (completely shadowless) */}
          <div className="border border-charcoal/10 rounded-2xl overflow-hidden bg-white">
            {/* Month header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-charcoal/08">
              <button
                type="button"
                onClick={() =>
                  setCursor(({ year, month }) =>
                    month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 },
                  )
                }
                aria-label="Previous month"
                className="w-8 h-8 rounded-full flex items-center justify-center text-charcoal/60 hover:bg-forest/05 hover:text-forest active:scale-95 transition-all duration-300"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <AnimatePresence mode="wait">
                <motion.p
                  key={`${cursor.year}-${cursor.month}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="font-serif text-lg text-charcoal"
                >
                  {MONTH_FORMATTER.format(new Date(cursor.year, cursor.month, 1))}
                </motion.p>
              </AnimatePresence>

              <button
                type="button"
                onClick={() =>
                  setCursor(({ year, month }) =>
                    month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 },
                  )
                }
                aria-label="Next month"
                className="w-8 h-8 rounded-full flex items-center justify-center text-charcoal/60 hover:bg-forest/05 hover:text-forest active:scale-95 transition-all duration-300"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 px-3 pt-4 pb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center font-sans text-[10px] tracking-[0.15em] uppercase text-charcoal/35 pb-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${cursor.year}-${cursor.month}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="grid grid-cols-7 px-3 pb-5 gap-y-1"
              >
                {Array.from({ length: leadingBlanks }).map((_, i) => (
                  <div key={`blank-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const iso = toLocalISODate(new Date(cursor.year, cursor.month, day))
                  const status = availability[iso] ?? 'available'
                  const isPast = iso < todayIso
                  const isSelected = selected === iso
                  const disabled = isPast || status === 'unavailable'

                  if (disabled) {
                    return (
                      <button
                        key={iso}
                        type="button"
                        disabled
                        className="flex items-center justify-center h-9 w-9 mx-auto font-sans text-sm text-charcoal/20 cursor-not-allowed"
                      >
                        {day}
                      </button>
                    )
                  }

                  return (
                    <motion.button
                      key={iso}
                      type="button"
                      whileTap={{ scale: 0.93 }}
                      onClick={() => onSelect(iso)}
                      title={
                        status === 'available'
                          ? t.booking.date.available
                          : status === 'limited'
                            ? t.booking.date.limited
                            : t.booking.date.unavailable
                      }
                      className={clsx(
                        'flex items-center justify-center h-9 w-9 mx-auto rounded-full',
                        'font-sans text-sm transition-all duration-200 relative',
                        isSelected
                          ? 'bg-forest text-cream font-medium'
                          : iso === todayIso
                            ? 'border border-forest/30 text-forest hover:bg-forest/05'
                            : 'text-charcoal hover:bg-forest/05 hover:text-forest',
                      )}
                    >
                      {day}
                      {status === 'limited' && !isSelected && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-sage" />
                      )}
                    </motion.button>
                  )
                })}
              </motion.div>
            </AnimatePresence>

            {/* Legend */}
            <div className="px-5 pb-4 flex items-center gap-6 border-t border-charcoal/06 pt-3">
              <span className="flex items-center gap-1.5 font-sans text-[10px] text-charcoal/40">
                <span className="w-2.5 h-2.5 rounded-full bg-forest" />
                {t.booking.date.available}
              </span>
              <span className="flex items-center gap-1.5 font-sans text-[10px] text-charcoal/40">
                <span className="w-2.5 h-2.5 rounded-full bg-sage" />
                {t.booking.date.limited}
              </span>
              <span className="flex items-center gap-1.5 font-sans text-[10px] text-charcoal/40">
                <span className="w-2.5 h-2.5 rounded-full border border-charcoal/20 bg-charcoal/05" />
                {t.booking.date.unavailable}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
