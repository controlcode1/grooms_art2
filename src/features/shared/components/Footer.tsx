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
          src="/images/footer-bg.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover object-center blur-[1px] scale-105 brightness-[0.55] contrast-[1.05] pointer-events-none"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.8fr_1fr_1fr] gap-10 md:gap-16">
          {/* Brand Intro & Tagline */}
          <div className="sm:col-span-2 md:col-span-1 space-y-4">
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
          <div className="col-span-1">
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
              <li>
                <Link
                  to="/contact"
                  className="hover:text-white transition-all duration-300 inline-block hover:translate-x-1 rtl:hover:-translate-x-1 drop-shadow-xs"
                >
                  {locale === 'ar' ? 'اتصل بنا' : 'Contact Us'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect / Socials */}
          <div className="col-span-1">
            <p className="font-sans text-[10px] tracking-[0.26em] uppercase text-cream/45 mb-4 font-semibold">
              {t.footer.connect}
            </p>
            <ul className="flex flex-col gap-2.5 font-sans text-xs sm:text-sm text-cream/80">
              <li>
                <a
                  href="https://www.instagram.com/grooms_art?igsi=bG5zd3JxcGNoeGw0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-all duration-300 inline-block hover:translate-x-1 rtl:hover:-translate-x-1"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/share/1LjaCqJf4e/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-all duration-300 inline-block hover:translate-x-1 rtl:hover:-translate-x-1"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="https://www.tiktok.com/@abusajida97?_r=1&_t=ZS-992A8AcoF0x"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-all duration-300 inline-block hover:translate-x-1 rtl:hover:-translate-x-1"
                >
                  TikTok
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Section>
    </footer>
  )
}
