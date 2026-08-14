import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { clsx } from 'clsx'
import { useI18n } from '@/lib/i18n'
import { SharedBookingWizard } from '@/features/booking/SharedBookingWizard'

const VIP_FEATURES = {
  team: ['2 Photographers', '1 Videographer', 'Bride Assistant'],
  luxuryAlbum: { size: '30×80 cm', pages: '10 Pages', photos: '23–28 Photos' },
  companionAlbum: { size: '30×60 cm', pages: '5 Pages', photos: '20–25 Photos' },
  film: 'Cinematic Highlight Film · 2–4 Minutes',
  extras: [
    'Instagram Highlight Reel',
    'Wall Frame',
    '2 Table Frames',
    'Luxury USB Gift',
    'Exclusive Wedding Gift',
    'Priority Delivery',
  ],
}

const ROYAL_FEATURES = {
  team: ['2 Photographers', '2 Videographers', 'Drone (where permitted)', 'Bride Assistant'],
  luxuryAlbum: { size: '30×80 cm', pages: '12 Pages', photos: '35–45 Photos' },
  companionAlbum: { size: '30×60 cm', pages: '6 Pages', photos: '20–30 Photos' },
  film: 'Cinematic Wedding Film · 3–5 Minutes',
  extras: [
    'Instagram Highlight Reel',
    'Express Teaser — Delivered within 72 hours',
    'Wall Frame',
    '2 Table Frames',
    'Luxury USB Gift',
    'Exclusive Wedding Gift',
  ],
  benefits: [
    'Priority delivery',
    'Full coordination before the wedding',
    'Complete coverage of all important moments',
  ],
}

// Baghdad base prices — Erbil adds $300
const COLLECTION_BASE_PRICES = {
  vip: 1000,
  royal: 1500,
}
const ERBIL_SURCHARGE = 300

function getCollectionPrice(id: 'vip' | 'royal', city: string | null): string {
  const base = COLLECTION_BASE_PRICES[id]
  const final = city === 'erbil' ? base + ERBIL_SURCHARGE : base
  return `$${final.toLocaleString()}`
}

function FeatureGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-charcoal/40 mb-2.5">
        {title}
      </p>
      {children}
    </div>
  )
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2 font-sans text-xs text-charcoal/70">
          <span className="text-forest/60 mt-0.5">—</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function AlbumBlock({ label, album }: { label: string; album: { size: string; pages: string; photos: string } }) {
  return (
    <FeatureGroup title={label}>
      <div className="flex flex-wrap gap-x-4 gap-y-1 font-sans text-xs text-charcoal/70">
        <span>{album.size}</span>
        <span className="text-charcoal/20">·</span>
        <span>{album.pages}</span>
        <span className="text-charcoal/20">·</span>
        <span>{album.photos}</span>
      </div>
    </FeatureGroup>
  )
}

const PACKAGE_NAMES = {
  vip: 'VIP Collection',
  royal: 'Royal Collection',
}

