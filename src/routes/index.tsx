import { createFileRoute } from '@tanstack/react-router'
import { Hero } from '@/features/home/components/Hero'
import { IntroStatement } from '@/features/home/components/IntroStatement'
import { PortfolioPreview } from '@/features/home/components/PortfolioPreview'
import { Testimonials } from '@/features/home/components/Testimonials'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Grooms Art — Wedding Photography & Film' },
      { name: 'description', content: 'Editorial wedding photography and cinematic film by Grooms Art.' },
    ],
    links: [
      {
        rel: 'preload',
        href: '/images/hero-poster.webp',
        as: 'image',
        fetchPriority: 'high',
      } as any,
    ],
  }),
  component: Home,
})

function Home() {
  return (
    <>
      <Hero />
      <IntroStatement />
      <PortfolioPreview />
      <Testimonials />
    </>
  )
}
