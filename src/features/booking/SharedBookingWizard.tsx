import { useState, useMemo, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { clsx } from 'clsx'
import { useI18n } from '@/lib/i18n'
import { Section } from '@/features/shared/components/Section'
import { PageHero } from '@/features/shared/components/PageHero'
import { CityStep } from '@/features/sessions/components/CityStep'
import { LocationStep } from '@/features/sessions/components/LocationStep'
import { SessionDateStep } from '@/features/sessions/components/SessionDateStep'
import { CustomerInfoStep, type CustomerInfoData } from '@/features/sessions/components/CustomerInfoStep'
import { getLocationsForCity, type Location } from '@/lib/data/locations'
import { storage, STORAGE_KEYS } from '@/lib/storage'
import type { Booking, BookingType } from '@/lib/types/booking'
import { supabase } from '@/lib/supabase/client'
import { fetchBlockedDates } from '@/features/booking/availability'

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
  /** Hero configuration for when city is chosen */
  heroImage?: string
  heroTitle?: string
  heroSubtitle?: string
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
  heroImage,
  heroTitle,
  heroSubtitle,
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

  const [blockedDatesSet, setBlockedDatesSet] = useState<Set<string>>(() => {
    const bArray = storage.get<string[]>(STORAGE_KEYS.blockedDates) || []
    const fArray = storage.get<string[]>('ga_fully_booked_dates') || []
    return new Set([...bArray, ...fArray])
  })

  useEffect(() => {
    let isMounted = true
    fetchBlockedDates().then(({ blocked, fullyBooked }) => {
      if (isMounted) {
        setBlockedDatesSet(new Set([...blocked, ...fullyBooked]))
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

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

function getValidISODateOrToday(input: string | null | undefined): { dbDate: string; rawNote?: string } {
  const now = new Date()
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  if (!input || typeof input !== 'string') {
    return { dbDate: todayISO }
  }

  const trimmed = input.trim()

  // Strict regex check for YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number)
    if (y >= 2020 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { dbDate: trimmed }
    }
  }

  // Attempt standard Date parsing
  const parsed = new Date(trimmed)
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear()
    const m = parsed.getMonth() + 1
    const d = parsed.getDate()
    if (y >= 2020 && y <= 2100 && !isNaN(m) && !isNaN(d)) {
      return { dbDate: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` }
    }
  }

  // Fallback to today if invalid string (like "unknown date") and record note
  return { dbDate: todayISO, rawNote: `تاريخ الحجز المطلوب: ${trimmed}` }
}

  const handleConfirm = async () => {
    setSubmitting(true)

    const fallbackBookingId = `${type}-${Date.now()}`
    const { dbDate, rawNote } = getValidISODateOrToday(state.date)
    const combinedNotes = [state.customerInfo.notes, rawNote].filter(Boolean).join('\n')

    const dbRow = {
      type,
      status: 'pending',
      city: state.city ?? '',
      package_id: state.packageId ?? '',
      location_id: state.locationId ?? '',
      date: dbDate,
      full_name: state.customerInfo.fullName,
      phone: state.customerInfo.phone,
      email: state.customerInfo.email || '',
      notes: combinedNotes,
      whatsapp_triggered: false,
    }

    let savedBooking: Booking | null = null
    if (supabase) {
      try {
        const { error } = await supabase
          .from('bookings')
          .insert(dbRow)

        if (error) throw error

        savedBooking = {
          id: fallbackBookingId,
          type,
          status: 'pending',
          city: state.city ?? '',
          packageId: state.packageId ?? '',
          location: state.locationId ?? '',
          date: dbDate,
          customerInfo: {
            ...state.customerInfo,
            notes: combinedNotes,
          },
          createdAt: new Date().toISOString(),
        }
      } catch (err) {
        console.error('Failed to save booking to Supabase, fallback to storage:', err)
      }
    }

    // Save/sync into local storage for immediate offline and dashboard availability
    try {
      const existing = storage.get<Booking[]>(STORAGE_KEYS.bookings) || []
      const bookingToSave: Booking = savedBooking || {
        id: fallbackBookingId,
        type,
        status: 'pending',
        city: state.city ?? '',
        packageId: state.packageId ?? '',
        location: state.locationId ?? '',
        date: state.date ?? '',
        customerInfo: state.customerInfo,
        createdAt: new Date().toISOString(),
      }
      existing.unshift(bookingToSave)
      storage.set(STORAGE_KEYS.bookings, existing)
    } catch {
      // silently handle storage limits
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

  // Simplified and elegant success screen (Task 6)
  const content = success ? (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-lg mx-auto space-y-6 text-center"
    >
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-14 h-14 rounded-full bg-forest text-cream flex items-center justify-center mb-5 shadow-lg"
        >
          <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
            <path d="M4 10.5L8 14.5L16 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>

        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-charcoal mb-3">
          {locale === 'ar' ? 'تم إرسال طلب الحجز بنجاح' : 'Booking Submitted Successfully'}
        </h2>

        <p className="font-sans text-sm text-charcoal/70 leading-relaxed max-w-md mb-2">
          {locale === 'ar'
            ? 'تم استلام طلب حجزكِ بنجاح. سيقوم فريقنا بمراجعة التفاصيل والتواصل معكِ خلال 48 ساعة.'
            : 'Your booking request has been received successfully. Our team will review your request and contact you within 48 hours.'}
        </p>

        <p className="font-serif italic text-base text-forest mt-1">
          {locale === 'ar' ? 'شكراً لاختياركم Grooms Art.' : 'Thank you for choosing Grooms Art.'}
        </p>
      </div>

      {/* Booking Summary Box */}
      <div className="bg-white border border-charcoal/10 rounded-2xl p-5 shadow-sm text-left divide-y divide-charcoal/06">
        <div className="flex justify-between items-center py-2.5 font-sans text-xs">
          <span className="font-medium text-charcoal/45 uppercase tracking-wider">{locale === 'ar' ? 'الاسم' : 'Name'}</span>
          <span className="text-charcoal font-semibold text-sm">{state.customerInfo.fullName}</span>
        </div>
        <div className="flex justify-between items-center py-2.5 font-sans text-xs">
          <span className="font-medium text-charcoal/45 uppercase tracking-wider">{locale === 'ar' ? 'المدينة' : 'City'}</span>
          <span className="text-charcoal font-medium capitalize">{state.city === 'baghdad' ? (locale === 'ar' ? 'بغداد' : 'Baghdad') : (locale === 'ar' ? 'أربيل' : 'Erbil')}</span>
        </div>
        <div className="flex justify-between items-center py-2.5 font-sans text-xs">
          <span className="font-medium text-charcoal/45 uppercase tracking-wider">{locale === 'ar' ? 'التاريخ' : 'Date'}</span>
          <span className="text-forest font-semibold">{state.date}</span>
        </div>
        <div className="flex justify-between items-center py-2.5 font-sans text-xs">
          <span className="font-medium text-charcoal/45 uppercase tracking-wider">{locale === 'ar' ? 'الباقة' : 'Package'}</span>
          <span className="text-charcoal font-medium">{state.packageId ? packageNames[state.packageId] ?? state.packageId : '—'}</span>
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
            renderPackageStep(state.city, state.packageId, (packageId) => {
              setState((s) => ({ ...s, packageId }))
              setTimeout(() => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1)), 350)
            })}

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
              onSelect={(date) => {
                setState((s) => ({ ...s, date }))
                setTimeout(() => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1)), 350)
              }}
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

              <div className="max-w-md rounded-xl overflow-hidden border border-charcoal/15 divide-y divide-charcoal/10 mb-8 bg-white">
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

      {/* Navigation buttons — hidden only on confirm step */}
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
            disabled={step !== 'location' && !canContinue}
            className="font-sans text-xs tracking-[0.15em] uppercase bg-forest text-cream px-6 py-3 rounded-lg hover:bg-forest-deep transition-all disabled:opacity-40 disabled:cursor-not-allowed text-center min-w-[100px]"
          >
            {t.sessions.continue}
          </button>
        </div>
      )}
    </>
  )

  const defaultHeroTitle =
    heroTitle ||
    (type === 'full-day'
      ? (locale === 'ar' ? 'اليوم الكامل' : 'The Full Day')
      : (locale === 'ar' ? 'الجلسات' : 'Sessions'))

  const defaultHeroSubtitle =
    heroSubtitle ||
    (type === 'full-day'
      ? (locale === 'ar' ? 'تجربة توثيق فوتوغرافية وسينمائية شاملة' : 'Complete Wedding Photography & Film Experience')
      : (locale === 'ar' ? 'جلسات تصوير توثيقية حصرية' : 'Exclusive Editorial Photography Sessions'))

  return (
    <>
      <PageHero
        title={defaultHeroTitle}
        subtitle={defaultHeroSubtitle}
        image={heroImage || (type === 'session' ? '/images/sessions-bg.jpg' : '/images/fullday-bg.jpg')}
      />
      <Section className="py-12 md:py-20">
        {content}
      </Section>
    </>
  )
}
