import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Section, Eyebrow } from '@/features/shared/components/Section'
import { imageSrcSet } from '@/lib/data/portfolio'
import { useI18n } from '@/lib/i18n'

export const Route = createFileRoute('/about')({
  head: () => ({
    meta: [
      { title: 'Our Story — Grooms Art' },
      {
        name: 'description',
        content:
          'The philosophy and people behind Grooms Art — an editorial wedding photography and film studio.',
      },
    ],
  }),
  component: AboutPage,
})

import { useHeaderTheme } from '@/lib/hooks/useHeaderTheme'

function AboutPage() {
  const { t, locale } = useI18n()
  useHeaderTheme('light')

  return (
    <>
      {/* ─── Hero Image Block ─── */}
      <div className="relative w-full h-[55vh] md:h-[65vh] min-h-[380px] overflow-hidden bg-charcoal">
        <motion.img
          src="/images/about-hero.webp"
          alt="Grooms Art — editorial wedding photography"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          initial={{ scale: 1.04, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* Gradient overlay for legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(11,36,28,0.15) 0%, rgba(11,36,28,0.55) 100%)',
          }}
        />
      </div>

      {/* ─── Content Block ─── */}
      <Section className="pt-16 pb-24 md:pt-20 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          <Eyebrow className="mb-5">{t.about.eyebrow}</Eyebrow>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-charcoal leading-tight mb-8">
            {t.about.title}
          </h1>

          <p className="font-serif italic text-xl md:text-2xl text-charcoal/65 leading-relaxed mb-10">
            {t.about.intro}
          </p>

          <div className="divider-hairline mb-10" />

          <p className="font-sans text-sm md:text-base text-charcoal/65 leading-relaxed mb-6">
            {t.about.philosophyBody}
          </p>

          <p className="font-sans text-sm md:text-base text-charcoal/65 leading-relaxed">
            {locale === 'ar'
              ? 'فريقنا المحترف من المصورين وصُنّاع الأفلام يرافقكم باهتمام بأدق التفاصيل في بغداد وأربيل، لنمنحكم إرثاً بصرياً تتوارثه الأجيال.'
              : 'Our dedicated team of photographers and cinematographers accompanies you across Baghdad and Erbil, creating a timeless visual legacy to be cherished for generations.'}
          </p>
        </motion.div>
      </Section>
    </>
  )
}
