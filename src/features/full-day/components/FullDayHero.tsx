import { motion } from 'motion/react'
import { imageSrcSet } from '@/lib/data/portfolio'
import { useI18n } from '@/lib/i18n'

/** Full-bleed hero photograph — from the photographer's own portfolio. */
export function FullDayHero() {
  const { t } = useI18n()
  const src = imageSrcSet('frame-19')

  return (
    <section className="relative h-[70svh] min-h-[440px] w-full overflow-hidden bg-forest-deep">
      <img
        src={src.lg}
        srcSet={`${src.md} 960w, ${src.lg} 1600w`}
        sizes="100vw"
        alt="Held by Golden Light — full-day wedding coverage by Grooms Art"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(11,36,28,0.35) 0%, rgba(11,36,28,0.35) 45%, rgba(11,36,28,0.75) 100%)',
        }}
      />

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-14 md:px-12 md:pb-20 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-sans text-xs md:text-sm tracking-[0.32em] uppercase text-cream/70 mb-4">
            {t.fullDay.eyebrow}
          </p>
          <h1
            className="font-serif text-cream text-4xl leading-[1.05] md:text-6xl lg:text-7xl max-w-3xl"
            style={{ textShadow: '0 2px 24px rgba(0,0,0,0.45), 0 1px 4px rgba(0,0,0,0.5)' }}
          >
            {t.fullDay.title}
          </h1>
        </motion.div>
      </div>
    </section>
  )
}
