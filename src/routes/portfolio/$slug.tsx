import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { Section } from '@/features/shared/components/Section'
import { 
  imageSrcSet, 
  staticPortfolioImages, 
  getPublicUrl, 
  type PortfolioImage 
} from '@/lib/data/portfolio'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase/client'

export const Route = createFileRoute('/portfolio/$slug')({
  loader: async ({ params }) => {
    let image = staticPortfolioImages.find((img) => img.slug === params.slug)

    if (!image && supabase) {
      const { data, error } = await supabase
        .from('portfolio_images')
        .select('*')
        .eq('slug', params.slug)
        .maybeSingle()
      
      if (!error && data) {
        image = {
          id: getPublicUrl(data.storage_path),
          dbId: data.id,
          slug: data.slug,
          title: data.title,
          alt: data.alt || '',
          category: data.category,
          partOfFullDay: data.part_of_full_day,
          orientation: data.orientation || 'landscape',
          storagePath: data.storage_path,
          exif: {
            camera: 'Sony A7 IV',
            lens: '35mm f/1.4 GM',
            focalLength: '35mm',
            aperture: 'f/2.2',
            shutter: '1/500s',
            iso: 'ISO 100',
          },
        }
      }
    }

    if (!image) throw notFound()

    // Fetch related images from Supabase
    let related: PortfolioImage[] = []
    if (supabase) {
      const { data: dbRelated } = await supabase
        .from('portfolio_images')
        .select('*')
        .eq('category', image.category)
        .neq('slug', params.slug)
        .limit(3)
      
      if (dbRelated) {
        related = dbRelated.map((row: any) => ({
          id: getPublicUrl(row.storage_path),
          dbId: row.id,
          slug: row.slug,
          title: row.title,
          alt: row.alt || '',
          category: row.category,
          partOfFullDay: row.part_of_full_day,
          orientation: row.orientation || 'landscape',
          storagePath: row.storage_path,
          exif: {
            camera: 'Sony A7 IV',
            lens: '35mm f/1.4 GM',
            focalLength: '35mm',
            aperture: 'f/2.2',
            shutter: '1/500s',
            iso: 'ISO 100',
          },
        }))
      }
    }

    const staticRelated = staticPortfolioImages.filter(
      (img) => img.category === image.category && img.slug !== params.slug
    )
    const combinedRelated = [...related, ...staticRelated].slice(0, 3)

    return { image, related: combinedRelated }
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
  const { image, related } = Route.useLoaderData()
  const { t } = useI18n()
  const src = imageSrcSet(image.id)

  return (
    <Section className="pt-32 pb-24 md:pt-40 md:pb-32">
      <Link
        to="/portfolio"
        className="font-sans text-xs tracking-[0.2em] uppercase text-charcoal/60 hover:text-forest transition-colors duration-500"
      >
        ← {t.portfolio.backToPortfolio}
      </Link>

      <div className="mt-8 frame-mat max-w-4xl">
        <img
          src={src.lg}
          srcSet={image.id.startsWith('data:') || image.id.startsWith('blob:') ? undefined : `${src.md} 960w, ${src.lg} 1600w`}
          sizes={image.id.startsWith('data:') || image.id.startsWith('blob:') ? undefined : "(min-width: 768px) 70vw, 100vw"}
          alt={image.alt}
          className="w-full h-auto"
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
