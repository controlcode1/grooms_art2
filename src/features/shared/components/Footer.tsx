import { Link } from '@tanstack/react-router'
import { useI18n } from '@/lib/i18n'
import { PalmEmblem } from './PalmEmblem'
import { Section } from './Section'

export function Footer() {
  const { t } = useI18n()

  return (
    <footer className="bg-[#0a0a0a] text-cream">
      <Section className="py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-8 md:gap-10">
          <div>
            <Link to="/" className="block mb-3 transition-opacity duration-300 hover:opacity-85">
              <img
                src="/images/logo-light.png"
                alt="Grooms Art Logo"
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="font-sans text-sm text-cream/70 max-w-xs leading-relaxed">
              {t.meta.tagline}
            </p>
          </div>

          <div>
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-cream/40 mb-3">
              {t.footer.navigate}
            </p>
            <ul className="flex flex-col gap-2.5 font-sans text-sm text-cream/75">
              <li><Link to="/portfolio" className="hover:text-cream transition-colors duration-400">Portfolio</Link></li>
              <li><Link to="/full-day" className="hover:text-cream transition-colors duration-400">Full Day</Link></li>
              <li><Link to="/sessions" className="hover:text-cream transition-colors duration-400">Sessions</Link></li>
              <li><Link to="/about" className="hover:text-cream transition-colors duration-400">About</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-cream/40 mb-3">
              {t.footer.studio}
            </p>
            <ul className="flex flex-col gap-2.5 font-sans text-sm text-cream/75">
              <li>studio@groomsart.com</li>
              <li>+1 (555) 019-2244</li>
              <li>By appointment, worldwide</li>
            </ul>
          </div>

          <div>
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-cream/40 mb-3">
              {t.footer.connect}
            </p>
            <ul className="flex flex-col gap-2.5 font-sans text-sm text-cream/75">
              <li><a href="#" className="hover:text-cream transition-colors duration-400">Instagram</a></li>
              <li><a href="#" className="hover:text-cream transition-colors duration-400">Pinterest</a></li>
              <li><a href="#" className="hover:text-cream transition-colors duration-400">Vimeo</a></li>
            </ul>
          </div>
        </div>
      </Section>
    </footer>
  )
}
