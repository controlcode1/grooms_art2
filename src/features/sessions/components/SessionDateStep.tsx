import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { clsx } from 'clsx'
import { useI18n } from '@/lib/i18n'

interface SessionDateStepProps {
  selected: string | null
  onSelect: (date: string) => void
  /** ISO dates blocked by the photographer (from dashboard Availability) */
  blockedDates?: Set<string>
}

function toLocalISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_NAMES_AR = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
const MONTH_NAMES_FULL_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTH_NAMES_FULL_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

interface DayInfo {
  iso: string | null // null = empty cell
  day: number | null
  isAvailable: boolean
  isToday: boolean
}

/**
 * Premium single-month calendar with prev/next navigation.
 */
export function SessionDateStep({ selected, onSelect, blockedDates }: SessionDateStepProps) {
  const { t, locale } = useI18n()

  // Start from today, limit to 12 months from today
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const minDate = useMemo(() => {
    const d = new Date(today)
    d.setDate(d.getDate() + 1) // tomorrow
    return d
  }, [today])

  const maxDate = useMemo(() => {
    const d = new Date(today)
    d.setMonth(d.getMonth() + 12)
    return d
  }, [today])

  // Current month being displayed (0-indexed)
  const [viewYear, setViewYear] = useState(minDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(minDate.getMonth())

  const dayNames = locale === 'ar' ? DAY_NAMES_AR : DAY_NAMES_EN
  const monthNames = locale === 'ar' ? MONTH_NAMES_FULL_AR : MONTH_NAMES_FULL_EN

  // Can we go prev/next?
  const canGoPrev = useMemo(() => {
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear
    return (
      prevYear > minDate.getFullYear() ||
      (prevYear === minDate.getFullYear() && prevMonth >= minDate.getMonth())
    )
  }, [viewMonth, viewYear, minDate])

  const canGoNext = useMemo(() => {
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear
    return (
      nextYear < maxDate.getFullYear() ||
      (nextYear === maxDate.getFullYear() && nextMonth <= maxDate.getMonth())
    )
  }, [viewMonth, viewYear, maxDate])

  const handlePrev = () => {
    if (!canGoPrev) return
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const handleNext = () => {
    if (!canGoNext) return
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  // Build grid cells
  const { cells, monthLabel } = useMemo(() => {
    const label = `${monthNames[viewMonth]} ${viewYear}`
    const firstDay = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

    const grid: DayInfo[] = []

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) {
      grid.push({ iso: null, day: null, isAvailable: false, isToday: false })
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d)
      const iso = toLocalISODate(date)
      const isAvailable = date >= minDate && date <= maxDate && (!blockedDates || !blockedDates.has(iso))
      const isToday = date.getTime() === today.getTime()
      grid.push({ iso, day: d, isAvailable, isToday })
    }

    // Trailing cells to complete last row
    while (grid.length % 7 !== 0) {
      grid.push({ iso: null, day: null, isAvailable: false, isToday: false })
    }

    return { cells: grid, monthLabel: label }
  }, [viewMonth, viewYear, minDate, maxDate, today, monthNames])

  return (
    <div className="flex flex-col items-center">
      <h2 className="font-serif text-2xl md:text-3xl text-charcoal mb-2 text-center">
        {t.sessions.dateTitle}
      </h2>
      <p className="font-sans text-sm text-charcoal/55 mb-8 text-center">{t.sessions.dateHelper}</p>

      <div className="max-w-md w-full mx-auto">
        {/* Calendar card (completely shadowless) */}
        <div className="border border-charcoal/10 rounded-2xl overflow-hidden bg-white">
          {/* Month header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-charcoal/08">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!canGoPrev}
              aria-label="Previous month"
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
                canGoPrev
                  ? 'text-charcoal/60 hover:bg-forest/05 hover:text-forest active:scale-95'
                  : 'opacity-20 cursor-not-allowed',
              )}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <AnimatePresence mode="wait">
              <motion.p
                key={monthLabel}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="font-serif text-lg text-charcoal"
              >
                {monthLabel}
              </motion.p>
            </AnimatePresence>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              aria-label="Next month"
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
                canGoNext
                  ? 'text-charcoal/60 hover:bg-forest/05 hover:text-forest active:scale-95'
                  : 'opacity-20 cursor-not-allowed',
              )}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 px-3 pt-4 pb-2">
            {dayNames.map((name) => (
              <div
                key={name}
                className="text-center font-sans text-[10px] tracking-[0.15em] uppercase text-charcoal/35 pb-2"
              >
                {name}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${viewYear}-${viewMonth}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="grid grid-cols-7 px-3 pb-5 gap-y-1"
            >
              {cells.map((cell, i) => {
                if (!cell.iso || !cell.day) {
                  return <div key={`empty-${i}`} />
                }

                const isSelected = selected === cell.iso

                if (!cell.isAvailable) {
                  return (
                    <button
                      key={cell.iso}
                      type="button"
                      disabled
                      className="flex items-center justify-center h-9 w-9 mx-auto font-sans text-sm text-charcoal/20 cursor-not-allowed"
                    >
                      {cell.day}
                    </button>
                  )
                }

                return (
                  <motion.button
                    key={cell.iso}
                    type="button"
                    whileTap={{ scale: 0.93 }}
                    onClick={() => onSelect(cell.iso!)}
                    className={clsx(
                      'flex items-center justify-center h-9 w-9 mx-auto rounded-full',
                      'font-sans text-sm transition-all duration-200 relative',
                      isSelected
                        ? 'bg-forest text-cream font-medium'
                        : cell.isToday
                          ? 'border border-forest/30 text-forest hover:bg-forest/05'
                          : 'text-charcoal hover:bg-forest/05 hover:text-forest',
                    )}
                    aria-label={cell.iso}
                    aria-pressed={isSelected}
                  >
                    {cell.day}
                  </motion.button>
                )
              })}
            </motion.div>
          </AnimatePresence>

          {/* Legend */}
          <div className="px-5 pb-4 flex items-center gap-6 border-t border-charcoal/06 pt-3">
            <span className="flex items-center gap-1.5 font-sans text-[10px] text-charcoal/40">
              <span className="w-2.5 h-2.5 rounded-full bg-forest" />
              {t.sessions.available}
            </span>
            <span className="flex items-center gap-1.5 font-sans text-[10px] text-charcoal/40">
              <span className="w-2.5 h-2.5 rounded-full border border-charcoal/20 bg-charcoal/05" />
              {t.sessions.booked}
            </span>
          </div>
        </div>

        {selected && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-4 font-sans text-sm text-forest/80 text-center"
          >
            ✓ {selected}
          </motion.p>
        )}
      </div>
    </div>
  )
}
