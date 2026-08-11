import { imageSrcSet } from '@/lib/data/portfolio'
import { useI18n } from '@/lib/i18n'

/**
 * Cinematic film slot for the Full Day page. No footage has been supplied
 * yet, so this renders an elegant, honest placeholder (a still frame with a
 * disabled play affordance) rather than a broken <video> or generic stock
 * clip. Swap in a real <video> element here once footage is ready.
 */
export function CinematicPlaceholder() {
  const { t } = useI18n()
  const src = imageSrcSet('frame-19')

  return (
    <div className="relative overflow-hidden bg-charcoal">
      <img
        src={src.lg}
        alt="Cinematic highlight film — coming soon"
        className="w-full h-[52svh] md:h-[70svh] object-cover opacity-60"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/20 to-transparent" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-cream/50 flex items-center justify-center mb-6">
          <div
            className="w-0 h-0 border-y-[10px] border-y-transparent border-l-[16px] border-l-cream/80"
            style={{ marginInlineStart: 4 }}
          />
        </div>
        <h3 className="font-serif text-2xl md:text-4xl text-cream mb-3">
          {t.fullDay.cinematicTitle}
        </h3>
        <p className="font-sans text-sm text-cream/60 max-w-md leading-relaxed">
          {t.fullDay.cinematicBody}
        </p>
      </div>
    </div>
  )
}
