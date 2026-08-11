import { createFileRoute } from '@tanstack/react-router'
import { Section, Eyebrow } from '@/features/shared/components/Section'
import { BookingWizard } from '@/features/booking/BookingWizard'
import { useI18n } from '@/lib/i18n'

export const Route = createFileRoute('/book-session')({
  head: () => ({
    meta: [
      { title: 'Book a Session — Grooms Art' },
      {
        name: 'description',
        content:
          'Reserve your wedding photography and film session with Grooms Art — choose a package, pick a date, and secure your booking.',
      },
    ],
  }),
  component: BookSessionPage,
})

function BookSessionPage() {
  const { t } = useI18n()

  return (
    <Section className="pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="max-w-2xl mb-14">
        <Eyebrow className="mb-4">{t.booking.eyebrow}</Eyebrow>
        <h1 className="font-serif text-4xl md:text-6xl text-charcoal mb-5">
          {t.booking.title}
        </h1>
        <p className="font-sans text-sm md:text-base text-charcoal/60 leading-relaxed">
          {t.booking.subtitle}
        </p>
      </div>

      <BookingWizard />
    </Section>
  )
}
