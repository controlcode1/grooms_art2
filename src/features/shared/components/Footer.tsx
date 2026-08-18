import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useI18n } from '@/lib/i18n'
import { Section } from './Section'

export function Footer() {
  const { t, locale } = useI18n()
  const year = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden bg-[#161311] text-cream border-t border-white/10">
      {/* ─── 1. IMAGE BACKGROUND WITH SUBTLE BLUR & EDITORIAL OVERLAY ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
        {/* Background Image with subtle blur & slight scale to eliminate edge artifacts */}
        <img
          src="/images/footer-bg.jpg"
          alt="Footer Background"
          className="absolute inset-0 w-full h-full object-cover object-center blur-[4px] scale-105 brightness-[0.42] contrast-[1.08] pointer-events-none"
        />

        {/* Warm Cinematic Gradient Overlay for Maximum Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#161311]/80 via-[#161311]/50 to-[#0F0D0C]/90 pointer-events-none" />

        {/* Subtle Warm Amber Glow Ambient Tint */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(191,160,130,0.12),transparent_70%)] pointer-events-none" />

        {/* Fine Grain Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.03] texture-linen pointer-events-none" />
      </div>

      {/* ─── 2. GLOBAL FOOTER CONTENT & HIGH-CONTRAST TYPOGRAPHY ─── */}
      <Section className="relative z-10 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1.1fr_1fr] gap-10 md:gap-12">
          {/* Brand Intro & Tagline */}
          <div className="space-y-4">
            <Link to="/" className="inline-block transition-opacity duration-300 hover:opacity-90">
              <img
                src="/images/logo.png"
                alt="Grooms Art Logo"
                className="h-9 md:h-10 w-auto object-contain brightness-0 invert opacity-95 drop-shadow-sm"
              />
            </Link>

            <p className="font-sans text-xs md:text-sm text-cream/70 max-w-sm leading-relaxed drop-shadow-xs">
              {t.meta.tagline}
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <p className="font-sans text-[10px] tracking-[0.26em] uppercase text-cream/45 mb-4 font-semibold">
              {t.footer.navigate}
            </p>
            <ul className="flex flex-col gap-2.5 font-sans text-xs sm:text-sm text-cream/80">
              <li>
                <Link
                  to="/portfolio"
                  className="hover:text-white transition-all duration-300 inline-block hover:translate-x-1 rtl:hover:-translate-x-1 drop-shadow-xs"
                >
                  {locale === 'ar' ? 'معرض الأعمال' : 'Portfolio'}
                </Link>
              </li>
              <li>
                <Link
                  to="/full-day"
                  className="hover:text-white transition-all duration-300 inline-block hover:translate-x-1 rtl:hover:-translate-x-1 drop-shadow-xs"
                >
                  {locale === 'ar' ? 'اليوم الكامل' : 'Full Day'}
                </Link>
              </li>
              <li>
                <Link
                  to="/sessions"
                  className="hover:text-white transition-all duration-300 inline-block hover:translate-x-1 rtl:hover:-translate-x-1 drop-shadow-xs"
                >
                  {locale === 'ar' ? 'جلسات التصوير' : 'Sessions'}
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="hover:text-white transition-all duration-300 inline-block hover:translate-x-1 rtl:hover:-translate-x-1 drop-shadow-xs"
                >
                  {locale === 'ar' ? 'عن الاستوديو' : 'About Us'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Studio Details */}
          <div>
            <p className="font-sans text-[10px] tracking-[0.26em] uppercase text-cream/45 mb-4 font-semibold">
              {t.footer.studio}
            </p>
            <ul className="flex flex-col gap-2.5 font-sans text-xs sm:text-sm text-cream/75 leading-relaxed">
              <li className="hover:text-white transition-colors duration-300">
                <a href="mailto:studio@groomsart.com" className="hover:underline">
                  studio@groomsart.com
                </a>
              </li>
              <li className="hover:text-white transition-colors duration-300 font-sans" dir="ltr">
                <a href="tel:+9647700000000" className="hover:underline text-left">
                  +964 (770) 000-0000
                </a>
              </li>
              <li className="text-cream/55">
                {locale === 'ar' ? 'بحجز مسبق، في جميع أنحاء العالم' : 'By appointment, worldwide'}
              </li>
            </ul>
          </div>

          {/* Connect / Socials */}
          <div>
            <p className="font-sans text-[10px] tracking-[0.26em] uppercase text-cream/45 mb-4 font-semibold">
              {t.footer.connect}
            </p>
            <ul className="flex flex-col gap-2.5 font-sans text-xs sm:text-sm text-cream/80">
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-all duration-300 inline-block hover:translate-x-1 rtl:hover:-translate-x-1"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://pinterest.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-all duration-300 inline-block hover:translate-x-1 rtl:hover:-translate-x-1"
                >
                  Pinterest
                </a>
              </li>
              <li>
                <a
                  href="https://vimeo.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-all duration-300 inline-block hover:translate-x-1 rtl:hover:-translate-x-1"
                >
                  Vimeo
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Section>
    </footer>
  )
}
