import { useState, useMemo, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { clsx } from 'clsx'
import { useI18n } from '@/lib/i18n'
import { Section } from '@/features/shared/components/Section'
import { CityStep } from '@/features/sessions/components/CityStep'
import { LocationStep } from '@/features/sessions/components/LocationStep'
import { SessionDateStep } from '@/features/sessions/components/SessionDateStep'
import { CustomerInfoStep, type CustomerInfoData } from '@/features/sessions/components/CustomerInfoStep'
import { getLocationsForCity, DEFAULT_LOCATIONS, type Location } from '@/lib/data/locations'
import { storage, STORAGE_KEYS } from '@/lib/storage'
import type { BookingType } from '@/lib/types/booking'
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
  const [submitError, setSubmitError] = useState<string | null>(null)

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

  const [dbBlockedDates, setDbBlockedDates] = useState<string[]>([])
  const [dbLocations, setDbLocations] = useState<Location[]>([])

  useEffect(() => {
    if (!supabase) return
    const client = supabase

    const loadBlockedDates = async () => {
      const { data, error } = await client.from('blocked_dates').select('date')
      if (!error && data) {
        setDbBlockedDates(data.map((d: any) => d.date))
      }
    }

    const loadLocations = async () => {
      const { data, error } = await client.from('locations').select('*')
      if (!error && data) {
        setDbLocations(
          data.map((l: any) => ({
            id: l.id,
            city: l.city,
            name: l.name,
            nameAr: l.name_ar,
            description: l.description || '',
            descriptionAr: l.description_ar || '',
          }))
        )
      }
    }

    loadBlockedDates()
    loadLocations()

    const blockedChannel = client
      .channel('public_blocked_dates_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blocked_dates' }, () => {
        loadBlockedDates()
      })
      .subscribe()

    const locationsChannel = client
      .channel('public_locations_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, () => {
        loadLocations()
      })
      .subscribe()

    return () => {
      client.removeChannel(blockedChannel)
      client.removeChannel(locationsChannel)
    }
  }, [])

  const step = STEPS[stepIndex]
  const stepLabels = locale === 'ar' ? STEP_LABELS_AR : STEP_LABELS_EN

  const cityId = (state.city === 'erbil' ? 'erbil' : 'baghdad') as 'baghdad' | 'erbil'
  
  // Use real-time locations from Supabase, or default locations if empty/failed
  const locations = useMemo(() => {
    const filtered = dbLocations.filter((l) => l.city === cityId)
    if (filtered.length > 0) return filtered
    return DEFAULT_LOCATIONS[cityId] ?? []
  }, [dbLocations, cityId])

  const selectedLocationObj = locations.find((l) => l.id === state.locationId)
  const locationLabel =
    state.locationId === 'agreed-later'
      ? (locale === 'ar' ? 'سيتم الاتفاق مع المصور' : 'To be agreed with photographer')
      : selectedLocationObj
        ? locale === 'ar'
          ? selectedLocationObj.nameAr
          : selectedLocationObj.name
        : '—'

  const blockedDatesSet = useMemo(() => {
    return new Set(dbBlockedDates)
  }, [dbBlockedDates])

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
    setSubmitError(null)

    if (!supabase) {
      setSubmitError(
        locale === 'ar'
          ? 'خدمة الحجز غير متاحة حالياً. يرجى التواصل معنا مباشرة عبر واتساب.'
          : 'Booking service is currently unavailable. Please contact us directly via WhatsApp.'
      )
      setSubmitting(false)
      return
    }

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

    const { error } = await supabase.from('bookings').insert(dbRow)

    setSubmitting(false)

    if (error) {
      console.error('[grooms-art] Booking insert failed:', error)
      setSubmitError(
        locale === 'ar'
          ? 'حدث خطأ أثناء إرسال الحجز. يرجى المحاولة مرة أخرى أو التواصل معنا مباشرة.'
          : 'Something went wrong while submitting your booking. Please try again or contact us directly.'
      )
      return
    }

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
      className="max-w-md space-y-6 text-start"
    >
      <div className="flex flex-col items-start">
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
        <h2 className="font-serif text-2xl md:text-3xl text-charcoal mb-4">
          {locale === 'ar' ? 'تم إرسال طلب الحجز بنجاح' : 'Booking Submitted Successfully'}
        </h2>
        <p className="font-sans text-sm text-charcoal/70 leading-relaxed space-y-2">
          {locale === 'ar' ? (
            <>
              شكراً لكِ على الحجز. تم استلام طلبكِ بنجاح.<br />
              سيقوم فريقنا بمراجعة حجزكِ بعناية والتواصل معكِ خلال <b>٤٨ ساعة</b> لتأكيد كافة التفاصيل.
            </>
          ) : (
            <>
              Thank you for your booking. Your request has been successfully received.<br />
              Our team will carefully review your booking and contact you within <b>48 hours</b> to confirm all details.
            </>
          )}
        </p>
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
              locations={locations}
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

              {submitError && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
                  <svg className="shrink-0 mt-0.5 text-red-500" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="font-sans text-sm text-red-700 leading-relaxed">{submitError}</p>
                </div>
              )}

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

      {/* Navigation buttons — hidden on confirm step */}
      {step !== 'confirm' && (
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
