import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useI18n } from '@/lib/i18n'
import { Section, Eyebrow } from '@/features/shared/components/Section'
import { imageSrcSet, portfolioImages } from '@/lib/data/portfolio'

const PREVIEW_IDS = ['frame-03', 'frame-10', 'frame-07', 'frame-18', 'frame-22', 'frame-25']

const previewImages = PREVIEW_IDS.map((id) =>
  portfolioImages.find((img) => img.id === id),
).filter(Boolean) as typeof portfolioImages

export function PortfolioPreview() {
  const { t } = useI18n()

  return (
    <Section className="py-24 md:py-32">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div>
          <Eyebrow className="mb-4">{t.home.previewEyebrow}</Eyebrow>
          <h2 className="font-serif text-3xl md:text-5xl text-charcoal">
            {t.home.previewTitle}
          </h2>
        </div>
        <Link
          to="/portfolio"
          className="font-sans text-xs tracking-[0.2em] uppercase border-b border-charcoal/40 hover:border-forest hover:text-forest transition-colors duration-500 pb-1 w-fit"
        >
          {t.home.previewCta}
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 md:grid-rows-2 gap-3 md:gap-4">
        {previewImages.map((img, i) => {
          const src = imageSrcSet(img.id)
          const spanClass = [
            'col-span-2 md:col-span-3 md:row-span-2',
            'col-span-1 md:col-span-3',
            'col-span-1 md:col-span-2',
            'col-span-1 md:col-span-2 md:row-span-1',
            'col-span-1 md:col-span-2',
            'hidden md:block md:col-span-3',
          ][i]

          return (
            <motion.div
              key={img.id}
              className={`${spanClass} overflow-hidden rounded-lg bg-linen`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link to="/portfolio/$slug" params={{ slug: img.slug }} className="block h-full">
                <img
                  src={src.md}
                  srcSet={`${src.sm} 480w, ${src.md} 960w, ${src.lg} 1600w`}
                  sizes="(min-width: 768px) 33vw, 50vw"
                  alt={img.alt}
                  loading={i < 2 ? 'eager' : 'lazy'}
                  className="w-full h-full object-cover aspect-[4/5] md:aspect-auto hover:scale-[1.03] transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                />
              </Link>
            </motion.div>
          )
        })}
      </div>
    </Section>
  )
}
