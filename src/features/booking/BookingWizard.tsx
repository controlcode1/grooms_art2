import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { clsx } from 'clsx'
import { useI18n } from '@/lib/i18n'
import { PackageStep } from './components/PackageStep'
import { DateStep } from './components/DateStep'
import { AddonsStep } from './components/AddonsStep'
import { DepositStep } from './components/DepositStep'
import type { BookingState, BookingStep } from './types'

const STEPS: BookingStep[] = ['package', 'date', 'addons', 'deposit']

export function BookingWizard() {
  const { t } = useI18n()
  const [stepIndex, setStepIndex] = useState(0)
  const [state, setState] = useState<BookingState>({
    packageId: null,
    date: null,
    addonIds: [],
  })

  const step = STEPS[stepIndex]
  const canContinue =
    (step === 'package' && !!state.packageId) ||
    (step === 'date' && !!state.date) ||
    step === 'addons'

  const goNext = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0))

  return (
    <div>
      <ol className="flex flex-wrap gap-x-8 gap-y-3 mb-14">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={clsx(
                'w-6 h-6 rounded-full flex items-center justify-center font-sans text-[11px] border transition-colors duration-500',
                i < stepIndex && 'bg-forest border-forest text-cream',
                i === stepIndex && 'border-forest text-forest',
                i > stepIndex && 'border-charcoal/25 text-charcoal/35',
              )}
            >
              {i + 1}
            </span>
            <span
              className={clsx(
                'font-sans text-xs tracking-[0.15em] uppercase',
                i === stepIndex ? 'text-charcoal' : 'text-charcoal/40',
              )}
            >
              {t.booking.steps[s]}
            </span>
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {step === 'package' && (
            <PackageStep
              selected={state.packageId}
              onSelect={(packageId) => setState((s) => ({ ...s, packageId }))}
            />
          )}
          {step === 'date' && (
            <DateStep
              selected={state.date}
              onSelect={(date) => setState((s) => ({ ...s, date }))}
            />
          )}
          {step === 'addons' && (
            <AddonsStep
              selected={state.addonIds}
              onToggle={(addonId) =>
                setState((s) => ({
                  ...s,
                  addonIds: s.addonIds.includes(addonId)
                    ? s.addonIds.filter((id) => id !== addonId)
                    : [...s.addonIds, addonId],
                }))
              }
            />
          )}
          {step === 'deposit' && <DepositStep state={state} />}
        </motion.div>
      </AnimatePresence>

      {step !== 'deposit' && (
        <div className="flex items-center justify-between gap-4 mt-12 pt-8 border-t border-charcoal/10 w-full">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="font-sans text-xs tracking-[0.15em] uppercase border border-charcoal/30 text-charcoal/70 px-6 py-3 rounded-lg hover:bg-charcoal/5 transition-all text-center min-w-[100px]"
            >
              {t.booking.back}
            </button>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={goNext}
            disabled={!canContinue}
            className="font-sans text-xs tracking-[0.15em] uppercase bg-forest text-cream px-6 py-3 rounded-lg hover:bg-forest-deep transition-all disabled:opacity-40 disabled:cursor-not-allowed text-center min-w-[100px]"
          >
            {t.booking.continue}
          </button>
        </div>
      )}
    </div>
  )
}
