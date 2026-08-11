import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useI18n } from '@/lib/i18n'
import { Section } from '@/features/shared/components/Section'
import { PalmEmblem } from '@/features/shared/components/PalmEmblem'
import { RouterLinkButton } from '@/features/shared/components/Button'
import { testimonials } from '@/lib/data/portfolio'

export function FooterCta() {
  const { t } = useI18n()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % testimonials.length)
    }, 6000)
    return () => clearInterval(id)
  }, [])

  const current = testimonials[index]

  return (
    <Section className="py-24 md:py-36 bg-charcoal text-cream relative overflow-hidden">
      <div className="absolute -right-16 -bottom-16 opacity-10">
        <PalmEmblem className="w-72 h-72" light />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-2xl"
      >
        <p className="font-sans text-xs md:text-sm tracking-[0.28em] uppercase text-sage mb-6">
          {t.home.footerFeedbackEyebrow}
        </p>

        <div className="min-h-[9rem] md:min-h-[11rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <blockquote className="font-serif text-2xl md:text-4xl leading-tight text-cream mb-5">
                &ldquo;{current.quote}&rdquo;
              </blockquote>
              <p className="font-sans text-sm text-cream/60 tracking-wide">
                {current.names} &mdash; {current.location}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2.5 mt-10 mb-9">
          {testimonials.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${item.names}`}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === index ? 'w-8 bg-sage' : 'w-1.5 bg-cream/25 hover:bg-cream/45'
              }`}
            />
          ))}
        </div>

        <RouterLinkButton to="/sessions" size="lg">
          {t.home.footerCtaButton}
        </RouterLinkButton>
      </motion.div>
    </Section>
  )
}
