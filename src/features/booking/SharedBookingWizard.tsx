import { useState, useMemo, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { clsx } from 'clsx'
import { useI18n } from '@/lib/i18n'
import { Section } from '@/features/shared/components/Section'
import { CityStep } from '@/features/sessions/components/CityStep'
import { LocationStep } from '@/features/sessions/components/LocationStep'
import { SessionDateStep } from '@/features/sessions/components/SessionDateStep'
import { CustomerInfoStep, type CustomerInfoData } from '@/features/sessions/components/CustomerInfoStep'
import { getLocationsForCity, type Location } from '@/lib/data/locations'
import { storage, STORAGE_KEYS } from '@/lib/storage'
import type { Booking, BookingType } from '@/lib/types/booking'
import { supabase } from '@/lib/supabase/client'

type Step = 'city' | 'package' | 'location' | 'date' | 'customerInfo' | 'confirm'
const STEPS: Step[] = ['city', 'package', 'location', 'date', 'customerInfo', 'confirm']

interface SharedBookingWizardProps {
  type: BookingType
  /** Renders the package step component which varies between Sessions and Full Day */
  renderPackageStep: (
    city: string | null,
    selected: string | null,
    onSelect: (pkgId: string) => void
  ) => React.ReactNode
  /** Package name mapping for confirmation screen */
  packageNames: Record<string, string>
  /** Success message content override if any */
  successTitle?: string
  successBody?: string
}

const STEP_LABELS_EN: Record<Step, string> = {
  city: 'City',
  package: 'Package',
  location: 'Location',
  date: 'Date',
  customerInfo: 'Details',
  confirm: 'Confirm',
}

const STEP_LABELS_AR: Record<Step, string> = {
  city: 'المدينة',
  package: 'الباقة',
  location: 'الموقع',
  date: 'التاريخ',
  customerInfo: 'البيانات',
  confirm: 'التأكيد',
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

export function SharedBookingWizard({
  type,
  renderPackageStep,
  packageNames,
  successTitle,
  successBody,
}: SharedBookingWizardProps) {
  const { t, locale } = useI18n()
  const [stepIndex, setStepIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Reset scroll position to top on step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [stepIndex])

  const [state, setState] = useState({
    city: null as string | null,
    packageId: null as string | null,
    locationId: 'agreed-later' as string | null,
    date: null as string | null,
    customerInfo: {
      fullName: '',
      phone: '',
      email: '',
      notes: '',
    } as CustomerInfoData,
  })

  const step = STEPS[stepIndex]
  const stepLabels = locale === 'ar' ? STEP_LABELS_AR : STEP_LABELS_EN

  // Load custom locations & blocked dates from storage
  const customLocationsMap = storage.get<Record<string, Location[]>>(STORAGE_KEYS.locations) || {}
  const cityId = (state.city === 'erbil' ? 'erbil' : 'baghdad') as 'baghdad' | 'erbil'
  const locations = getLocationsForCity(cityId, customLocationsMap[cityId])
  const selectedLocationObj = locations.find((l) => l.id === state.locationId)
  const locationLabel =
    state.locationId === 'agreed-later'
      ? (locale === 'ar' ? 'سيتم الاتفاق مع المصور' : 'To be agreed with photographer')
      : selectedLocationObj
        ? locale === 'ar'
          ? selectedLocationObj.nameAr
          : selectedLocationObj.name
        : '—'

  const blockedDatesArray = storage.get<string[]>(STORAGE_KEYS.blockedDates) || []
  const fullyBookedArray = storage.get<string[]>('ga_fully_booked_dates') || []
  const blockedDatesSet = useMemo(() => {
    return new Set([...blockedDatesArray, ...fullyBookedArray])
  }, [blockedDatesArray, fullyBookedArray])

  const canContinue =
    (step === 'city' && !!state.city) ||
    (step === 'package' && !!state.packageId) ||
    (step === 'location' && !!state.locationId) ||
    (step === 'date' && !!state.date) ||
    (step === 'customerInfo' &&
      !!state.customerInfo.fullName.trim() &&
      !!state.customerInfo.phone.trim()) ||
    step === 'confirm'

  const goNext = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0))

  const handleConfirm = async () => {
    setSubmitting(true)

    const bookingId = `${type}-${Date.now()}`
    const dbRow = {
      type,
      status: 'pending',
      city: state.city ?? '',
      package_id: state.packageId ?? '',
      location_id: state.locationId ?? '',
      date: state.date ?? '',
      full_name: state.customerInfo.fullName,
      phone: state.customerInfo.phone,
      email: state.customerInfo.email || '',
      notes: state.customerInfo.notes || '',
      whatsapp_triggered: false,
    }

    let savedToSupabase = false
    if (supabase) {
      try {
        const { error } = await supabase.from('bookings').insert(dbRow)
        if (error) throw error
        savedToSupabase = true
      } catch (err) {
        console.error('Failed to save booking to Supabase, fallback to storage:', err)
      }
    }

    if (!savedToSupabase) {
      const newBooking: Booking = {
        id: bookingId,
        type,
        status: 'pending',
        city: state.city ?? '',
        packageId: state.packageId ?? '',
        location: state.locationId ?? '',
        date: state.date ?? '',
        customerInfo: state.customerInfo,
        createdAt: new Date().toISOString(),
      }
      try {
        const existing = storage.get<Booking[]>(STORAGE_KEYS.bookings) || []
        existing.unshift(newBooking)
        storage.set(STORAGE_KEYS.bookings, existing)
      } catch {
        // silently handle storage limits
      }
    }

    setSubmitting(false)
    setSuccess(true)
  }

  if (step === 'city') {
    return (
      <CityStep
        wizardType={type}
        selected={state.city}
        onSelect={(city) => {
          setState((s) => ({ ...s, city }))
          setTimeout(() => setStepIndex(1), 350)
        }}
      />
    )
  }

  const content = success ? (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-md space-y-6"
    >
      <div className="flex flex-col items-start text-start">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-12 h-12 rounded-full bg-forest text-cream flex items-center justify-center mb-4"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 10.5L8 14.5L16 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
        <h2 className="font-serif text-2xl md:text-3xl text-charcoal mb-2">
          {successTitle || t.sessions.successTitle}
        </h2>
        <p className="font-sans text-sm text-charcoal/60 leading-relaxed">
          {successBody || t.sessions.successBody}
        </p>
      </div>

      {/* Welcoming Card in Grooms Art Theme */}
      <div className="bg-linen/40 border border-charcoal/10 rounded-2xl p-6 space-y-4 shadow-sm text-start">
        <p className="font-serif italic text-[15px] text-charcoal leading-relaxed">
          {locale === 'ar' 
            ? '« أهلاً بكِ في استوديو Grooms Art. نحن هنا لا لنلتقط مجرد صور، بل لنروي قصتكم بصدق ودفء، مسترشدين بالضوء الطبيعي واللحظات العفوية. »' 
            : '“Welcome to Grooms Art Studio. We are not here to merely take photos; we are here to honestly tell your story, guided by natural light and the quiet seconds in between.”'}
        </p>
        <div className="divider-hairline" />
        <div className="space-y-2 font-sans text-xs text-charcoal/70">
          <div className="flex justify-between items-center">
            <span className="font-medium text-charcoal/50 uppercase tracking-wider">{locale === 'ar' ? 'الاسم:' : 'Name:'}</span>
            <span className="text-charcoal font-medium">{state.customerInfo.fullName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-charcoal/50 uppercase tracking-wider">{locale === 'ar' ? 'التاريخ:' : 'Date:'}</span>
            <span className="text-charcoal font-medium">{state.date}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-charcoal/50 uppercase tracking-wider">{locale === 'ar' ? 'الباقة:' : 'Package:'}</span>
            <span className="text-charcoal font-medium">{state.packageId ? packageNames[state.packageId] ?? state.packageId : '—'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  ) : (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {step === 'package' &&
            renderPackageStep(state.city, state.packageId, (packageId) =>
              setState((s) => ({ ...s, packageId }))
            )}

          {step === 'location' && (
            <LocationStep
              city={state.city}
              selected={state.locationId}
              onSelect={(locationId) => setState((s) => ({ ...s, locationId }))}
            />
          )}

          {step === 'date' && (
            <SessionDateStep
              selected={state.date}
              blockedDates={blockedDatesSet}
              onSelect={(date) => setState((s) => ({ ...s, date }))}
            />
          )}

          {step === 'customerInfo' && (
            <CustomerInfoStep
              data={state.customerInfo}
              onChange={(customerInfo) => setState((s) => ({ ...s, customerInfo }))}
            />
          )}

          {step === 'confirm' && (
            <div>
              <h2 className="font-serif text-2xl md:text-3xl text-charcoal mb-2">
                {t.sessions.confirmTitle}
              </h2>
              <p className="font-sans text-sm text-charcoal/55 mb-8 max-w-lg">
                {t.sessions.confirmBody}
              </p>

              <div className="max-w-md rounded-xl overflow-hidden border border-charcoal/15 divide-y divide-charcoal/10 mb-8">
                <SummaryRow
                  label="City"
                  value={
                    state.city === 'baghdad'
                      ? t.sessions.cities.baghdad
                      : t.sessions.cities.erbil
                  }
                />
                <SummaryRow
                  label="Package / Collection"
                  value={state.packageId ? packageNames[state.packageId] ?? state.packageId : '—'}
                />
                <SummaryRow label="Location" value={locationLabel} />
                <SummaryRow label="Date" value={state.date ?? '—'} />
                <SummaryRow label="Name" value={state.customerInfo.fullName || '—'} />
                <SummaryRow label="Phone" value={state.customerInfo.phone || '—'} />
                {state.customerInfo.email && (
                  <SummaryRow label="Email" value={state.customerInfo.email} />
                )}
              </div>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="font-sans text-xs tracking-[0.2em] uppercase bg-forest text-cream px-8 py-4 rounded-lg hover:bg-forest-deep transition-colors duration-500 disabled:opacity-50"
              >
                {submitting ? t.common.loading + '…' : t.sessions.confirmButton}
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons — hidden on city and confirm steps */}
      {step !== 'city' && step !== 'confirm' && (
        <div className="flex items-center justify-between gap-4 mt-12 pt-8 border-t border-charcoal/10 w-full">
          <button
            type="button"
            onClick={goBack}
            className="font-sans text-xs tracking-[0.15em] uppercase border border-charcoal/30 text-charcoal/70 px-6 py-3 rounded-lg hover:bg-charcoal/5 transition-all text-center min-w-[100px]"
          >
            {t.sessions.back}
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!canContinue}
            className="font-sans text-xs tracking-[0.15em] uppercase bg-forest text-cream px-6 py-3 rounded-lg hover:bg-forest-deep transition-all disabled:opacity-40 disabled:cursor-not-allowed text-center min-w-[100px]"
          >
            {t.sessions.continue}
          </button>
        </div>
      )}
    </>
  )

  return (
    <Section
      className={clsx(
        type === 'full-day' ? 'py-20 md:py-28' : 'pt-32 pb-24 md:pt-40 md:pb-32'
      )}
    >
      {content}
    </Section>
  )
}
