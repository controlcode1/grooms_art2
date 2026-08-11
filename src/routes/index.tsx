import { createFileRoute } from '@tanstack/react-router'
import { Hero } from '@/features/home/components/Hero'
import { IntroStatement } from '@/features/home/components/IntroStatement'
import { PortfolioPreview } from '@/features/home/components/PortfolioPreview'
import { Testimonials } from '@/features/home/components/Testimonials'

export const Route = createFileRoute('/')({
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
