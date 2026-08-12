import { createFileRoute } from '@tanstack/react-router'
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
    <div className="relative min-h-screen">
      {/* Full-page background cover — user's cinematic image */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/fullday-hero.jpg')" }}
        aria-hidden="true"
      />
      {/* Subtle warm overlay for contrast and depth */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            'linear-gradient(180deg, rgba(8,22,16,0.52) 0%, rgba(8,22,16,0.38) 40%, rgba(8,22,16,0.60) 100%)',
        }}
        aria-hidden="true"
      />
      <FullDayPackages />
    </div>
  )
}

