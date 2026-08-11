import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { packages, addonsCatalog } from '@/lib/data/portfolio'
import { useI18n } from '@/lib/i18n'
import { ErrorState } from '@/features/shared/components/ErrorState'
import { submitBooking } from '../submitBooking'
import type { BookingState, SubmitStatus } from '../types'

interface DepositStepProps {
  state: BookingState
}

export function DepositStep({ state }: DepositStepProps) {
  const { t } = useI18n()
  const [status, setStatus] = useState<SubmitStatus>('idle')

  const pkg = packages.find((p) => p.id === state.packageId)
  const addons = addonsCatalog.filter((a) => state.addonIds.includes(a.id))

  const handleSubmit = async () => {
    setStatus('submitting')
    try {
      await submitBooking(state)
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md"
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-12 h-12 rounded-full bg-forest text-cream flex items-center justify-center mb-6"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 10.5L8 14.5L16 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
        <h2 className="font-serif text-2xl md:text-3xl text-charcoal mb-3">
          {t.booking.successTitle}
        </h2>
        <p className="font-sans text-sm text-charcoal/60 leading-relaxed">
          {t.booking.successBody}
        </p>
      </motion.div>
    )
  }

  return (
    <div>
      <h2 className="font-serif text-2xl md:text-3xl text-charcoal mb-2">
        {t.booking.deposit.title}
      </h2>
      <p className="font-sans text-sm text-charcoal/55 mb-8 max-w-lg">
        {t.booking.deposit.body}
      </p>

      <div className="max-w-md rounded-xl overflow-hidden border border-charcoal/15 divide-y divide-charcoal/10 mb-8">
        <SummaryRow label={t.booking.steps.package} value={pkg?.name ?? '—'} />
        <SummaryRow label={t.booking.steps.date} value={state.date ?? '—'} />
        <SummaryRow
          label={t.booking.steps.addons}
          value={addons.length ? addons.map((a) => a.name).join(', ') : '—'}
        />
      </div>

      <AnimatePresence mode="wait">
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6"
          >
            <ErrorState
              title={t.booking.errorTitle}
              body={t.booking.errorBody}
              retryLabel={t.booking.retry}
              onRetry={handleSubmit}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={status === 'submitting'}
        className="font-sans text-xs tracking-[0.2em] uppercase bg-forest text-cream px-8 py-4 hover:bg-forest-deep transition-colors duration-500 disabled:opacity-50"
      >
        {status === 'submitting' ? t.common.loading + '…' : t.booking.deposit.button}
      </button>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="font-sans text-xs tracking-[0.15em] uppercase text-charcoal/45">
        {label}
      </span>
      <span className="font-sans text-sm text-charcoal text-right">{value}</span>
    </div>
  )
}
