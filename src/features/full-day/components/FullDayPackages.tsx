import { motion } from 'motion/react'
import { clsx } from 'clsx'
import { useI18n } from '@/lib/i18n'
import { Section } from '@/features/shared/components/Section'
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
  const { t } = useI18n()

  return (
    <Section className="py-20 md:py-28 border-t border-cream/10">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {/* VIP Collection */}
              <motion.button
                type="button"
                onClick={() => onSelect('vip')}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className={clsx(
                  'text-left rounded-2xl p-8 md:p-10 flex flex-col transition-colors duration-500',
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
                    'mt-auto text-center font-sans text-xs tracking-[0.15em] uppercase py-2.5 rounded-md border transition-colors duration-500',
                    selected === 'vip'
                      ? 'bg-forest text-cream border-forest'
                      : 'border-charcoal/30 text-charcoal/70',
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
                  'text-left rounded-2xl p-8 md:p-10 flex flex-col relative overflow-hidden transition-colors duration-500',
                  selected === 'royal'
                    ? 'border-2 border-forest bg-forest/[0.04]'
                    : 'border-2 border-forest/30 hover:border-forest/50',
                )}
                aria-pressed={selected === 'royal'}
              >
                {/* Premium accent */}
                <div className="absolute top-0 inset-x-0 h-1 rounded-t-2xl bg-gradient-to-r from-forest via-sage to-forest" />

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
                    'mt-auto text-center font-sans text-xs tracking-[0.15em] uppercase py-2.5 rounded-md border transition-colors duration-500',
                    selected === 'royal'
                      ? 'bg-forest text-cream border-forest'
                      : 'border-charcoal/30 text-charcoal/70',
                  )}
                >
                  {selected === 'royal' ? t.fullDay.selected : t.fullDay.selectCta}
                </div>
              </motion.button>
            </div>
          </div>
        )}
      />
    </Section>
  )
}
