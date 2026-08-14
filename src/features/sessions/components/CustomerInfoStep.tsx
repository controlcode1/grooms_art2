import { useState } from 'react'
import { motion } from 'motion/react'
import { clsx } from 'clsx'
import { useI18n } from '@/lib/i18n'
import type { BookingCustomerInfo } from '@/lib/types/booking'

// Re-export the canonical type so existing imports of CustomerInfoData still work
export type CustomerInfoData = BookingCustomerInfo

interface CustomerInfoStepProps {
  data: CustomerInfoData
  onChange: (data: CustomerInfoData) => void
}

function FieldLabel({ label, badge }: { label: string; badge: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="font-sans text-xs tracking-[0.15em] uppercase text-charcoal/60">
        {label}
      </span>
      <span className="font-sans text-[9px] tracking-[0.15em] uppercase text-charcoal/35 border border-charcoal/20 rounded px-1.5 py-0.5">
        {badge}
      </span>
    </div>
  )
}

export function CustomerInfoStep({ data, onChange }: CustomerInfoStepProps) {
  const { t } = useI18n()
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const handleChange = (field: keyof CustomerInfoData, value: string) => {
    onChange({ ...data, [field]: value })
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const nameError = touched.fullName && !data.fullName.trim()
  const phoneError = touched.phone && !data.phone.trim()

  const inputBase = clsx(
    'w-full font-sans text-sm text-charcoal bg-transparent border rounded-xl px-4 py-3.5',
    'placeholder:text-charcoal/30 outline-none transition-all duration-300',
    'focus:border-forest focus:shadow-[0_0_0_3px_rgba(18,55,42,0.07)]',
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <h2 className="font-serif text-2xl md:text-3xl text-charcoal mb-2">
        {t.customerInfo.title}
      </h2>
      <p className="font-sans text-sm text-charcoal/55 mb-10 max-w-lg">
        {t.customerInfo.subtitle}
      </p>

      <div className="max-w-lg space-y-6">
        {/* Full Name */}
        <div>
          <FieldLabel label={t.customerInfo.fullName} badge={t.customerInfo.required} />
          <input
            type="text"
            value={data.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            onBlur={() => handleBlur('fullName')}
            placeholder={t.customerInfo.fullNamePlaceholder}
            className={clsx(
              inputBase,
              nameError
                ? 'border-red-400/60 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.07)]'
                : 'border-charcoal/15',
            )}
            autoComplete="name"
          />
          {nameError && (
            <p className="font-sans text-xs text-red-400/80 mt-1.5">
              {t.customerInfo.fullName} {t.customerInfo.required.toLowerCase()}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <FieldLabel label={t.customerInfo.phone} badge={t.customerInfo.required} />
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            onBlur={() => handleBlur('phone')}
            placeholder={t.customerInfo.phonePlaceholder}
            className={clsx(
              inputBase,
              phoneError
                ? 'border-red-400/60 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.07)]'
                : 'border-charcoal/15',
            )}
            autoComplete="tel"
            dir="ltr"
          />
          {phoneError ? (
            <p className="font-sans text-xs text-red-400/80 mt-1.5">
              {t.customerInfo.phone} {t.customerInfo.required.toLowerCase()}
            </p>
          ) : (
            <p className="font-sans text-[11px] text-charcoal/45 mt-1.5 leading-normal">
              {useI18n().locale === 'ar'
                ? 'سنستخدم هذا الرقم للتواصل معك بشأن الحجز عبر الواتساب.'
                : 'We will use this number to contact you about your booking via WhatsApp.'}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <FieldLabel label={t.customerInfo.email} badge={t.customerInfo.optional} />
          <input
            type="email"
            value={data.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder={t.customerInfo.emailPlaceholder}
            className={clsx(inputBase, 'border-charcoal/15')}
            autoComplete="email"
            dir="ltr"
          />
        </div>

        {/* Notes */}
        <div>
          <FieldLabel label={t.customerInfo.notes} badge={t.customerInfo.optional} />
          <textarea
            value={data.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder={t.customerInfo.notesPlaceholder}
            rows={4}
            className={clsx(inputBase, 'border-charcoal/15 resize-none leading-relaxed')}
          />
        </div>
      </div>
    </motion.div>
  )
}