export function FullDayPackages() {
  const { t, locale } = useI18n()
  const [activeModalPkgId, setActiveModalPkgId] = useState<string | null>(null)

  const activeFeatures = activeModalPkgId === 'royal' ? ROYAL_FEATURES : VIP_FEATURES

  return (
    <>
      <SharedBookingWizard
        type="full-day"
        packageNames={PACKAGE_NAMES}
        successTitle={t.fullDay.bookingSuccessTitle}
        successBody={t.fullDay.bookingSuccessBody}
        renderPackageStep={(city, selected, onSelect) => (
          <div>
            <h2 className="font-serif text-2xl md:text-3xl text-charcoal mb-8">
              {t.fullDay.packagesTitle}
            </h2>

            {/* 1. DESKTOP GRID LAYOUT (hidden on mobile, grid on desktop) */}
            <div className="hidden md:grid grid-cols-2 gap-6 lg:gap-8">
              {/* VIP Collection */}
              <motion.button
                type="button"
                onClick={() => onSelect('vip')}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className={clsx(
                  'text-left rounded-2xl p-8 md:p-10 flex flex-col transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50',
                  selected === 'vip'
                    ? 'border-2 border-forest bg-forest/[0.04]'
                    : 'border border-charcoal/15 hover:border-charcoal/40',
                )}
                aria-pressed={selected === 'vip'}
              >
                <div className="mb-8">
                  <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-sage mb-3">
                    Full Day Coverage
                  </p>
                  <h3 className="font-serif text-2xl md:text-3xl text-charcoal mb-2">
                    VIP Collection
                  </h3>
                  <p className="font-serif text-3xl md:text-4xl text-forest">
                    {getCollectionPrice('vip', city)}
                  </p>
                </div>

                <div className="divider-hairline mb-6" />

                <FeatureGroup title="Photography Team">
                  <FeatureList items={VIP_FEATURES.team} />
                </FeatureGroup>

                <AlbumBlock label="Luxury Album" album={VIP_FEATURES.luxuryAlbum} />
                <AlbumBlock label="Companion Album" album={VIP_FEATURES.companionAlbum} />

                <FeatureGroup title="Film">
                  <p className="font-sans text-xs text-charcoal/70">{VIP_FEATURES.film}</p>
                </FeatureGroup>

                <FeatureGroup title="Extras & Gifts">
                  <FeatureList items={VIP_FEATURES.extras} />
                </FeatureGroup>

                <div
                  className={clsx(
                    'mt-auto text-center font-sans text-xs tracking-[0.15em] uppercase py-2.5 rounded-md border transition-colors duration-500 w-full',
                    selected === 'vip'
                      ? 'bg-forest text-cream border-forest'
                      : 'border-charcoal/30 text-charcoal/70 hover:bg-charcoal/5',
                  )}
                >
                  {selected === 'vip' ? t.fullDay.selected : t.fullDay.selectCta}
                </div>
              </motion.button>

              {/* Royal Collection */}
              <motion.button
                type="button"
                onClick={() => onSelect('royal')}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className={clsx(
                  'text-left rounded-2xl p-8 md:p-10 flex flex-col transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50',
                  selected === 'royal'
                    ? 'border-2 border-forest bg-forest/[0.04]'
                    : 'border border-charcoal/15 hover:border-charcoal/40',
                )}
                aria-pressed={selected === 'royal'}
              >

                <div className="mb-8">
                  <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-sage mb-3">
                    Full Day Coverage
                  </p>
                  <h3 className="font-serif text-2xl md:text-3xl text-charcoal mb-2">
                    Royal Collection
                  </h3>
                  <p className="font-serif text-3xl md:text-4xl text-forest">
                    {getCollectionPrice('royal', city)}
                  </p>
                </div>

                <div className="divider-hairline mb-6" />

                <FeatureGroup title="Photography Team">
                  <FeatureList items={ROYAL_FEATURES.team} />
                </FeatureGroup>

                <AlbumBlock label="Luxury Album" album={ROYAL_FEATURES.luxuryAlbum} />
                <AlbumBlock label="Companion Album" album={ROYAL_FEATURES.companionAlbum} />

                <FeatureGroup title="Film">
                  <p className="font-sans text-xs text-charcoal/70">{ROYAL_FEATURES.film}</p>
                </FeatureGroup>

                <FeatureGroup title="Exclusive Gifts">
                  <FeatureList items={ROYAL_FEATURES.extras} />
                </FeatureGroup>

                <FeatureGroup title="Premium Benefits">
                  <FeatureList items={ROYAL_FEATURES.benefits} />
                </FeatureGroup>

                <div
                  className={clsx(
                    'mt-auto text-center font-sans text-xs tracking-[0.15em] uppercase py-2.5 rounded-md border transition-colors duration-500 w-full',
                    selected === 'royal'
                      ? 'bg-forest text-cream border-forest'
                      : 'border-charcoal/30 text-charcoal/70 hover:bg-charcoal/5',
                  )}
                >
                  {selected === 'royal' ? t.fullDay.selected : t.fullDay.selectCta}
                </div>
              </motion.button>
            </div>

            {/* 2. MOBILE COMPACT LAYOUT (hidden on desktop, vertical stacked on mobile) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {(['vip', 'royal'] as const).map((pkgId) => {
                const isSelected = selected === pkgId
                const price = getCollectionPrice(pkgId, city)
                const name = pkgId === 'royal' ? 'Royal Collection' : 'VIP Collection'

                return (
                  <div
                    key={pkgId}
                    className={clsx(
                      'rounded-xl border p-5 flex flex-col min-h-[140px] transition-all duration-300 bg-white',
                      isSelected
                        ? 'border-forest bg-forest/[0.04] shadow-sm'
                        : 'border-charcoal/15',
                    )}
                  >
                    {/* Top: name + price */}
                    <div className="flex-1 mb-4">
                      <span className="font-serif text-lg font-medium text-charcoal block">{name}</span>
                      <p className="font-serif text-xl text-forest mt-1">{price}</p>
                    </div>

                    {/* Bottom: actions row */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveModalPkgId(pkgId)}
                        className="font-sans text-xs tracking-wider uppercase border border-charcoal/20 text-charcoal/70 py-2.5 rounded-lg bg-sand/40 hover:bg-sand transition-colors text-center"
                      >
                        {locale === 'ar' ? 'التفاصيل' : 'Details'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelect(pkgId)}
                        className={clsx(
                          'font-sans text-xs tracking-wider uppercase py-2.5 rounded-lg border transition-colors text-center',
                          isSelected
                            ? 'bg-forest border-forest text-cream'
                            : 'border-forest text-forest hover:bg-forest/[0.04]',
                        )}
                      >
                        {isSelected ? (locale === 'ar' ? 'مختارة' : 'Selected') : (locale === 'ar' ? 'اختر' : 'Select')}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 3. ELEGANT MOBILE DETAIL MODAL */}
            <AnimatePresence>
              {activeModalPkgId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/70 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-sand w-full max-w-md rounded-2xl p-6 shadow-2xl border border-charcoal/10 max-h-[80vh] overflow-y-auto flex flex-col text-left"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="font-serif text-2xl text-charcoal">
                          {activeModalPkgId === 'royal' ? 'Royal Collection' : 'VIP Collection'}
                        </h3>
                        <p className="font-serif text-3xl text-forest mt-1">
                          {getCollectionPrice(activeModalPkgId as 'vip' | 'royal', city)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveModalPkgId(null)}
                        className="font-sans text-sm text-charcoal/50 hover:text-charcoal p-1"
                        aria-label="Close modal"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="divider-hairline mb-6" />

                    {/* Features list inside modal */}
                    <div className="space-y-5 flex-1 overflow-y-auto mb-8 pr-1">
                      <FeatureGroup title="Photography Team">
                        <FeatureList items={activeFeatures.team} />
                      </FeatureGroup>

                      <AlbumBlock label="Luxury Album" album={activeFeatures.luxuryAlbum} />
                      <AlbumBlock label="Companion Album" album={activeFeatures.companionAlbum} />

                      <FeatureGroup title="Film">
                        <p className="font-sans text-sm text-charcoal/75">{activeFeatures.film}</p>
                      </FeatureGroup>

                      <FeatureGroup title="Extras & Gifts">
                        <FeatureList items={activeFeatures.extras} />
                      </FeatureGroup>

                      {'benefits' in activeFeatures && (
                        <FeatureGroup title="Premium Benefits">
                          <FeatureList items={(activeFeatures as any).benefits} />
                        </FeatureGroup>
                      )}
                    </div>

                    {/* Select button inside modal */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(activeModalPkgId)
                        setActiveModalPkgId(null)
                      }}
                      className="w-full text-center font-sans text-xs tracking-[0.18em] uppercase py-3.5 rounded-lg bg-forest text-cream border border-forest hover:bg-forest-deep transition-colors duration-500"
                    >
                      {selected === activeModalPkgId
                        ? (locale === 'ar' ? 'الباقة مختارة بالفعل' : 'Package Already Selected')
                        : (locale === 'ar' ? 'اختيار هذه الباقة' : 'Select this Package')}
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      />
    </>
  )
}
