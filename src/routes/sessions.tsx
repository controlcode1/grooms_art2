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
    links: [
      {
        rel: 'preload',
        href: '/images/sessions-bg.webp',
        as: 'image',
        fetchPriority: 'high',
      } as any,
    ],
  }),
  component: SessionsPage,
})

function SessionsPage() {
  return <SessionsWizard />
}
