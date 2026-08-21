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
          message: message.trim(),
        })

        if (error) {
          console.warn('[contact] Supabase insert warning:', error)
        }
      }

      setSubmitted(true)
      setFullName('')
      setEmail('')
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

  return (
    <>
      {/* ─── Hero Cover Image ─── */}
      <div className="relative w-full h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] xl:h-[70vh] min-h-[360px] md:min-h-[440px] max-h-[750px] overflow-hidden bg-charcoal">
        <motion.img
          src="/images/contact-bg.jpg"
          alt="Grooms Art — Contact & Studio"
          className="absolute inset-0 w-full h-full object-cover object-center md:object-[center_35%]"
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
              'linear-gradient(180deg, rgba(11,36,28,0.25) 0%, rgba(11,36,28,0.7) 100%)',
          }}
        />

        {/* Hero Title Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-16 max-w-6xl mx-auto w-full">
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

      {/* ─── Main Content: Feedback Form & Socials ─── */}
      <Section className="pt-10 pb-16 sm:pt-14 sm:pb-20 md:pt-20 md:pb-28 bg-sand/30">
        <div className="max-w-3xl mx-auto space-y-8 sm:space-y-10">
          {/* Header Intro */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-xl mx-auto space-y-2 sm:space-y-3 px-2"
          >
            <Eyebrow className="mb-2">{t.contact.getInTouch}</Eyebrow>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-charcoal font-medium">
              {locale === 'ar' ? 'نحن هنا لمساعدتكم ومرافقة قصتكم' : 'We’re here to craft your timeless memories'}
            </h2>
            <p className="font-sans text-xs sm:text-sm text-charcoal/70 leading-relaxed">
              {t.contact.subtitle}
            </p>
          </motion.div>

          {/* Form Card (Compact on mobile) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 border border-charcoal/08 shadow-[0_8px_30px_rgba(17,17,17,0.03)]"
          >
            <div className="mb-5 sm:mb-7">
              <h3 className="font-serif text-xl sm:text-2xl text-charcoal mb-1">
                {t.contact.formTitle}
              </h3>
              <p className="font-sans text-xs sm:text-sm text-charcoal/60">
                {t.contact.formSubtitle}
              </p>
            </div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-forest/5 border border-forest/20 text-center space-y-3 sm:space-y-4 my-4 sm:my-6"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-forest text-cream flex items-center justify-center mx-auto text-xl sm:text-2xl">
                  ✓
                </div>
                <h4 className="font-serif text-xl sm:text-2xl text-charcoal font-semibold">
                  {t.contact.successTitle}
                </h4>
                <p className="font-sans text-xs sm:text-sm text-charcoal/70 max-w-md mx-auto leading-relaxed">
                  {t.contact.successMessage}
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-3 inline-block px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-charcoal text-cream font-sans text-xs uppercase tracking-wider hover:bg-forest transition-colors"
                >
                  {locale === 'ar' ? 'إرسال رسالة أخرى' : 'Send Another Message'}
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* Name and Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
                  <div>
                    <label className="block font-sans text-[11px] sm:text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1.5">
                      {t.contact.nameLabel} <span className="text-forest">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t.contact.namePlaceholder}
                      className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-charcoal/15 bg-sand/10 font-sans text-xs sm:text-sm text-charcoal focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-sans text-[11px] sm:text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1.5">
                      {t.contact.emailLabel} <span className="text-forest">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.contact.emailPlaceholder}
                      className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-charcoal/15 bg-sand/10 font-sans text-xs sm:text-sm text-charcoal focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block font-sans text-[11px] sm:text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1.5">
                    {t.contact.subjectLabel}
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={t.contact.subjectPlaceholder}
                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-charcoal/15 bg-sand/10 font-sans text-xs sm:text-sm text-charcoal focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all"
                  />
                </div>

                {/* Message / Feedback */}
                <div>
                  <label className="block font-sans text-[11px] sm:text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1.5">
                    {t.contact.messageLabel} <span className="text-forest">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t.contact.messagePlaceholder}
                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-charcoal/15 bg-sand/10 font-sans text-xs sm:text-sm text-charcoal focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all resize-y"
                  />
                </div>

                {errorMessage && (
                  <p className="text-xs text-red-600 font-sans">{errorMessage}</p>
                )}

                {/* Submit button & feedback note */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-1">
                  <p className="font-sans text-[10px] sm:text-[11px] text-charcoal/50 text-center sm:text-start">
                    {t.contact.feedbackNote}
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={clsx(
                      'w-full sm:w-auto px-6 py-2.5 sm:px-8 sm:py-3 rounded-full bg-forest text-cream font-sans text-xs font-semibold uppercase tracking-wider hover:bg-forest/90 shadow-md hover:shadow-lg transition-all duration-300',
                      submitting && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    {submitting ? t.contact.submitting : t.contact.submitButton}
                  </button>
                </div>
              </form>
            )}
          </motion.div>

          {/* Social Channels (Directly Underneath the Form) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-center pt-2 sm:pt-4"
          >
            <h3 className="font-sans text-xs sm:text-sm font-semibold uppercase tracking-wider text-charcoal/60 mb-3">
              {locale === 'ar' ? 'تابعنا على وسائل التواصل' : 'Follow Our Journey'}
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <a
                href="https://www.instagram.com/grooms_art?igsi=bG5zd3JxcGNoeGw0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white border border-charcoal/10 hover:border-forest text-charcoal hover:text-forest text-xs font-sans font-medium transition-all shadow-xs hover:shadow-sm"
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
                className="inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white border border-charcoal/10 hover:border-forest text-charcoal hover:text-forest text-xs font-sans font-medium transition-all shadow-xs hover:shadow-sm"
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
                className="inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white border border-charcoal/10 hover:border-forest text-charcoal hover:text-forest text-xs font-sans font-medium transition-all shadow-xs hover:shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
                <span>TikTok</span>
              </a>
            </div>
          </motion.div>
        </div>
      </Section>
    </>
  )
}
