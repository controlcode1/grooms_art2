import { imageSrcSet, type PortfolioImage } from '@/lib/data/portfolio'
import { useI18n } from '@/lib/i18n'

interface ChapterSectionProps {
  chapterKey: 'morning' | 'ceremony' | 'portraits' | 'golden' | 'evening'
  index: number
  frames: readonly PortfolioImage[]
}

export function ChapterSection({ chapterKey, index, frames }: ChapterSectionProps) {
  const { t } = useI18n()
  const label = t.fullDay.chapters[chapterKey]
  const [featured, ...rest] = frames
  const featuredSrc = imageSrcSet(featured.id)

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 py-14 md:py-20 border-t border-charcoal/10">
      <div className="md:col-span-3">
        <span className="font-serif text-5xl text-sage/40">
          {String(index + 1).padStart(2, '0')}
        </span>
        <h2 className="font-serif text-2xl md:text-3xl text-charcoal mt-2">{label}</h2>
      </div>

      <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <img
          src={featuredSrc.lg}
          srcSet={`${featuredSrc.md} 960w, ${featuredSrc.lg} 1600w`}
          sizes="(min-width: 768px) 45vw, 100vw"
          alt={featured.alt}
          loading="lazy"
          className="w-full h-full object-cover sm:col-span-2 max-h-[520px]"
        />
        {rest.map((img) => {
          const src = imageSrcSet(img.id)
          return (
            <img
              key={img.id}
              src={src.md}
              alt={img.alt}
              loading="lazy"
              className="w-full h-64 object-cover"
            />
          )
        })}
      </div>
    </div>
  )
}
