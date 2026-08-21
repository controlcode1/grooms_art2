import { motion } from 'motion/react'
import { Link } from '@tanstack/react-router'
import { useI18n } from '@/lib/i18n'

import { useHeaderTheme } from '@/lib/hooks/useHeaderTheme'

/**
 * Set this once you've added your own footage, e.g. '/videos/hero.mp4'.
 * Until then, the hero renders an elegant brand-colour treatment instead of
 * a placeholder photo — no generic stock imagery.
 */
const HERO_VIDEO_SRC = '/videos/hero.mp4'
const HERO_POSTER_SRC = '/images/hero-poster.webp'

export function Hero() {
  const { t } = useI18n()
  const [heroLine1, heroLine2] = t.home.heroTitle.split('\n')
  useHeaderTheme('light')

  return (
    <section className="relative h-screen min-h-[560px] w-full overflow-hidden bg-forest-deep">
      {HERO_VIDEO_SRC ? (
        <video
          className="absolute inset-0 h-full w-full object-cover will-change-transform-gpu"
          autoPlay
          muted
          loop
          playsInline
          /**
           * preload="none" tells the browser NOT to download video bytes until
           * playback starts — the poster image acts as the LCP element instead.
           * Autoplay still fires immediately on desktop/mobile once the browser
           * is ready, but the poster renders instantly with zero network cost.
           */
          preload="none"
          poster={HERO_POSTER_SRC}
          src={HERO_VIDEO_SRC}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 90% at 20% 10%, #1c4a37 0%, #12372A 45%, #0b241c 100%)',
          }}
        />
      )}

      {/* Forest Green / Charcoal overlay mask for contrast, per brand spec */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(11,36,28,0.5) 0%, rgba(11,36,28,0.45) 30%, rgba(11,36,28,0.72) 60%, rgba(6,20,15,0.9) 100%)',
        }}
      />
      {/* Extra scrim behind the text block so copy stays legible over bright footage */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(6,20,15,0.65) 0%, rgba(6,20,15,0.25) 55%, rgba(6,20,15,0) 80%)',
        }}
      />

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-12 sm:pb-16 md:px-12 md:pb-20 lg:px-20 lg:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1
            className="font-serif text-cream text-3xl sm:text-4xl md:text-5xl lg:text-6xl max-w-2xl leading-[1.15]"
            style={{ textShadow: '0 2px 24px rgba(0,0,0,0.45), 0 1px 4px rgba(0,0,0,0.5)' }}
          >
            {heroLine1}
            {heroLine2 && (
              <>
                <br />
                {heroLine2}
              </>
            )}
          </h1>
          <p className="mt-4 sm:mt-5 max-w-md font-sans text-xs sm:text-sm md:text-base text-cream/80 leading-relaxed">
            {t.home.heroSubtitle}
          </p>

          <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
            <Link
              to="/portfolio"
              className="font-sans text-[11px] sm:text-xs tracking-[0.18em] uppercase bg-cream text-charcoal px-5 py-3 sm:px-6 sm:py-3.5 rounded-lg hover:bg-white transition-colors duration-500 font-medium"
            >
              {t.home.heroCta}
            </Link>
            <Link
              to="/sessions"
              className="font-sans text-[11px] sm:text-xs tracking-[0.18em] uppercase border border-cream/50 text-cream px-5 py-3 sm:px-6 sm:py-3.5 rounded-lg hover:border-cream transition-colors duration-500 font-medium"
            >
              {t.home.heroSecondaryCta}
            </Link>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden md:block"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-px h-12 bg-cream/40" />
      </motion.div>
    </section>
  )
}
