import { motion } from 'motion/react'
import { useI18n } from '@/lib/i18n'
import { Section, Eyebrow } from '@/features/shared/components/Section'

export function IntroStatement() {
  const { t } = useI18n()

  return (
    <Section className="py-24 md:py-32">
      <div className="max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <Eyebrow className="mb-5">{t.home.introEyebrow}</Eyebrow>
          <h2 className="font-serif text-3xl md:text-5xl leading-tight text-charcoal max-w-2xl">
            {t.home.introTitle}
          </h2>
          <p className="mt-6 max-w-xl font-sans text-sm md:text-base text-charcoal/65 leading-relaxed">
            {t.home.introBody}
          </p>
        </motion.div>
      </div>
    </Section>
  )
}
