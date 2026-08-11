import { useEffect, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { clsx } from 'clsx'
import { useI18n } from '@/lib/i18n'
import { PalmEmblem } from './PalmEmblem'

const links = [
  { to: '/', key: 'home' as const },
  { to: '/portfolio', key: 'portfolio' as const },
  { to: '/full-day', key: 'fullDay' as const },
  { to: '/sessions', key: 'sessions' as const },
  { to: '/about', key: 'about' as const },
]

export function Navbar() {
  const { t, locale, toggleLocale } = useI18n()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const isHome = pathname === '/'
  const isLightHeader = isHome && !scrolled && !open

  return (
    <header className="fixed inset-x-0 top-0 z-50 p-4 md:p-6 flex justify-center pointer-events-none">
      <nav
        className={clsx(
          'w-full max-w-6xl flex items-center justify-between px-6 md:px-10 py-3.5 rounded-full transition-all duration-500 border pointer-events-auto',
          scrolled || open
            ? 'bg-sand/90 backdrop-blur-md border-charcoal/10 shadow-[0_4px_24px_rgba(17,17,17,0.04)]'
            : 'bg-transparent border-transparent'
        )}
      >
        <Link to="/" className="block py-0.5 transition-opacity duration-300 hover:opacity-85">
          <img
            src={isLightHeader ? '/images/logo-light.png' : '/images/logo.png'}
            alt="Grooms Art Logo"
            className="h-8 md:h-9 w-auto object-contain"
          />
        </Link>

        <div className="hidden md:flex items-center gap-10">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.to === '/' }}
              className={clsx(
                'font-sans text-sm tracking-wide transition-colors duration-500',
                isLightHeader
                  ? 'text-cream/80 hover:text-cream'
                  : 'text-charcoal/70 hover:text-forest'
              )}
              activeProps={{
                className: isLightHeader ? '!text-cream font-medium' : '!text-forest font-semibold'
              }}
            >
              {t.nav[link.key]}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center">
          <button
            type="button"
            onClick={toggleLocale}
            className={clsx(
              'font-sans text-xs tracking-[0.2em] uppercase transition-colors duration-500',
              isLightHeader
                ? 'text-cream/70 hover:text-cream'
                : 'text-charcoal/65 hover:text-forest'
            )}
            aria-label="Toggle language"
          >
            {locale === 'en' ? 'AR' : 'EN'}
          </button>
        </div>

        <button
          type="button"
          className="md:hidden flex flex-col gap-1.5 w-8 h-8 items-end justify-center"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? t.nav.close : t.nav.menu}
          aria-expanded={open}
        >
          <span
            className={clsx(
              'h-px transition-all duration-500',
              isLightHeader ? 'bg-cream' : 'bg-charcoal',
              open ? 'w-6 -rotate-45 translate-y-[3px]' : 'w-6',
            )}
          />
          <span
            className={clsx(
              'h-px transition-all duration-500',
              isLightHeader ? 'bg-cream' : 'bg-charcoal',
              open ? 'w-6 rotate-45 -translate-y-[3px]' : 'w-4',
            )}
          />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-[80px] left-4 right-4 md:hidden overflow-hidden rounded-3xl border border-charcoal/10 bg-sand/95 backdrop-blur-md shadow-lg pointer-events-auto"
          >
            <div className="flex flex-col px-6 py-6 gap-5">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="font-serif text-2xl text-charcoal hover:text-forest transition-colors duration-300"
                  activeProps={{ className: '!text-forest' }}
                >
                  {t.nav[link.key]}
                </Link>
              ))}
              <div className="divider-hairline my-1" />
              <button
                type="button"
                onClick={toggleLocale}
                className="font-sans text-xs tracking-[0.2em] uppercase text-charcoal/70 text-start hover:text-forest transition-colors duration-300"
              >
                {locale === 'en' ? 'العربية' : 'English'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
