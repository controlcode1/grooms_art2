import { motion } from 'motion/react'
import { clsx } from 'clsx'
import { useI18n } from '@/lib/i18n'
import { getLocationsForCity, type Location } from '@/lib/data/locations'
import { storage, STORAGE_KEYS } from '@/lib/storage'

interface LocationStepProps {
  city: string | null
  selected: string | null
  onSelect: (locationId: string) => void
  locations: Location[]
}

export function LocationStep({ city, selected, onSelect, locations }: LocationStepProps) {
  const { t, locale } = useI18n()

  return (
    <div className="flex flex-col items-center">
      <h2 className="font-serif text-2xl md:text-3xl text-charcoal mb-8 text-center">
        {t.sessions.locationTitle}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl w-full mx-auto">
        {locations.map((loc, i) => {
          const name = locale === 'ar' ? loc.nameAr : loc.name
          const description = locale === 'ar' ? loc.descriptionAr : loc.description
          return (
            <motion.div
              key={loc.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="text-left rounded-xl border border-charcoal/10 bg-white p-6 flex flex-col transition-all duration-500"
            >
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-charcoal/5 text-charcoal/40">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1C4.79 1 3 2.79 3 5c0 3 4 8 4 8s4-5 4-8c0-2.21-1.79-4-4-4z" stroke="currentColor" strokeWidth="1" fill="none" />
                    <circle cx="7" cy="5" r="1.5" stroke="currentColor" strokeWidth="0.8" fill="none" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-serif text-lg text-charcoal mb-1">{name}</p>
                  <p className="font-sans text-xs text-charcoal/50 leading-relaxed">{description}</p>
                </div>
              </div>

              {loc.price != null && (
                <div className="mt-4 pt-4 border-t border-charcoal/08 flex items-center justify-between">
                  <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-charcoal/35">
                    {locale === 'ar' ? 'تبدأ من' : 'Starting from'}
                  </span>
                  <span className="font-serif text-base text-charcoal/70">
                    ${loc.price}
                  </span>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      <div className="mt-10 flex items-start gap-3 bg-forest/[0.03] border border-forest/10 rounded-xl p-4 max-w-lg w-full mx-auto">
        <div className="w-5 h-5 rounded-full flex items-center justify-center bg-forest/10 text-forest flex-shrink-0 mt-0.5">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 8V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="6" cy="4" r="0.6" fill="currentColor" />
          </svg>
        </div>
        <p className="font-sans text-sm text-charcoal/80 leading-relaxed text-left">
          {locale === 'ar' ? (
            <>
              <span className="font-semibold text-forest">ملاحظة:</span>{' '}
              المواقع المدرجة هي مواقعنا الموصى بها. إذا كنت تفضل موقعًا آخر، يمكن ترتيب ذلك بالاتفاق المباشر مع المصور.
            </>
          ) : (
            <>
              <span className="font-semibold text-forest">Note:</span>{' '}
              The listed locations are our recommended locations. If you prefer a different location, it can be arranged exclusively through mutual agreement with the photographer.
            </>
          )}
        </p>
      </div>
    </div>
  )
}
