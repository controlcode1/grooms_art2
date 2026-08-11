import { createFileRoute } from '@tanstack/react-router'
import { FullDayHero } from '@/features/full-day/components/FullDayHero'
import { FullDayPackages } from '@/features/full-day/components/FullDayPackages'

export const Route = createFileRoute('/full-day')({
  head: () => ({
    meta: [
      { title: 'The Full Day Experience — Grooms Art' },
      {
        name: 'description',
        content:
          'A narrative-driven, chronological account of full-day wedding photography and cinematic film coverage by Grooms Art.',
      },
    ],
  }),
  component: FullDayPage,
})

function FullDayPage() {
  return (
    <>
      <FullDayHero />
      <FullDayPackages />
    </>
  )
}
