import type { ReactNode } from 'react'
import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useLocation,
} from '@tanstack/react-router'
import { I18nProvider } from '@/lib/i18n'
import { Navbar } from '@/features/shared/components/Navbar'
import { Footer } from '@/features/shared/components/Footer'
import appCss from '@/styles/app.css?url'

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'Grooms Art',
  description:
    'Editorial wedding photography and cinematic film studio, shot in natural light.',
  image: '/images/fullday-bg.jpg',
  priceRange: '$$$',
  areaServed: 'Worldwide',
  sameAs: [],
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        title: 'Grooms Art — Editorial Wedding Photography & Film',
      },
      {
        name: 'description',
        content:
          'Grooms Art is an editorial wedding photography and cinematic film studio — natural light, authentic moments, timeless frames.',
      },
      { property: 'og:title', content: 'Grooms Art — Editorial Wedding Photography & Film' },
      {
        property: 'og:description',
        content:
          'Organic luxury wedding photography and cinematic film, shot in natural light.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: '/images/fullday-bg.jpg' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'theme-color', content: '#12372A' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'icon', href: '/favicon.png', type: 'image/png' },
      { rel: 'apple-touch-icon', href: '/favicon.png' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href:
          'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Manrope:wght@400;500;600;700&family=Cairo:wght@400;500;600;700&display=swap',
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})

function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="font-sans text-[10px] tracking-[0.28em] uppercase text-sage mb-6">
        404
      </p>
      <h1 className="font-serif text-4xl md:text-6xl text-charcoal mb-4">
        This frame couldn&apos;t be found.
      </h1>
      <p className="font-sans text-sm text-charcoal/50 max-w-sm mb-10 leading-relaxed">
        The page you&apos;re looking for may have moved, or this link may no longer exist.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link
          to="/"
          className="font-sans text-xs tracking-[0.2em] uppercase bg-forest text-cream px-8 py-4 rounded-lg hover:bg-forest/90 transition-colors duration-500"
        >
          Back to Home
        </Link>
        <Link
          to="/portfolio"
          className="font-sans text-xs tracking-[0.2em] uppercase border border-charcoal/20 text-charcoal/70 px-8 py-4 rounded-lg hover:border-forest hover:text-forest transition-colors duration-500"
        >
          View Portfolio
        </Link>
      </div>
    </div>
  )
}

function RootComponent() {
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')
  const hideFooter = isDashboard || location.pathname === '/full-day' || location.pathname === '/sessions'

  return (
    <RootDocument>
      <I18nProvider>
        {!isDashboard && <Navbar />}
        <main className="min-h-screen bg-[#FAFAF7]">
          <Outlet />
        </main>
        {!hideFooter && <Footer />}
      </I18nProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
