import { motion } from 'motion/react'
import { clsx } from 'clsx'
import { useI18n } from '@/lib/i18n'
import { getLocationsForCity, type Location } from '@/lib/data/locations'
import { storage, STORAGE_KEYS } from '@/lib/storage'

interface LocationStepProps {
  city: string | null
  selected: string | null
  onSelect: (locationId: string) => void
}

export function LocationStep({ city, selected, onSelect }: LocationStepProps) {
  const { t, locale } = useI18n()

  const cityId = (city === 'erbil' ? 'erbil' : 'baghdad') as 'baghdad' | 'erbil'
  // Load custom locations from storage if present (dashboard-managed)
  const customLocationsMap = storage.get<Record<string, Location[]>>(STORAGE_KEYS.locations) || {}
  const locations = getLocationsForCity(cityId, customLocationsMap[cityId])

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-10">
        <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl text-charcoal mb-3">
          {t.sessions.locationTitle}
        </h2>
        <p className="font-sans text-xs tracking-[0.18em] uppercase text-charcoal/50">
          {locale === 'ar' ? 'اختر موقع التصوير المفضل لديك' : 'Select your preferred photography venue'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl w-full mx-auto">
        {locations.map((loc, i) => {
          const isSelected = selected === loc.id
          const name = locale === 'ar' ? loc.nameAr : loc.name
          const description = locale === 'ar' ? loc.descriptionAr : loc.description

          return (
            <motion.button
              key={loc.id}
              type="button"
              onClick={() => onSelect(loc.id)}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className={clsx(
                'text-left rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50',
                isSelected
                  ? 'border-2 border-forest bg-forest/[0.03] shadow-md'
                  : 'border border-charcoal/10 bg-white hover:border-charcoal/30 hover:shadow-sm',
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
                    isSelected ? 'bg-forest text-cream' : 'bg-charcoal/05 text-charcoal/60 group-hover:bg-charcoal/10'
                  )}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>

                  {isSelected && (
                    <span className="inline-flex items-center gap-1 font-sans text-[10px] tracking-wider uppercase text-forest font-semibold bg-forest/10 px-2.5 py-1 rounded-full">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {locale === 'ar' ? 'تم الاختيار' : 'Selected'}
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-lg md:text-xl text-charcoal mb-1.5 font-medium">
                  {name}
                </h3>
                <p className="font-sans text-xs text-charcoal/55 leading-relaxed">
                  {description}
                </p>
              </div>

              {loc.price != null && (
                <div className="mt-5 pt-3.5 border-t border-charcoal/08 flex items-center justify-between">
                  <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-charcoal/40">
                    {locale === 'ar' ? 'رسوم الموقع' : 'Location Fee'}
                  </span>
                  <span className="font-serif text-base text-forest font-medium">
                    ${loc.price}
                  </span>
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Note banner */}
      <div className="mt-10 flex items-start gap-3.5 bg-white border border-charcoal/10 rounded-2xl p-5 max-w-2xl w-full mx-auto shadow-sm">
        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-forest/10 text-forest flex-shrink-0 mt-0.5">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 8V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="6" cy="4" r="0.6" fill="currentColor" />
          </svg>
        </div>
        <p className="font-sans text-xs sm:text-sm text-charcoal/75 leading-relaxed text-left">
          {locale === 'ar' ? (
            <>
              <span className="font-semibold text-charcoal">ملاحظة:</span>{' '}
              المواقع المدرجة هي مواقعنا الموصى بها. إذا كنت تفضل موقعًا آخر، يمكن ترتيب ذلك بالاتفاق المباشر مع المصور.
            </>
          ) : (
            <>
              <span className="font-semibold text-charcoal">Note:</span>{' '}
              The listed locations are our recommended locations. If you prefer a different location, it can be arranged exclusively through mutual agreement with the photographer.
            </>
          )}
        </p>
      </div>
    </div>
  )
}
