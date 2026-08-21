import { motion } from 'motion/react'
import { clsx } from 'clsx'
import { useHeaderTheme } from '@/lib/hooks/useHeaderTheme'

interface PageHeroProps {
  title: string
  subtitle?: string
  image?: string
  height?: string
  className?: string
}

export function PageHero({
  title,
  subtitle,
  image = '/images/fullday-bg.webp',
  height = 'h-[42vh] sm:h-[48vh] md:h-[55vh]',
  className,
}: PageHeroProps) {
  useHeaderTheme('light')

  return (
    <div
      className={clsx(
        'relative w-full overflow-hidden flex items-center justify-center',
        height,
        className,
      )}
    >
      {/* Background Image with subtle zoom on load */}
      <motion.div
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 w-full h-full"
      >
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover object-center"
          fetchPriority="high"
        />
        {/* Cinematic dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </motion.div>

      {/* Centered Content: Elegant Pill/Oval Badge with Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center text-center px-4"
      >
        {/* Pill / Oval Badge */}
        <div className="inline-flex items-center justify-center px-8 py-3.5 sm:px-12 sm:py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/25 shadow-2xl">
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white tracking-wide font-normal">
            {title}
          </h1>
        </div>

        {subtitle && (
          <p className="mt-4 font-sans text-xs sm:text-sm tracking-[0.2em] uppercase text-white/70 max-w-md">
            {subtitle}
          </p>
        )}
      </motion.div>
    </div>
  )
}
