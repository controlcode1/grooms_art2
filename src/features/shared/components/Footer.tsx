import { Link } from '@tanstack/react-router'
import { useI18n } from '@/lib/i18n'
import { Section } from './Section'

export function Footer() {
  const { t } = useI18n()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-[#f0ece4] border-t border-charcoal/08 text-charcoal">
      <Section className="py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-8 md:gap-10">
          <div>
            <Link to="/" className="block mb-3 transition-opacity duration-300 hover:opacity-85">
              <img
                src="/images/logo.png"
                alt="Grooms Art Logo"
                className="h-8 md:h-9 w-auto object-contain"
              />
            </Link>
            <p className="font-sans text-xs text-charcoal/60 max-w-xs leading-relaxed">
              {t.meta.tagline}
            </p>
          </div>

          <div>
            <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-charcoal/40 mb-3 font-semibold">
              {t.footer.navigate}
            </p>
            <ul className="flex flex-col gap-2 font-sans text-xs text-charcoal/70">
              <li><Link to="/portfolio" className="hover:text-forest transition-colors duration-300">Portfolio</Link></li>
              <li><Link to="/full-day" className="hover:text-forest transition-colors duration-300">Full Day</Link></li>
              <li><Link to="/sessions" className="hover:text-forest transition-colors duration-300">Sessions</Link></li>
              <li><Link to="/about" className="hover:text-forest transition-colors duration-300">About</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-charcoal/40 mb-3 font-semibold">
              {t.footer.studio}
            </p>
            <ul className="flex flex-col gap-2 font-sans text-xs text-charcoal/70">
              <li>studio@groomsart.com</li>
              <li>+1 (555) 019-2244</li>
              <li>By appointment, worldwide</li>
            </ul>
          </div>

          <div>
            <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-charcoal/40 mb-3 font-semibold">
              {t.footer.connect}
            </p>
            <ul className="flex flex-col gap-2 font-sans text-xs text-charcoal/70">
              <li><a href="#" className="hover:text-forest transition-colors duration-300">Instagram</a></li>
              <li><a href="#" className="hover:text-forest transition-colors duration-300">Pinterest</a></li>
              <li><a href="#" className="hover:text-forest transition-colors duration-300">Vimeo</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-charcoal/06 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="font-sans text-[11px] text-charcoal/40">
            © {year} Grooms Art Studio. All rights reserved.
          </p>
          <p className="font-sans text-[11px] text-charcoal/35">
            Editorial Wedding Photography & Film
          </p>
        </div>
      </Section>
    </footer>
  )
}
