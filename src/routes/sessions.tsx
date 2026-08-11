import { createFileRoute } from '@tanstack/react-router'
import { Section } from '@/features/shared/components/Section'
import { SessionsWizard } from '@/features/sessions/SessionsWizard'

export const Route = createFileRoute('/sessions')({
  head: () => ({
    meta: [
      { title: 'Sessions — Grooms Art' },
      {
        name: 'description',
        content:
          'Book your photography session with Grooms Art — choose your city, package, location, and date.',
      },
    ],
  }),
  component: SessionsPage,
})

function SessionsPage() {
  return (
    <Section className="pt-32 pb-24 md:pt-40 md:pb-32">
      <SessionsWizard />
    </Section>
  )
}
