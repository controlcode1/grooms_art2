import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Section } from '@/features/shared/components/Section'
import { imageSrcSet, getPortfolioImages, preloadIdbImages, isInlineImage } from '@/lib/data/portfolio'
import { useI18n } from '@/lib/i18n'

export const Route = createFileRoute('/portfolio/$slug')({
  loader: ({ params }) => {
    const image = getPortfolioImages().find((img) => img.slug === params.slug)
    if (!image) throw notFound()
    return { image }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.image.title} — Grooms Art Portfolio` },
          { name: 'description', content: loaderData.image.alt },
          { property: 'og:image', content: imageSrcSet(loaderData.image.id).lg },
        ]
      : [],
  }),
  component: PortfolioDetail,
  notFoundComponent: () => (
    <Section className="pt-40 pb-32 text-center">
      <p className="font-serif text-3xl text-charcoal">This frame couldn&apos;t be found.</p>
      <Link to="/portfolio" className="font-sans text-sm underline mt-4 inline-block">
        Back to Portfolio
      </Link>
    </Section>
  ),
})

function PortfolioDetail() {
  const { image } = Route.useLoaderData()
  const { t } = useI18n()
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    preloadIdbImages().then(() => forceUpdate((n) => n + 1))
  }, [])

  const src = imageSrcSet(image.id)

  const related = getPortfolioImages()
    .filter((img) => img.category === image.category && img.id !== image.id)
    .slice(0, 3)

  return (
    <Section className="pt-32 pb-24 md:pt-40 md:pb-32">
      <Link
        to="/portfolio"
        className="font-sans text-xs tracking-[0.2em] uppercase text-charcoal/60 hover:text-forest transition-colors duration-500"
      >
        ← {t.portfolio.backToPortfolio}
      </Link>

      <div className="mt-8 max-w-4xl overflow-hidden rounded-2xl shadow-sm">
        <img
          src={src.lg}
          srcSet={isInlineImage(image.id) ? undefined : `${src.md} 960w, ${src.lg} 1600w`}
          sizes={isInlineImage(image.id) ? undefined : "(min-width: 768px) 70vw, 100vw"}
          alt={image.alt}
          className="w-full h-auto block"
        />
      </div>

      <div className="mt-8 max-w-4xl">
        <h1 className="font-serif text-3xl md:text-5xl text-charcoal">{image.title}</h1>
      </div>

      {related.length > 0 && (
        <div className="mt-20">
          <p className="font-sans text-xs tracking-[0.2em] uppercase text-sage mb-6">
            More from this session
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((img) => {
              const relSrc = imageSrcSet(img.id)
              return (
                <Link
                  key={img.id}
                  to="/portfolio/$slug"
                  params={{ slug: img.slug }}
                  className="block overflow-hidden bg-linen group"
                >
                  <img
                    src={relSrc.md}
                    alt={img.alt}
                    loading="lazy"
                    className="w-full h-64 object-cover group-hover:scale-[1.03] transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                  />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </Section>
  )
}
