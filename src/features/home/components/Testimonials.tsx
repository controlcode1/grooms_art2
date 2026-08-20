import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useI18n } from '@/lib/i18n'
import { Section, Eyebrow } from '@/features/shared/components/Section'
import { getTestimonialsSync, getTestimonials, type Testimonial } from '@/lib/data/portfolio'

export function Testimonials() {
  const { t, locale } = useI18n()
  const [items, setItems] = useState<Testimonial[]>(() => getTestimonialsSync())

  useEffect(() => {
    getTestimonials().then(setItems)
  }, [])

  const isAr = locale === 'ar'

  return (
    <Section className="py-24 md:py-32 bg-linen texture-linen" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mb-14 max-w-xl">
        <Eyebrow className="mb-4">{t.home.testimonialsEyebrow}</Eyebrow>
        <h2 className="font-serif text-3xl md:text-5xl text-charcoal">
          {t.home.testimonialsTitle}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
        {items.map((item, i) => {
          const quote = isAr ? (item.quoteAr || item.quote) : item.quote
          const names = isAr ? (item.namesAr || item.names) : item.names
          const loc   = isAr ? (item.locationAr || item.location) : item.location
          return (
            <motion.figure
              key={item.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col"
            >
              <span className="font-serif text-5xl text-sage/50 leading-none mb-3">&ldquo;</span>
              <blockquote className="font-serif text-lg md:text-xl text-charcoal/85 leading-relaxed italic">
                {quote}
              </blockquote>
              <figcaption className="mt-6 font-sans text-xs tracking-[0.15em] uppercase text-charcoal/50">
                {names} &mdash; {loc}
              </figcaption>
            </motion.figure>
          )
        })}
      </div>
    </Section>
  )
}
