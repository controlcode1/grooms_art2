import { createFileRoute } from '@tanstack/react-router'
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
          'The philosophy, equipment, and people behind Grooms Art — an editorial wedding photography and film studio.',
      },
    ],
  }),
  component: AboutPage,
})

function AboutPage() {
  const { t } = useI18n()
  const philosophyImg = imageSrcSet('frame-08')
  const equipmentImg = imageSrcSet('frame-12')
  const teamImg = imageSrcSet('frame-05')

  return (
    <>
      <Section className="pt-32 pb-20 md:pt-40 md:pb-28">
        <Eyebrow className="mb-5">{t.about.eyebrow}</Eyebrow>
        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-charcoal max-w-3xl leading-tight mb-8">
          {t.about.title}
        </h1>
        <p className="font-serif italic text-xl md:text-2xl text-charcoal/70 max-w-2xl leading-relaxed">
          {t.about.intro}
        </p>
      </Section>

      <Section className="pb-24 md:pb-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-center border-t border-charcoal/10 pt-16">
          <div className="md:col-span-5 md:order-2">
            <img
              src={philosophyImg.lg}
              alt="Editorial wedding photography in natural light"
              className="w-full h-[420px] object-cover"
              loading="lazy"
            />
          </div>
          <div className="md:col-span-7 md:order-1">
            <h2 className="font-serif text-3xl md:text-4xl text-charcoal mb-5">
              {t.about.philosophyTitle}
            </h2>
            <p className="font-sans text-sm md:text-base text-charcoal/65 leading-relaxed max-w-xl">
              {t.about.philosophyBody}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-center border-t border-charcoal/10 pt-16 mt-16">
          <div className="md:col-span-5">
            <img
              src={equipmentImg.lg}
              alt="Studio equipment and craft"
              className="w-full h-[420px] object-cover"
              loading="lazy"
            />
          </div>
          <div className="md:col-span-7">
            <h2 className="font-serif text-3xl md:text-4xl text-charcoal mb-5">
              {t.about.equipmentTitle}
            </h2>
            <p className="font-sans text-sm md:text-base text-charcoal/65 leading-relaxed max-w-xl">
              {t.about.equipmentBody}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-center border-t border-charcoal/10 pt-16 mt-16">
          <div className="md:col-span-5 md:order-2">
            <img
              src={teamImg.lg}
              alt="The Grooms Art team on location"
              className="w-full h-[420px] object-cover"
              loading="lazy"
            />
          </div>
          <div className="md:col-span-7 md:order-1">
            <h2 className="font-serif text-3xl md:text-4xl text-charcoal mb-5">
              {t.about.teamTitle}
            </h2>
            <p className="font-sans text-sm md:text-base text-charcoal/65 leading-relaxed max-w-xl">
              A small, deliberate team of photographers and cinematographers who travel
              light and shoot honestly — on location, in any season, anywhere in the world.
            </p>
          </div>
        </div>
      </Section>
    </>
  )
}
