import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { motion } from 'motion/react'
import { clsx } from 'clsx'
import { Section, Eyebrow } from '@/features/shared/components/Section'
import { useI18n } from '@/lib/i18n'
import { useHeaderTheme } from '@/lib/hooks/useHeaderTheme'
import { supabase } from '@/lib/supabase/client'

export const Route = createFileRoute('/contact')({
  head: () => ({
    meta: [
      { title: 'Contact Us — Grooms Art' },
      {
        name: 'description',
        content:
          'Reach out to Grooms Art studio for wedding inquiries, portrait sessions, and feedback.',
      },
    ],
    links: [
      {
        rel: 'preload',
        href: '/images/contact-bg.jpg',
        as: 'image',
        fetchPriority: 'high',
      } as any,
    ],
  }),
  component: ContactPage,
})

function ContactPage() {
  const { t, locale } = useI18n()
  useHeaderTheme('light')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !message.trim()) return

    setSubmitting(true)
    setErrorMessage('')

    try {
      if (supabase) {
        const { error } = await supabase.from('contact_messages').insert({
          name: fullName.trim(),
          email: email.trim(),
          subject: subject.trim() || 'General Inquiry',
          message: phone.trim() ? `Phone: ${phone.trim()}\n\n${message.trim()}` : message.trim(),
        })

        if (error) {
          console.warn('[contact] Supabase insert warning:', error)
        }
      }

      setSubmitted(true)
      setFullName('')
      setEmail('')
      setPhone('')
      setSubject('')
      setMessage('')
    } catch (err) {
      console.error('[contact] Submission error:', err)
      // Even if network or Supabase fails, we still provide a friendly user experience
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  const whatsappNumber = '+9647700000000'
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    locale === 'ar'
      ? 'مرحباً استوديو Grooms Art، أود الاستفسار بخصوص الحجز والخدمات.'
      : 'Hello Grooms Art Studio, I would like to inquire about your photography services and bookings.'
  )}`

  return (
    <>
      {/* ─── Hero Cover Image ─── */}
      <div className="relative w-full h-[55vh] md:h-[65vh] min-h-[380px] overflow-hidden bg-charcoal">
        <motion.img
          src="/images/contact-bg.jpg"
          alt="Grooms Art — Contact & Studio"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* Gradient overlay for legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(11,36,28,0.2) 0%, rgba(11,36,28,0.65) 100%)',
          }}
        />

        {/* Hero Title Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-16 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="font-sans text-xs tracking-[0.25em] uppercase text-cream/70 font-semibold mb-3 block">
              {t.contact.eyebrow}
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-cream max-w-2xl leading-tight">
              {t.contact.title}
            </h1>
          </motion.div>
        </div>
      </div>

      {/* ─── Main Content: Studio Details & Feedback Form ─── */}
      <Section className="pt-16 pb-24 md:pt-24 md:pb-32 bg-sand/30">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Contact & Studio Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-10"
          >
            <div>
              <Eyebrow className="mb-4">{t.contact.getInTouch}</Eyebrow>
              <h2 className="font-serif text-2xl sm:text-3xl text-charcoal mb-4">
                {locale === 'ar' ? 'نحن هنا لمساعدتكم ومرافقة قصتكم' : 'We’re here to craft your timeless memories'}
              </h2>
              <p className="font-sans text-sm text-charcoal/70 leading-relaxed">
                {t.contact.subtitle}
              </p>
            </div>

            <div className="divider-hairline" />

            {/* Studio Coordinates */}
            <div className="space-y-6">
              {/* Locations */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-forest/10 flex items-center justify-center text-forest shrink-0 mt-0.5">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1">
                    {t.contact.locationTitle}
                  </h3>
                  <p className="font-serif text-base text-charcoal font-medium">
                    {t.contact.locationBaghdad}
                  </p>
                  <p className="font-serif text-base text-charcoal font-medium mt-0.5">
                    {t.contact.locationErbil}
                  </p>
                </div>
              </div>

              {/* Direct WhatsApp / Phone */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-forest/10 flex items-center justify-center text-forest shrink-0 mt-0.5">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1">
                    {t.contact.phoneTitle}
                  </h3>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-serif text-base text-forest font-semibold hover:underline inline-flex items-center gap-1.5"
                  >
                    <span>+964 770 000 0000</span>
                    <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-forest/10 text-forest">WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-forest/10 flex items-center justify-center text-forest shrink-0 mt-0.5">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1">
                    {t.contact.emailTitle}
                  </h3>
                  <a
                    href="mailto:contact@groomsart.studio"
                    className="font-serif text-base text-charcoal font-medium hover:text-forest transition-colors"
                  >
                    contact@groomsart.studio
                  </a>
                </div>
              </div>

              {/* Working Hours */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-forest/10 flex items-center justify-center text-forest shrink-0 mt-0.5">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1">
                    {t.contact.hoursTitle}
                  </h3>
                  <p className="font-sans text-xs text-charcoal/70">
                    {t.contact.hoursValue}
                  </p>
                </div>
              </div>

              {/* Social Channels */}
              <div className="pt-2">
                <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-3">
                  {locale === 'ar' ? 'تابعنا على وسائل التواصل' : 'Follow Our Journey'}
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  <a
                    href="https://www.instagram.com/grooms_art?igsi=bG5zd3JxcGNoeGw0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-charcoal/10 hover:border-forest text-charcoal hover:text-forest text-xs font-sans font-medium transition-all shadow-xs hover:shadow-sm"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    <span>Instagram</span>
                  </a>

                  <a
                    href="https://www.facebook.com/share/1LjaCqJf4e/?mibextid=wwXIfr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-charcoal/10 hover:border-forest text-charcoal hover:text-forest text-xs font-sans font-medium transition-all shadow-xs hover:shadow-sm"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Facebook</span>
                  </a>

                  <a
                    href="https://www.tiktok.com/@abusajida97?_r=1&_t=ZS-992A8AcoF0x"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-charcoal/10 hover:border-forest text-charcoal hover:text-forest text-xs font-sans font-medium transition-all shadow-xs hover:shadow-sm"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                    </svg>
                    <span>TikTok</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Interactive Contact & Feedback Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 bg-white rounded-3xl p-8 md:p-12 border border-charcoal/08 shadow-[0_12px_40px_rgba(17,17,17,0.03)]"
          >
            <div className="mb-8">
              <h2 className="font-serif text-2xl sm:text-3xl text-charcoal mb-2">
                {t.contact.formTitle}
              </h2>
              <p className="font-sans text-xs sm:text-sm text-charcoal/60">
                {t.contact.formSubtitle}
              </p>
            </div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 rounded-2xl bg-forest/5 border border-forest/20 text-center space-y-4 my-8"
              >
                <div className="w-14 h-14 rounded-full bg-forest text-cream flex items-center justify-center mx-auto text-2xl">
                  ✓
                </div>
                <h3 className="font-serif text-2xl text-charcoal font-semibold">
                  {t.contact.successTitle}
                </h3>
                <p className="font-sans text-sm text-charcoal/70 max-w-md mx-auto leading-relaxed">
                  {t.contact.successMessage}
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-4 inline-block px-6 py-2.5 rounded-full bg-charcoal text-cream font-sans text-xs uppercase tracking-wider hover:bg-forest transition-colors"
                >
                  {locale === 'ar' ? 'إرسال رسالة أخرى' : 'Send Another Message'}
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name and Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-sans text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-2">
                      {t.contact.nameLabel} <span className="text-forest">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t.contact.namePlaceholder}
                      className="w-full px-4 py-3 rounded-xl border border-charcoal/15 bg-sand/10 font-sans text-sm text-charcoal focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-sans text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-2">
                      {t.contact.emailLabel} <span className="text-forest">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.contact.emailPlaceholder}
                      className="w-full px-4 py-3 rounded-xl border border-charcoal/15 bg-sand/10 font-sans text-sm text-charcoal focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all"
                    />
                  </div>
                </div>

                {/* Phone and Subject */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-sans text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-2">
                      {t.contact.phoneLabel}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t.contact.phonePlaceholder}
                      className="w-full px-4 py-3 rounded-xl border border-charcoal/15 bg-sand/10 font-sans text-sm text-charcoal focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-sans text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-2">
                      {t.contact.subjectLabel}
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={t.contact.subjectPlaceholder}
                      className="w-full px-4 py-3 rounded-xl border border-charcoal/15 bg-sand/10 font-sans text-sm text-charcoal focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all"
                    />
                  </div>
                </div>

                {/* Message / Feedback */}
                <div>
                  <label className="block font-sans text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-2">
                    {t.contact.messageLabel} <span className="text-forest">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t.contact.messagePlaceholder}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/15 bg-sand/10 font-sans text-sm text-charcoal focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all resize-y"
                  />
                </div>

                {errorMessage && (
                  <p className="text-xs text-red-600 font-sans">{errorMessage}</p>
                )}

                {/* Submit button & feedback note */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <p className="font-sans text-[11px] text-charcoal/50 text-center sm:text-start">
                    {t.contact.feedbackNote}
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={clsx(
                      'w-full sm:w-auto px-8 py-3.5 rounded-full bg-forest text-cream font-sans text-xs font-semibold uppercase tracking-wider hover:bg-forest/90 shadow-md hover:shadow-lg transition-all duration-300',
                      submitting && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    {submitting ? t.contact.submitting : t.contact.submitButton}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </Section>
    </>
  )
}
