import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { clsx } from 'clsx'
import { PalmEmblem } from '@/features/shared/components/PalmEmblem'
import { useI18n } from '@/lib/i18n'
import { storage, STORAGE_KEYS } from '@/lib/storage'
import { supabase } from '@/lib/supabase/client'
import {
  getPortfolioImages,
  savePortfolioImages,
  getPortfolioCategories,
  savePortfolioCategories,
  DEFAULT_CATEGORIES,
  deletePortfolioImage as apiDeletePortfolioImage,
  updatePortfolioImage as apiUpdatePortfolioImage,
  deletePortfolioCategory as apiDeletePortfolioCategory,
  preloadIdbImages,
  cacheIdbImage,
  imageSrcSet,
  getStorageUsedBytes,
  STORAGE_LIMIT_BYTES,
  type PortfolioImage,
  type CategoryInfo,
  getTestimonials,
  saveTestimonial,
  deleteTestimonial,
  type Testimonial,
} from '@/lib/data/portfolio'
import { idbSaveImage } from '@/lib/imageDb'
import { getPresignedUploadUrl } from '@/lib/r2'
import {
  getLocationsForCity,
  DEFAULT_LOCATIONS,
  type Location,
  type CityId,
} from '@/lib/data/locations'
import {
  type Booking,
  type BookingStatus,
  type BookingType,
  triggerWhatsApp,
} from '@/lib/types/booking'
import {
  loadAllPackages,
  upsertPackage,
  deletePackage,
  reorderPackages,
  type Package,
  type PackageFeatureGroup,
} from '@/lib/data/packages'

export const Route = createFileRoute('/dashboard')({
  head: () => ({
    meta: [{ title: 'Dashboard — Grooms Art' }],
  }),
  component: DashboardPage,
})

// ─── Constants ──────────────────────────────────────────────────────────────
const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })

type DashboardTab = 'bookings' | 'availability' | 'packages' | 'portfolio' | 'kindWords'

// ─── Client-side WebP Image Optimization ─────────────────────────────────────
async function optimizeToWebP(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxW = 1200 // Max optimized width for speed & storage
        let w = img.width
        let h = img.height
        if (w > maxW) {
          h = Math.round((h * maxW) / w)
          w = maxW
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        // Convert to WebP data URL with 0.8 quality
        const dataUrl = canvas.toDataURL('image/webp', 0.8)
        resolve(dataUrl)
      }
      img.onerror = () => reject(new Error('Image loading failed'))
      img.src = event.target?.result as string
    }
    reader.onerror = () => reject(new Error('File reading failed'))
    reader.readAsDataURL(file)
  })
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={clsx(
        'rounded-3xl p-6 border transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.03)]',
        accent
          ? 'bg-forest text-cream border-forest/90 shadow-md'
          : 'bg-white border-charcoal/15 text-charcoal',
      )}
    >
      <p
        className={clsx(
          'font-sans text-[11px] tracking-[0.22em] uppercase mb-3 font-semibold',
          accent ? 'text-cream/75' : 'text-charcoal/65',
        )}
      >
        {label}
      </p>
      <p
        className={clsx(
          'font-serif text-4xl sm:text-5xl mb-1 font-light tracking-tight',
          accent ? 'text-cream' : 'text-charcoal',
        )}
      >
        {value}
      </p>
      {sub && (
        <p
          className={clsx(
            'font-sans text-xs',
            accent ? 'text-cream/70' : 'text-charcoal/60',
          )}
        >
          {sub}
        </p>
      )}
    </motion.div>
  )
}

function SectionHeading({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-serif text-2xl sm:text-3xl text-charcoal font-medium">{title}</h2>
      {desc && <p className="font-sans text-xs text-charcoal/65 mt-1.5 leading-relaxed">{desc}</p>}
    </div>
  )
}

function getFreetextForLanguage(features: PackageFeatureGroup[] | undefined, lang: 'en' | 'ar'): string {
  if (!features || !Array.isArray(features)) return ''
  const freetextGroup = features.find((g) => g.type === 'freetext')
  if (freetextGroup) {
    return lang === 'ar' ? (freetextGroup.ar || '') : (freetextGroup.en || '')
  }
  return features
    .map((g) => {
      const title = lang === 'ar' ? (g.title_ar || g.title) : g.title
      const items = lang === 'ar' ? (g.items_ar || g.items) : g.items
      if (!title && (!items || items.length === 0)) return ''
      const itemsText = items.map((it) => `• ${it}`).join('\n')
      return title ? `— ${title}\n${itemsText}` : itemsText
    })
    .filter(Boolean)
    .join('\n\n')
}

function PackageEditorCard({
  pkg,
  d,
  locale,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
  isSaved,
  onClose,
}: {
  pkg: Package
  d: any
  locale: string
  onSave: (pkg: Package) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onMoveUp: () => Promise<void>
  onMoveDown: () => Promise<void>
  isSaved?: boolean
  onClose?: () => void
}) {
  const [formData, setFormData] = useState<Package>(pkg)
  const [saving, setSaving] = useState(false)
  const [cardTab, setCardTab] = useState<'info' | 'features'>('info')
  const [enText, setEnText] = useState(() => getFreetextForLanguage(pkg.features, 'en'))
  const [arText, setArText] = useState(() => getFreetextForLanguage(pkg.features, 'ar'))

  useEffect(() => {
    setFormData(pkg)
    setEnText(getFreetextForLanguage(pkg.features, 'en'))
    setArText(getFreetextForLanguage(pkg.features, 'ar'))
  }, [pkg])

  const featuresCount = useMemo(() => {
    const lines = enText.split('\n').map((l) => l.trim()).filter(Boolean)
    return lines.filter(l => !l.startsWith('—')).length
  }, [enText])

  const submitSave = async () => {
    setSaving(true)
    const updatedFeatures: PackageFeatureGroup[] = [
      {
        type: 'freetext',
        en: enText,
        ar: arText,
        title: '',
        items: []
      }
    ]
    await onSave({ ...formData, features: updatedFeatures })
    setSaving(false)
  }

  return (
    <div className="bg-white border border-charcoal/15 rounded-3xl p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-6">
      {/* ─── Header with Title, Status & Actions ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-charcoal/10 pb-5">
        <div className="flex items-center gap-3.5 flex-wrap">
          {/* Active / Hidden Toggle */}
          <button
            type="button"
            onClick={() => setFormData({ ...formData, active: !formData.active })}
            className={clsx(
              'font-sans text-[11px] tracking-wider uppercase px-3.5 py-1.5 rounded-full font-semibold transition-all shadow-xs flex items-center gap-1.5',
              formData.active
                ? 'bg-forest/10 text-forest border border-forest/20 hover:bg-forest/15'
                : 'bg-charcoal/08 text-charcoal/60 border border-charcoal/10 hover:bg-charcoal/12',
            )}
          >
            <span className={clsx('w-2.5 h-2.5 rounded-full', formData.active ? 'bg-forest' : 'bg-charcoal/40')} />
            <span>{formData.active ? d.visibleOnSite : d.hiddenFromSite}</span>
          </button>

          {/* Package Name & Price Preview */}
          <div className="flex items-baseline gap-2">
            <h3 className="font-serif text-xl sm:text-2xl text-charcoal font-medium">
              {formData.name || 'Untitled Package'}
            </h3>
            {formData.name_ar && (
              <span className="font-sans text-sm text-charcoal/50">· {formData.name_ar}</span>
            )}
            <span className="font-serif text-xl sm:text-2xl text-forest font-light ml-1">
              ${formData.price?.toLocaleString()}
            </span>
          </div>

          {formData.badge && (
            <span className="font-sans text-[10px] tracking-wider uppercase px-3 py-1 rounded-full bg-linen border border-charcoal/10 text-charcoal font-semibold">
              {formData.badge}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onMoveUp}
            className="px-3 py-1.5 text-charcoal hover:text-forest border border-charcoal/20 hover:border-forest/40 rounded-xl text-xs font-sans font-medium transition-colors bg-white shadow-2xs"
            title={d.moveUp}
          >
            ↑ {d.moveUp}
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            className="px-3 py-1.5 text-charcoal hover:text-forest border border-charcoal/20 hover:border-forest/40 rounded-xl text-xs font-sans font-medium transition-colors bg-white shadow-2xs"
            title={d.moveDown}
          >
            ↓ {d.moveDown}
          </button>
          <button
            type="button"
            onClick={() => onDelete(pkg.id)}
            className="font-sans text-xs uppercase text-red-600 hover:text-red-700 font-semibold px-3 py-1.5 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 transition-colors"
          >
            {d.remove}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="font-sans text-xs uppercase text-charcoal/50 hover:text-charcoal px-3 py-1.5 rounded-xl border border-charcoal/20 bg-white hover:bg-charcoal/05 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ─── Sub-Tabs Bar: Info vs Features ─── */}
      <div className="flex border-b border-charcoal/10 gap-6">
        <button
          type="button"
          onClick={() => setCardTab('info')}
          className={clsx(
            'font-sans text-xs uppercase tracking-wider pb-3 font-semibold transition-all relative flex items-center gap-2',
            cardTab === 'info'
              ? 'text-forest border-b-2 border-forest -mb-px'
              : 'text-charcoal/50 hover:text-charcoal',
          )}
        >
          <span>{locale === 'ar' ? 'المعلومات والأسعار' : 'Info & Pricing'}</span>
        </button>

        <button
          type="button"
          onClick={() => setCardTab('features')}
          className={clsx(
            'font-sans text-xs uppercase tracking-wider pb-3 font-semibold transition-all relative flex items-center gap-2',
            cardTab === 'features'
              ? 'text-forest border-b-2 border-forest -mb-px'
              : 'text-charcoal/50 hover:text-charcoal',
          )}
        >
          <span>{locale === 'ar' ? 'المميزات والمحتويات' : 'Features & Deliverables'}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest/10 text-forest font-bold">
            {featuresCount}
          </span>
        </button>
      </div>

      {/* ─── SUB-TAB 1: INFO & PRICING ─── */}
      {cardTab === 'info' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Row 1: Names EN & AR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-sans text-[11px] uppercase tracking-wider text-charcoal font-semibold block mb-1.5">
                {d.nameEn} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Essential Collection"
                className="w-full font-sans text-xs text-charcoal font-medium border border-charcoal/20 bg-white rounded-xl px-3.5 py-3 outline-none focus:border-forest focus:ring-2 focus:ring-forest/15 transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="font-sans text-[11px] uppercase tracking-wider text-charcoal font-semibold block mb-1.5 text-right">
                {d.nameAr} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                placeholder="مثلاً الباقة الأساسية"
                className="w-full font-sans text-xs text-charcoal font-medium border border-charcoal/20 bg-white rounded-xl px-3.5 py-3 outline-none focus:border-forest focus:ring-2 focus:ring-forest/15 transition-all shadow-2xs text-right"
              />
            </div>
          </div>

          {/* Row 2: Price USD, Badge EN, Badge AR */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-sans text-[11px] uppercase tracking-wider text-charcoal font-semibold block mb-1.5">
                {d.priceUsd} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-serif text-forest text-base font-semibold pointer-events-none">
                  $
                </span>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full font-sans text-xs text-charcoal font-semibold border border-charcoal/20 bg-white rounded-xl pl-8 pr-3.5 py-3 outline-none focus:border-forest focus:ring-2 focus:ring-forest/15 transition-all shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="font-sans text-[11px] uppercase tracking-wider text-charcoal font-semibold block mb-1.5">
                {d.badgeEn || 'Badge (EN)'}
              </label>
              <input
                type="text"
                value={formData.badge || ''}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                placeholder="e.g. Most Popular"
                className="w-full font-sans text-xs text-charcoal font-medium border border-charcoal/20 bg-white rounded-xl px-3.5 py-3 outline-none focus:border-forest focus:ring-2 focus:ring-forest/15 transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="font-sans text-[11px] uppercase tracking-wider text-charcoal font-semibold block mb-1.5 text-right">
                {d.badgeAr || 'Badge (AR)'}
              </label>
              <input
                type="text"
                value={formData.badge_ar || ''}
                onChange={(e) => setFormData({ ...formData, badge_ar: e.target.value })}
                placeholder="مثلاً الأكثر طلباً"
                className="w-full font-sans text-xs text-charcoal font-medium border border-charcoal/20 bg-white rounded-xl px-3.5 py-3 outline-none focus:border-forest focus:ring-2 focus:ring-forest/15 transition-all shadow-2xs text-right"
              />
            </div>
          </div>

          {/* Row 3: Package Key */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-sans text-[11px] uppercase tracking-wider text-charcoal font-semibold block mb-1.5">
                {d.packageKey}
              </label>
              <input
                type="text"
                value={formData.package_key}
                onChange={(e) => setFormData({ ...formData, package_key: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                className="w-full font-sans text-xs border border-charcoal/15 rounded-xl px-3.5 py-3 bg-white text-charcoal font-mono outline-none focus:border-forest focus:ring-2 focus:ring-forest/15 shadow-2xs"
              />
            </div>
          </div>

          {/* Row 4: Descriptions EN & AR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-sans text-[11px] uppercase tracking-wider text-charcoal font-semibold block mb-1.5">
                {d.descEn}
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Brief editorial summary of the collection..."
                className="w-full font-sans text-xs text-charcoal font-medium border border-charcoal/20 bg-white rounded-xl px-3.5 py-3 outline-none focus:border-forest focus:ring-2 focus:ring-forest/15 transition-all shadow-2xs resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="font-sans text-[11px] uppercase tracking-wider text-charcoal font-semibold block mb-1.5 text-right">
                {d.descAr}
              </label>
              <textarea
                value={formData.description_ar || ''}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                rows={3}
                placeholder="نبذة توثيقية مختصرة عن تفاصيل الباقة..."
                className="w-full font-sans text-xs text-charcoal font-medium border border-charcoal/20 bg-white rounded-xl px-3.5 py-3 outline-none focus:border-forest focus:ring-2 focus:ring-forest/15 transition-all shadow-2xs resize-none leading-relaxed text-right"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── SUB-TAB 2: FEATURES & DELIVERABLES ─── */}
      {cardTab === 'features' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="bg-linen/40 p-4 rounded-2xl border border-charcoal/10">
            <h4 className="font-serif text-lg text-charcoal font-medium">
              {locale === 'ar' ? 'تفاصيل الباقة والمحتويات' : 'Package Details & Deliverables'}
            </h4>
            <p className="font-sans text-xs text-charcoal/65 mt-1 leading-relaxed text-left rtl:text-right">
              {locale === 'ar'
                ? 'اكتب كل ميزة أو خدمة في سطر جديد. استخدم "—" قبل العنوان لإنشاء عنوان قسم جديد (مثلاً: — الألبوم).'
                : 'Enter each feature or service on a new line. Prefix titles with "—" to create section headers (e.g., — Album).'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="font-sans text-[11px] uppercase tracking-wider text-charcoal font-semibold block mb-1.5">
                Package Details (EN)
              </label>
              <textarea
                value={enText}
                onChange={(e) => setEnText(e.target.value)}
                rows={10}
                placeholder="— Album&#10;• 30x60 cm Main Album&#10;• 5 Pages&#10;&#10;— Film&#10;• 30-60 Seconds Reel"
                className="w-full font-sans text-xs text-charcoal bg-white border border-charcoal/20 rounded-xl p-4 outline-none focus:border-forest focus:ring-2 focus:ring-forest/15 resize-none leading-relaxed shadow-2xs"
              />
            </div>

            <div>
              <label className="font-sans text-[11px] uppercase tracking-wider text-charcoal font-semibold block mb-1.5 text-right">
                تفاصيل الباقة (AR)
              </label>
              <textarea
                value={arText}
                onChange={(e) => setArText(e.target.value)}
                rows={10}
                placeholder="— الألبوم&#10;• ألبوم رئيسي قياس 30x60 سم&#10;• 5 صفحات&#10;&#10;— الفيديو&#10;• ريل سينمائي 30-60 ثانية"
                className="w-full font-sans text-xs text-charcoal bg-white border border-charcoal/20 rounded-xl p-4 outline-none focus:border-forest focus:ring-2 focus:ring-forest/15 resize-none leading-relaxed text-right shadow-2xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Footer with Save Action ─── */}
      <div className="border-t border-charcoal/10 pt-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          {isSaved && (
            <span className="font-sans text-xs text-forest font-bold flex items-center gap-1.5 animate-fadeIn bg-forest/10 px-3 py-1.5 rounded-full">
              <span>✓</span>
              <span>{d.packageSaved}</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={submitSave}
          disabled={saving}
          className="font-sans text-xs tracking-wider uppercase bg-forest text-cream px-8 py-3.5 rounded-xl hover:bg-forest-deep transition-all font-semibold shadow-sm disabled:opacity-50 min-h-[44px] flex items-center gap-2"
        >
          {saving ? 'Saving…' : d.savePackage}
        </button>
      </div>
    </div>
  )
}

// ─── Login Screen ────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!supabase) {
      setError('Supabase is not configured. Check your .env file.')
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)

    if (authError) {
      setError('Incorrect email or password. Please try again.')
      setShake(true)
      setTimeout(() => setShake(false), 600)
    } else {
      onLogin()
    }
  }

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm flex flex-col items-center text-center"
      >
        <div className="flex items-center gap-3 mb-8 justify-center">
          <PalmEmblem className="w-8 h-8 text-sage" />
          <span className="font-serif text-xl text-cream">Grooms Art</span>
        </div>

        <h1 className="font-serif text-3xl text-cream mb-2">Studio Access</h1>
        <p className="font-sans text-sm text-cream/45 mb-8">
          Private photographer dashboard — restricted access.
        </p>

        <motion.form
          onSubmit={handleSubmit}
          animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-5 w-full text-left"
        >
          <label className="block">
            <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-cream/40 block mb-2">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null) }}
              placeholder="admin@groomsart.com"
              className="w-full font-sans text-sm bg-white/05 border border-cream/10 rounded-xl px-4 py-3.5 text-cream placeholder:text-cream/20 outline-none transition-all duration-300 focus:border-sage/60 focus:bg-white/08"
              autoFocus
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-cream/40 block mb-2">
              Password
            </span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null) }}
                placeholder="••••••••"
                className={clsx(
                  'w-full font-sans text-sm bg-white/05 border rounded-xl pl-4 pr-12 py-3.5 text-cream placeholder:text-cream/20 outline-none transition-all duration-300',
                  error
                    ? 'border-red-400/60 focus:border-red-400'
                    : 'border-cream/10 focus:border-sage/60 focus:bg-white/08',
                )}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cream/35 hover:text-cream/75 transition-colors focus-visible:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {error && (
              <p className="font-sans text-xs text-red-400/80 mt-2 text-left">{error}</p>
            )}
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 font-sans text-xs tracking-[0.2em] uppercase bg-forest text-cream py-4 rounded-xl hover:bg-forest-deep transition-colors duration-500 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Enter Dashboard'}
          </button>
        </motion.form>
      </motion.div>
    </div>
  )
}

// ─── Dashboard Local Translations ───────────────────────────────────────────
const DASHBOARD_T = {
  en: {
    bookings: 'Bookings',
    availability: 'Availability',
    packages: 'Package Management',
    portfolio: 'Portfolio',
    totalBookings: 'Total Bookings',
    pendingApproval: 'Pending Approval',
    baghdad: 'Baghdad',
    erbil: 'Erbil',
    all: 'All',
    pending: 'Pending',
    confirmed: 'Confirmed',
    approved: 'Approved',
    bookedOn: 'Booked on',
    fullDay: 'Full Day',
    session: 'Session',
    customer: 'Customer',
    phone: 'Phone',
    email: 'Email',
    cityPackage: 'City & Package',
    locationId: 'Location ID',
    targetDate: 'Target Date',
    notes: 'Notes',
    sendWelcome: '💬 Send Welcome & Deposit',
    welcomeSent: '✓ Welcome & Deposit Sent',
    sendFinal: '💬 Send Final Confirm',
    bookingApproved: '✓ Booking Approved',
    deleteRecord: 'Delete Record',
    noBookings: 'No bookings match this filter',
    // Upcoming Bookings
    upcomingTitle: 'Upcoming Bookings (Next 3 Days)',
    upcomingDesc: 'Bookings scheduled for today, tomorrow, and the next day.',
    viewDetails: 'View Details',
    // Availability
    dateBlocking: 'Date Blocking',
    dateBlockingDesc: 'Click dates on the calendar to toggle blocked/unblocked status for bookings.',
    availabilityWorkflowNote: 'Bookings continue arriving normally. You review booking requests manually and decide when a day should become Fully Booked or closed.',
    blockedDatesList: 'Blocked Dates List',
    noBlockedDates: 'No blocked dates. Click dates on the calendar to block them.',
    unblock: 'Unblock',
    locationsManagement: 'Locations Management',
    locationsManagementDesc: 'Manage available locations for Baghdad and Erbil booking flows separately.',
    addLocationTo: 'Add Location to',
    addLocationOption: 'Add Location Option',
    nameEn: 'English Name',
    nameAr: 'Arabic Name',
    descEn: 'English Description',
    descAr: 'Arabic Description',
    remove: 'Remove',
    // Packages Management
    packagesManagement: 'Package Management',
    packagesManagementDesc: 'Manage pricing, features, and visibility for each city and service. Changes reflect immediately on the website.',
    sessionsService: 'Sessions',
    fullDayService: 'Full Day',
    addPackage: '+ Add New Package',
    savePackage: 'Save Package',
    packageSaved: '✓ Package Saved to Supabase',
    packageDeleted: 'Package Deleted',
    packageKey: 'Package Slug/Key (e.g. essential)',
    priceUsd: 'Price (USD $)',
    badgeOptional: 'Badge / Pill Label (e.g. Most Popular)',
    accentColorOptional: 'Accent Color (Hex, e.g. #12372a)',
    imageUrlOptional: 'Image URL (Optional)',
    visibleOnSite: 'Visible on Website',
    hiddenFromSite: 'Hidden from Website',
    featureSections: 'Feature Sections & Deliverables',
    addSection: '+ Add Section',
    sectionTitle: 'Section Title (e.g. Album, Film, Includes)',
    featuresPlaceholder: 'Features (one item per line)',
    moveUp: '↑ Up',
    moveDown: '↓ Down',
    // Portfolio
    portfolioCategories: 'Portfolio Categories',
    portfolioCategoriesDesc: 'Add new sections to your gallery archive.',
    catCode: 'Category Code (e.g. weddings)',
    catNameEn: 'English Category Name',
    catNameAr: 'Arabic Category Name',
    createCat: 'Create Category',
    uploadImages: 'Upload Portfolio Images',
    uploadDesc: 'Select one or more images. Automatic conversion to optimized WebP.',
    emptyCat: 'This category has no images yet. Upload some images above to showcase them.',
    deleteCat: 'Delete Category',
    rename: 'Rename',
    save: 'Save',
    cancel: 'Cancel',
    // Kind Words
    kindWords: 'Kind Words',
    kindWordsDesc: 'Add and manage testimonials shown in the home page ‘Kind Words’ section.',
    addTestimonial: '+ Add New Review',
    editTestimonial: 'Edit Review',
    namesEn: 'Names (English)',
    namesAr: 'Names (Arabic)',
    quoteEn: 'Quote / Review (English)',
    quoteAr: 'Quote / Review (Arabic)',
    locationEn: 'Occasion / Location (English)',
    locationAr: 'Occasion / Location (Arabic)',
    saveTestimonial: 'Save',
    deleteTestimonial: 'Delete',
    noTestimonials: 'No reviews yet. Add your first one above.',
  },
  ar: {
    bookings: 'الحجوزات',
    availability: 'التوفر',
    packages: 'إدارة الباقات',
    portfolio: 'الأعمال',
    totalBookings: 'إجمالي الحجوزات',
    pendingApproval: 'قيد الانتظار',
    baghdad: 'بغداد',
    erbil: 'أربيل',
    all: 'الكل',
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد مبدئياً',
    approved: 'مؤكد نهائياً',
    bookedOn: 'تم الحجز في',
    fullDay: 'يوم كامل',
    session: 'جلسة',
    customer: 'الزبون',
    phone: 'الهاتف',
    email: 'البريد الإلكتروني',
    cityPackage: 'المدينة والباقة',
    locationId: 'رمز الموقع',
    targetDate: 'التاريخ المحدد',
    notes: 'الملاحظات',
    sendWelcome: '💬 إرسال الترحيب والعربون',
    welcomeSent: '✓ تم إرسال الترحيب والعربون',
    sendFinal: '💬 إرسال التأكيد النهائي',
    bookingApproved: '✓ تم تأكيد الحجز',
    deleteRecord: 'حذف السجل',
    noBookings: 'لا توجد حجوزات تطابق التصفية',
    // Upcoming Bookings
    upcomingTitle: 'الحجوزات القادمة (خلال 3 أيام)',
    upcomingDesc: 'الحجوزات المجدولة لليوم وغداً واليوم التالي.',
    viewDetails: 'عرض التفاصيل',
    // Availability
    dateBlocking: 'حظر التواريخ',
    dateBlockingDesc: 'اضغط على التواريخ في التقويم لتبديل حالة الحظر للحجوزات.',
    availabilityWorkflowNote: 'تصل الحجوزات بشكل طبيعي، وتقوم بمراجعة الطلبات يدوياً واتخاذ قرار إغلاق اليوم أو تحديده كمكتمل.',
    blockedDatesList: 'قائمة التواريخ المحظورة',
    noBlockedDates: 'لا توجد تواريخ محظورة. اضغط على التواريخ في التقويم لحظرها.',
    unblock: 'إلغاء الحظر',
    locationsManagement: 'إدارة المواقع',
    locationsManagementDesc: 'إدارة المواقع المتاحة لكل من بغداد وأربيل بشكل منفصل.',
    addLocationTo: 'إضافة موقع إلى',
    addLocationOption: 'إضافة خيار موقع',
    nameEn: 'الاسم بالإنجليزية',
    nameAr: 'الاسم بالعربية',
    descEn: 'الوصف بالإنجليزية',
    descAr: 'الوصف بالعربية',
    remove: 'حذف',
    // Packages Management
    packagesManagement: 'إدارة الباقات',
    packagesManagementDesc: 'إدارة الأسعار والمميزات وظهور الباقات مباشرة في Supabase لكل مدينة وخدمة.',
    sessionsService: 'الجلسات',
    fullDayService: 'اليوم الكامل',
    addPackage: '+ إضافة باقة جديدة',
    savePackage: 'حفظ الباقة',
    packageSaved: '✓ تم حفظ الباقة في Supabase',
    packageDeleted: 'تم حذف الباقة',
    packageKey: 'رمز الباقة (مثلاً essential)',
    priceUsd: 'السعر بالدولار ($)',
    badgeOptional: 'شارة مميزة (مثلاً الأكثر طلباً)',
    accentColorOptional: 'لون التمييز (مثلاً #12372a)',
    imageUrlOptional: 'رابط الصورة (اختياري)',
    visibleOnSite: 'ظاهرة على الموقع',
    hiddenFromSite: 'مخفية من الموقع',
    featureSections: 'أقسام المميزات والتسليمات',
    addSection: '+ إضافة قسم',
    sectionTitle: 'عنوان القسم (مثلاً الألبوم، الفيديو)',
    featuresPlaceholder: 'المميزات (عنصر واحد في كل سطر)',
    moveUp: '↑ لأعلى',
    moveDown: '↓ لأسفل',
    // Portfolio
    portfolioCategories: 'تصنيفات الأعمال',
    portfolioCategoriesDesc: 'أضف أقساماً جديدة إلى معرض أعمالك.',
    catCode: 'رمز التصنيف (مثلاً weddings)',
    catNameEn: 'اسم التصنيف بالإنجليزية',
    catNameAr: 'اسم التصنيف بالعربية',
    createCat: 'إنشاء تصنيف',
    uploadImages: 'رفع صور الأعمال',
    uploadDesc: 'اختر صورة واحدة أو أكثر. تحويل تلقائي إلى WebP محسن.',
    emptyCat: 'لا توجد صور في هذا التصنيف بعد. ارفع بعض الصور أعلاه لعرضها.',
    deleteCat: 'حذف التصنيف',
    rename: 'إعادة تسمية',
    save: 'حفظ',
    cancel: 'إلغاء',
    // Kind Words
    kindWords: 'الكلمات الطيبة',
    kindWordsDesc: 'أضف وأدر التقييمات التي تظهر في قسم “كلمات صادقة” على الصفحة الرئيسية.',
    addTestimonial: '+ إضافة تقييم جديد',
    editTestimonial: 'تعديل التقييم',
    namesEn: 'الأسماء (بالإنجليزية)',
    namesAr: 'الأسماء (بالعربية)',
    quoteEn: 'التقييم (بالإنجليزية)',
    quoteAr: 'التقييم (بالعربية)',
    locationEn: 'المناسبة / الموقع (بالإنجليزية)',
    locationAr: 'المناسبة / الموقع (بالعربية)',
    saveTestimonial: 'حفظ',
    deleteTestimonial: 'حذف',
    noTestimonials: 'لا توجد تقييمات بعد. أضف أول تقييم أعلاه.',
  },
}

// ─── WhatsApp Integration & Booking Price Helpers ───────────────────────────
const PACKAGE_NAMES: Record<string, string> = {
  essential: 'Essential Collection',
  signature: 'Signature Collection',
  premium: 'Premium Collection',
  vip: 'VIP Collection',
  royal: 'Royal Collection',
}

function getBookingPrice(type: 'session' | 'full-day', packageId: string, city: string): string {
  const isErbil = city === 'erbil'
  if (type === 'full-day') {
    const base = packageId === 'royal' ? 3200 : 1800
    const finalPrice = isErbil ? base + 300 : base
    return `$${finalPrice.toLocaleString()}`
  } else {
    // Session
    let base = 250
    if (packageId === 'signature') base = 400
    if (packageId === 'premium') base = 600
    const finalPrice = isErbil ? base + 200 : base
    return `$${finalPrice.toLocaleString()}`
  }
}

function formatWhatsAppPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '')
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2)
  }
  if (cleaned.startsWith('0')) {
    cleaned = '964' + cleaned.substring(1)
  }
  if (!cleaned.startsWith('964') && cleaned.length === 10 && cleaned.startsWith('7')) {
    cleaned = '964' + cleaned
  }
  return cleaned
}

function getWelcomeWhatsAppLink(b: Booking): string {
  const cleanPhone = formatWhatsAppPhone(b.customerInfo.phone)
  const pkgName = PACKAGE_NAMES[b.packageId] ?? b.packageId
  const price = getBookingPrice(b.type, b.packageId, b.city)

  const messageText = `✨ *Welcome to Grooms Art Studio / أهلاً بكِ في استوديو Grooms Art* 🌿\n\n` +
    `We are thrilled to confirm your booking details:\n` +
    `يسعدنا جداً تأكيد تفاصيل حجزكِ معنا:\n\n` +
    `• *Name / الاسم:* ${b.customerInfo.fullName}\n` +
    `• *Date / التاريخ:* ${b.date}\n` +
    `• *Package / الباقة:* ${pkgName}\n` +
    `• *Price / السعر:* ${price}\n\n` +
    `To finalize your booking and secure the date, please transfer the deposit to the following card:\n` +
    `لتأكيد الحجز وتثبيت التاريخ بشكل رسمي، يرجى تحويل مبلغ العربون إلى الحساب التالي:\n` +
    `💳 *Card Number / رقم الكارت:* [CARD_NUMBER_HERE]\n\n` +
    `Please reply with a screenshot of the transfer once completed. 🤍\n` +
    `يرجى إرسال لقطة شاشة للتحويل هنا فور إتمامه.`

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`
}

function getFinalConfirmationWhatsAppLink(b: Booking): string {
  const cleanPhone = formatWhatsAppPhone(b.customerInfo.phone)
  
  const messageText = `✨ *Grooms Art Studio — Booking Confirmed* 🌿\n\n` +
    `We have successfully received your deposit transfer. Your booking is now *fully confirmed* and your date is officially reserved! 🎉\n` +
    `تم استلام مبلغ العربون بنجاح. حجزكِ الآن *مؤكد بالكامل* وتم تثبيت تاريخكِ رسمياً! 🎉\n\n` +
    `We look forward to capturing your beautiful moments. See you soon! 🤍\n` +
    `نتطلع بشوق لتوثيق لحظاتكم الجميلة. نراكم قريباً!`

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`
}

function getReminderWhatsAppLink(b: Booking): string {
  const cleanPhone = formatWhatsAppPhone(b.customerInfo.phone)
  const pkgName = PACKAGE_NAMES[b.packageId] ?? b.packageId
  const messageText =
    ` Grooms Art Studio\n` +
    ` Session Reminder / تذكير بالجلسة\n\n` +
    `Hi ${b.customerInfo.fullName}!\n` +
    `مرحباً ${b.customerInfo.fullName}!\n\n` +
    `Your session is coming up on ${b.date}.\n` +
    `جلستكم  بتاريخ ${b.date}.\n\n` +
    `Package / الباقة: ${pkgName}\n\n` +
    `We can't wait to capture your moments!`

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const { locale, toggleLocale } = useI18n()
  const d = locale === 'ar' ? DASHBOARD_T.ar : DASHBOARD_T.en
  const [activeTab, setActiveTab] = useState<DashboardTab>('bookings')

  // ─── State for Bookings ───
  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed' | 'approved'>('all')
  // Track which booking IDs have had reminders sent (persisted in localStorage)
  const [sentReminders, setSentReminders] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('ga_sent_reminders')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })

  const markReminderSent = (bookingId: string) => {
    setSentReminders((prev) => {
      const next = new Set(prev)
      next.add(bookingId)
      try { localStorage.setItem('ga_sent_reminders', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const reloadBookings = useCallback(async () => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error
        if (data) {
          const mapped: Booking[] = data.map((row: any) => ({
            id: row.id,
            type: row.type as BookingType,
            status: row.status as BookingStatus,
            city: row.city,
            packageId: row.package_id,
            location: row.location_id || row.location || '',
            date: row.date,
            customerInfo: {
              fullName: row.full_name,
              phone: row.phone,
              email: row.email || '',
              notes: row.notes || '',
            },
            createdAt: row.created_at,
            whatsappTriggered: row.whatsapp_triggered,
          }))
          setBookings(mapped)
          return
        }
      } catch (err) {
        console.error('Failed to load bookings from Supabase, trying fallback:', err)
      }
    }
    // Fallback to localStorage only if Supabase call failed or isn't configured
    setBookings(storage.get<Booking[]>(STORAGE_KEYS.bookings) || [])
  }, [])

  useEffect(() => {
    reloadBookings()
  }, [reloadBookings])

  const updateBookingStatus = async (id: string, newStatus: BookingStatus) => {
    let updatedDb = false
    const currentBooking = bookings.find((b) => b.id === id)
    if (!currentBooking) return

    if (supabase) {
      try {
        // .select() forces PostgREST to return the updated row(s) so we can tell
        // a genuine write from an RLS policy silently matching zero rows (which
        // otherwise "succeeds" with no error but never persists the change).
        const { data, error } = await supabase
          .from('bookings')
          .update({
            status: newStatus,
            whatsapp_triggered: newStatus === 'confirmed' ? true : currentBooking.whatsappTriggered
          })
          .eq('id', id)
          .select('id')
        if (error) throw error
        if (!data || data.length === 0) {
          throw new Error('Update matched no rows (check RLS policy / admin session).')
        }
        updatedDb = true
      } catch (err) {
        console.error('Failed to update booking status in Supabase:', err)
        alert('Could not save the status change to the database. It will not persist after refresh. Please check your admin session and try again.')
        return
      }
    }

    const updated = bookings.map((b) => {
      if (b.id === id) {
        const item = { ...b, status: newStatus }
        if (newStatus === 'confirmed') {
          triggerWhatsApp(item)
          item.whatsappTriggered = true
        }
        return item
      }
      return b
    })

    if (!updatedDb) {
      storage.set(STORAGE_KEYS.bookings, updated)
    }
    setBookings(updated)
  }

  const deleteBooking = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking record?')) return
    let deletedDb = false
    if (supabase) {
      try {
        const { error } = await supabase
          .from('bookings')
          .delete()
          .eq('id', id)
        if (error) throw error
        deletedDb = true
      } catch (err) {
        console.error('Failed to delete booking from Supabase:', err)
      }
    }

    const updated = bookings.filter((b) => b.id !== id)
    if (!deletedDb) {
      storage.set(STORAGE_KEYS.bookings, updated)
    }
    setBookings(updated)
  }

  const handleWelcomeSend = async (b: Booking) => {
    window.open(getWelcomeWhatsAppLink(b), '_blank')
    await updateBookingStatus(b.id, 'confirmed')
  }

  const handleFinalSend = async (b: Booking) => {
    window.open(getFinalConfirmationWhatsAppLink(b), '_blank')
    await updateBookingStatus(b.id, 'approved')
  }

  // ─── Upcoming Bookings (3-day rolling window: Today, Tomorrow, Day After Tomorrow) ───
  const upcomingBookings = useMemo(() => {
    const todayD = new Date()
    todayD.setHours(0, 0, 0, 0)
    const toIso = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const t1 = new Date(todayD)
    t1.setDate(t1.getDate() + 1)
    const t2 = new Date(todayD)
    t2.setDate(t2.getDate() + 2)

    const validDates = new Set([toIso(todayD), toIso(t1), toIso(t2)])
    return bookings
      .filter((b) => validDates.has(b.date))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [bookings])

  // ─── State for Packages Management ───
  const [packagesList, setPackagesList] = useState<Package[]>([])
  const [pkgCity, setPkgCity] = useState<'baghdad' | 'erbil'>('baghdad')
  const [pkgService, setPkgService] = useState<'sessions' | 'full-day'>('sessions')
  const [pkgLoading, setPkgLoading] = useState(false)
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null)
  const [editPkgForm, setEditPkgForm] = useState<Package | null>(null)
  const [pkgSaveMessage, setPkgSaveMessage] = useState<string | null>(null)
  const [activeEditingPkg, setActiveEditingPkg] = useState<string | null>(null) // id open in modal

  const reloadPackages = useCallback(async () => {
    setPkgLoading(true)
    const data = await loadAllPackages()
    setPackagesList(data)
    setPkgLoading(false)
  }, [])

  useEffect(() => {
    reloadPackages()
  }, [reloadPackages])

  const handleSavePackage = async (pkgToSave: Package) => {
    const { error } = await upsertPackage(pkgToSave)
    if (error) {
      alert('Failed to save package: ' + (error.message || error))
    } else {
      setPkgSaveMessage(pkgToSave.id)
      setTimeout(() => setPkgSaveMessage(null), 3000)
      setEditingPkgId(null)
      setEditPkgForm(null)
      reloadPackages()
    }
  }

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return
    const { error } = await deletePackage(id)
    if (error) {
      alert('Failed to delete package: ' + (error.message || error))
    } else {
      reloadPackages()
    }
  }

  const handleMoveOrder = async (pkg: Package, direction: 'up' | 'down') => {
    const currentList = packagesList
      .filter((p) => p.city === pkg.city && p.service === pkg.service)
      .sort((a, b) => a.sort_order - b.sort_order)
    
    const index = currentList.findIndex((p) => p.id === pkg.id)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === currentList.length - 1) return

    const swapIndex = direction === 'up' ? index - 1 : index + 1
    const target = currentList[swapIndex]

    const updates = [
      { id: pkg.id, sort_order: target.sort_order },
      { id: target.id, sort_order: pkg.sort_order },
    ]

    await reorderPackages(updates)
    reloadPackages()
  }

  const handleCreateNewPackage = () => {
    const cityPkgs = packagesList.filter((p) => p.city === pkgCity && p.service === pkgService)
    const newPkg: Package = {
      id: `pkg-${Date.now()}`,
      city: pkgCity,
      service: pkgService,
      package_key: `custom-${Date.now().toString().slice(-4)}`,
      name: 'New Collection',
      name_ar: 'مجموعة جديدة',
      price: pkgService === 'full-day' ? 1200 : 350,
      features: [
        {
          title: 'Album',
          title_ar: 'الألبوم',
          items: ['30×60 cm', '5 Pages'],
          items_ar: ['قياس 30×60 سم', '5 صفحات'],
        },
        {
          title: 'Includes',
          title_ar: 'يشمل أيضاً',
          items: ['Wall Frame', 'Table Frame'],
          items_ar: ['إطار جداري فاخر', 'إطار للمكتب'],
        },
      ],
      description: 'Exclusive coverage by Grooms Art.',
      description_ar: 'تغطية حصرية مميزة من استوديو Grooms Art.',
      sort_order: cityPkgs.length,
      active: true,
      badge: 'New',
      badge_ar: 'جديد',
      accent_color: '#12372a',
      image_url: '',
    }
    setEditPkgForm(newPkg)
    setEditingPkgId(newPkg.id)
  }

  // ─── State for Availability ───
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [fullyBookedDates, setFullyBookedDates] = useState<string[]>([])
  const [newBlockedDate, setNewBlockedDate] = useState('')
  const [selectedCity, setSelectedCity] = useState<CityId>('baghdad')
  const [locationsMap, setLocationsMap] = useState<Record<CityId, Location[]>>(DEFAULT_LOCATIONS)
  const [newLocName, setNewLocName] = useState('')
  const [newLocNameAr, setNewLocNameAr] = useState('')
  const [newLocDesc, setNewLocDesc] = useState('')
  const [newLocDescAr, setNewLocDescAr] = useState('')

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [availCursor, setAvailCursor] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }))

  const toLocalISODate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  };

  const availCells = useMemo(() => {
    const firstDay = new Date(availCursor.year, availCursor.month, 1).getDay()
    const daysInMonth = new Date(availCursor.year, availCursor.month + 1, 0).getDate()
    const grid: { iso: string | null; day: number | null; isToday: boolean; isBlocked: boolean; isPast: boolean }[] = []

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) {
      grid.push({ iso: null, day: null, isToday: false, isBlocked: false, isPast: false })
    }

    // Day cells
    const todayIso = toLocalISODate(today)
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(availCursor.year, availCursor.month, d)
      const iso = toLocalISODate(date)
      const isBlocked = blockedDates.includes(iso) || fullyBookedDates.includes(iso)
      const isToday = iso === todayIso
      const isPast = iso < todayIso
      grid.push({ iso, day: d, isToday, isBlocked, isPast })
    }

    // Trailing cells
    while (grid.length % 7 !== 0) {
      grid.push({ iso: null, day: null, isToday: false, isBlocked: false, isPast: false })
    }

    return grid
  }, [availCursor, blockedDates, fullyBookedDates, today])

  const reloadAvailability = useCallback(() => {
    setBlockedDates(storage.get<string[]>(STORAGE_KEYS.blockedDates) || [])
    setFullyBookedDates(storage.get<string[]>('ga_fully_booked_dates') || [])
    const storedLocs = storage.get<Record<CityId, Location[]>>(STORAGE_KEYS.locations)
    if (storedLocs) {
      setLocationsMap(storedLocs)
    } else {
      setLocationsMap(DEFAULT_LOCATIONS)
    }
  }, [])

  useEffect(() => {
    reloadAvailability()
  }, [reloadAvailability])

  const blockDate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBlockedDate) return
    if (blockedDates.includes(newBlockedDate) || fullyBookedDates.includes(newBlockedDate)) {
      alert('This date is already blocked or fully booked.')
      return
    }
    const updated = [...blockedDates, newBlockedDate].sort()
    storage.set(STORAGE_KEYS.blockedDates, updated)
    setBlockedDates(updated)
    setNewBlockedDate('')
  }

  const unblockDate = (dateStr: string) => {
    const updated = blockedDates.filter((d) => d !== dateStr)
    storage.set(STORAGE_KEYS.blockedDates, updated)
    setBlockedDates(updated)
    const updatedFully = fullyBookedDates.filter((d) => d !== dateStr)
    storage.set('ga_fully_booked_dates', updatedFully)
    setFullyBookedDates(updatedFully)
  }

  const toggleBlockDate = (dateStr: string) => {
    let updated: string[]
    if (blockedDates.includes(dateStr) || fullyBookedDates.includes(dateStr)) {
      updated = blockedDates.filter((d) => d !== dateStr)
      const updatedFully = fullyBookedDates.filter((d) => d !== dateStr)
      storage.set('ga_fully_booked_dates', updatedFully)
      setFullyBookedDates(updatedFully)
    } else {
      updated = [...blockedDates, dateStr].sort()
    }
    storage.set(STORAGE_KEYS.blockedDates, updated)
    setBlockedDates(updated)
  }

  const toggleFullyBooked = (dateStr: string) => {
    let updated: string[]
    if (fullyBookedDates.includes(dateStr)) {
      updated = fullyBookedDates.filter((d) => d !== dateStr)
      // If removed from fully booked, make sure it is back in blockedDates
      if (!blockedDates.includes(dateStr)) {
        const newBlocked = [...blockedDates, dateStr].sort()
        storage.set(STORAGE_KEYS.blockedDates, newBlocked)
        setBlockedDates(newBlocked)
      }
    } else {
      updated = [...fullyBookedDates, dateStr].sort()
      // If added to fully booked, also make sure it is in blockedDates for easy logic
      if (!blockedDates.includes(dateStr)) {
        const newBlocked = [...blockedDates, dateStr].sort()
        storage.set(STORAGE_KEYS.blockedDates, newBlocked)
        setBlockedDates(newBlocked)
      }
    }
    storage.set('ga_fully_booked_dates', updated)
    setFullyBookedDates(updated)
  }

  const addLocation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLocName.trim() || !newLocNameAr.trim()) return

    const newLoc: Location = {
      id: `loc-${Date.now()}`,
      name: newLocName.trim(),
      nameAr: newLocNameAr.trim(),
      description: newLocDesc.trim(),
      descriptionAr: newLocDescAr.trim(),
    }

    const currentCityLocs = locationsMap[selectedCity] || []
    const updatedCityLocs = [...currentCityLocs, newLoc]
    const updatedMap = { ...locationsMap, [selectedCity]: updatedCityLocs }

    storage.set(STORAGE_KEYS.locations, updatedMap)
    setLocationsMap(updatedMap)

    // Reset fields
    setNewLocName('')
    setNewLocNameAr('')
    setNewLocDesc('')
    setNewLocDescAr('')
  }

  const deleteLocation = (locId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return
    const currentCityLocs = locationsMap[selectedCity] || []
    const updatedCityLocs = currentCityLocs.filter((l) => l.id !== locId)
    const updatedMap = { ...locationsMap, [selectedCity]: updatedCityLocs }

    storage.set(STORAGE_KEYS.locations, updatedMap)
    setLocationsMap(updatedMap)
  }

  // ─── State for Portfolio ───
  const [categories, setCategories] = useState<CategoryInfo[]>([])
  const [portfolioImgs, setPortfolioImgs] = useState<PortfolioImage[]>([])
  const [newCatId, setNewCatId] = useState('')
  const [newCatName, setNewCatName] = useState('')
  const [newCatNameAr, setNewCatNameAr] = useState('')
  const [renamingCatId, setRenamingCatId] = useState<string | null>(null)
  const [renameNameEn, setRenameNameEn] = useState('')
  const [renameNameAr, setRenameNameAr] = useState('')
  const [uploading, setUploading] = useState(false)
  const [storageUsedBytes, setStorageUsedBytes] = useState(0)
  const [storageToastVisible, setStorageToastVisible] = useState(false)
  const storageToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [activeCatModal, setActiveCatModal] = useState<string | null>(null) // category id open in modal

  // ─── State for Kind Words ───
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
  const [savingTestimonial, setSavingTestimonial] = useState(false)
  const BLANK_TESTIMONIAL: Omit<Testimonial, 'id'> = { names: '', namesAr: '', quote: '', quoteAr: '', location: '', locationAr: '', order: 0 }
  const [testimonialForm, setTestimonialForm] = useState<Omit<Testimonial, 'id'>>(BLANK_TESTIMONIAL)

  const reloadTestimonials = useCallback(() => {
    getTestimonials().then(setTestimonials)
  }, [])

  const handleSaveTestimonial = async () => {
    if (!testimonialForm.names.trim() || !testimonialForm.quote.trim()) return
    setSavingTestimonial(true)
    try {
      const id = editingTestimonial?.id ?? `t-${Date.now()}`
      const order = editingTestimonial?.order ?? testimonials.length
      await saveTestimonial({ id, ...testimonialForm, order })
      await reloadTestimonials()
      setEditingTestimonial(null)
      setTestimonialForm(BLANK_TESTIMONIAL)
    } finally {
      setSavingTestimonial(false)
    }
  }

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm(locale === 'ar' ? 'هل تريد حذف هذا التقييم؟' : 'Delete this review?')) return
    await deleteTestimonial(id)
    reloadTestimonials()
  }


  const reloadPortfolio = useCallback(() => {
    getPortfolioCategories().then(setCategories)
    preloadIdbImages().then(async () => {
      setPortfolioImgs(await getPortfolioImages())
    })
    getStorageUsedBytes().then(setStorageUsedBytes)
  }, [])

  useEffect(() => {
    reloadPortfolio()
  }, [reloadPortfolio])

  // ── Show storage Toast when portfolio tab is opened ──────────────────
  useEffect(() => {
    if (activeTab !== 'portfolio') return
    // Small delay so the tab transition finishes first
    const show = setTimeout(() => {
      setStorageToastVisible(true)
      // Auto-dismiss after 5 s
      storageToastTimerRef.current = setTimeout(() => {
        setStorageToastVisible(false)
      }, 5000)
    }, 400)
    return () => {
      clearTimeout(show)
      if (storageToastTimerRef.current) clearTimeout(storageToastTimerRef.current)
    }
  }, [activeTab])

  // Load testimonials when Kind Words tab is opened
  useEffect(() => {
    if (activeTab === 'kindWords') reloadTestimonials()
  }, [activeTab, reloadTestimonials])

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    const id = newCatId.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
    if (!id || !newCatName.trim()) return

    if (categories.some((c) => c.id === id)) {
      alert('Category ID already exists.')
      return
    }

    const newCat: CategoryInfo = {
      id,
      name: newCatName.trim(),
      nameAr: newCatNameAr.trim() || newCatName.trim(),
    }

    const updated = [...categories, newCat]
    await savePortfolioCategories(updated)
    setCategories(updated)

    setNewCatId('')
    setNewCatName('')
    setNewCatNameAr('')
  }

  const renameCategory = async (id: string) => {
    if (!renameNameEn.trim()) return
    const updated = categories.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          name: renameNameEn.trim(),
          nameAr: renameNameAr.trim() || renameNameEn.trim(),
        }
      }
      return c
    })
    await savePortfolioCategories(updated)
    setCategories(updated)
    setRenamingCatId(null)
  }

  const deleteCategory = async (catId: string) => {
    // Check if there are any images in this category
    const hasImages = portfolioImgs.some((img) => img.category === catId)
    if (hasImages) {
      alert('This category contains images. You cannot delete it until all its images are removed.')
      return
    }

    if (!confirm('Are you sure you want to delete this category?')) return
    await apiDeletePortfolioCategory(catId)
    setCategories(await getPortfolioCategories())
  }

  const deletePortfolioImage = async (imgId: string) => {
    if (!confirm('Are you sure you want to remove this image?')) return
    await apiDeletePortfolioImage(imgId)
    setPortfolioImgs(await getPortfolioImages())
  }

  const [editingImage, setEditingImage] = useState<PortfolioImage | null>(null)
  const [editImageTitle, setEditImageTitle] = useState('')
  const [savingImageTitle, setSavingImageTitle] = useState(false)

  const handleStartEditImage = (img: PortfolioImage) => {
    setEditingImage(img)
    setEditImageTitle(img.title || '')
  }

  const handleSaveImageTitle = async () => {
    if (!editingImage || !editImageTitle.trim()) return
    setSavingImageTitle(true)
    try {
      const newTitle = editImageTitle.trim()
      const newSlug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      await apiUpdatePortfolioImage(editingImage.id, {
        title: newTitle,
        slug: newSlug || editingImage.slug,
        alt: `${newTitle} - portfolio`,
      })
      setPortfolioImgs(await getPortfolioImages())
      setEditingImage(null)
    } catch (err) {
      console.error(err)
      alert(locale === 'ar' ? 'فشل حفظ الاسم الجديد' : 'Failed to update image name')
    } finally {
      setSavingImageTitle(false)
    }
  }

  const handleImageUpload = async (catId: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      // ── Storage Limit Check (9 GB) ────────────────────────────────
      const usedBytes = await getStorageUsedBytes()

      // Calculate total size of files being uploaded now
      let pendingBytes = 0
      for (let i = 0; i < files.length; i++) pendingBytes += files[i].size

      if (usedBytes + pendingBytes > STORAGE_LIMIT_BYTES) {
        const usedGB = (usedBytes / (1024 ** 3)).toFixed(2)
        const pendingMB = (pendingBytes / (1024 ** 2)).toFixed(1)
        alert(
          `⛔ تجاوزت حد التخزين (9 GB)\n` +
          `المستخدم حالياً: ${usedGB} GB\n` +
          `الملفات المحددة: ${pendingMB} MB\n\n` +
          `يرجى حذف بعض الصور القديمة أولاً.`
        )
        return
      }
      // ─────────────────────────────────────────────────────────────

      const customImgs = await getPortfolioImages()
      const newItems: PortfolioImage[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // 1. Optimize file to a WebP DataURL locally
        const dataUrl = await optimizeToWebP(file)
        
        // 2. Convert DataURL to Blob
        const blobRes = await fetch(dataUrl)
        const blob = await blobRes.blob()

        // 3. Setup metadata
        const id = `img-${crypto.randomUUID()}`
        const title = file.name.replace(/\.[^/.]+$/, '') // file name without ext
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

        // 4. Request S3 presigned URL from Vercel (server-side function)
        const presigned = await getPresignedUploadUrl({
          data: {
            filename: `${slug}-${id.slice(-6)}.webp`,
            contentType: 'image/webp',
          },
        })

        // 5. Upload directly to Cloudflare R2
        const uploadRes = await fetch(presigned.uploadUrl, {
          method: 'PUT',
          body: blob,
          headers: {
            'Content-Type': 'image/webp',
          },
        })

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload ${file.name} to Cloudflare R2`)
        }

        const newItem: PortfolioImage = {
          id,
          slug,
          title,
          alt: `${title} - portfolio upload`,
          category: catId,
          partOfFullDay: false,
          orientation: 'landscape',
          exif: {
            camera: 'Unknown',
            lens: 'Unknown',
            focalLength: '—',
            aperture: '—',
            shutter: '—',
            iso: '—',
          },
          url: presigned.fileUrl,
          r2Key: presigned.key,
          fileSize: blob.size, // Save actual WebP blob size
        }

        newItems.push(newItem)
      }

      const updated = [...newItems, ...customImgs]
      await savePortfolioImages(updated)
      setPortfolioImgs(await getPortfolioImages())
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Failed to upload images.')
    } finally {
      setUploading(false)
    }
  }

  // Stats Calculations
  const totalBaghdad = bookings.filter((b) => b.city === 'baghdad').length
  const totalErbil = bookings.filter((b) => b.city === 'erbil').length
  const pendingCount = bookings.filter((b) => b.status === 'pending').length

  const filteredBookings = useMemo(() => {
    if (bookingFilter === 'all') return bookings
    return bookings.filter((b) => b.status === bookingFilter)
  }, [bookings, bookingFilter])

  return (
    <div className="min-h-screen bg-[#F7F5F0]" dir="ltr">
      {/* Header bar */}
      <header className="fixed inset-x-0 top-0 z-50 p-4 md:p-6 flex justify-center pointer-events-none">
        <div className="w-full max-w-6xl flex items-center justify-between px-6 md:px-10 py-3.5 rounded-full bg-white/85 backdrop-blur-md border border-charcoal/10 shadow-[0_4px_20px_rgba(0,0,0,0.04)] pointer-events-auto">
          <Link to="/" className="block py-0.5 transition-opacity duration-300 hover:opacity-85">
            <img
              src="/images/logo.png"
              alt="Grooms Art Logo"
              className="h-8 md:h-9 w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={toggleLocale}
              className="font-sans text-xs tracking-[0.2em] uppercase text-charcoal font-semibold hover:text-forest transition-colors duration-300"
              aria-label="Toggle language"
            >
              {locale === 'en' ? 'AR' : 'EN'}
            </button>
            <Link
              to="/"
              className="font-sans text-xs tracking-[0.2em] uppercase text-charcoal font-semibold hover:text-forest transition-colors duration-300"
            >
              Home
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="font-sans text-xs tracking-[0.2em] uppercase text-charcoal font-semibold hover:text-red-600 transition-colors duration-300"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-10 pt-28 pb-16">
        {/* Navigation Tabs */}
        <div className="flex gap-1.5 mb-8 bg-white rounded-2xl p-1.5 border border-charcoal/15 w-fit shadow-xs overflow-x-auto max-w-full">
          {(['bookings', 'availability', 'packages', 'portfolio', 'kindWords'] as DashboardTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              className={clsx(
                'font-sans text-xs tracking-[0.15em] uppercase px-4 py-2.5 rounded-xl transition-all duration-300 whitespace-nowrap font-medium min-h-[40px]',
                activeTab === t
                  ? 'bg-forest text-cream shadow-sm font-semibold'
                  : 'text-charcoal/70 hover:text-charcoal hover:bg-charcoal/04',
              )}
            >
              {t === 'bookings'
                ? `${d.bookings} (${pendingCount} ${d.pending.toLowerCase()})`
                : t === 'availability'
                  ? d.availability
                  : t === 'packages'
                    ? d.packages
                    : t === 'portfolio'
                      ? d.portfolio
                      : d.kindWords}
            </button>
          ))}
        </div>

        {/* ─── TAB: BOOKINGS ─── */}
        {activeTab === 'bookings' && (
          <div>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 mb-8">
              <StatCard label={d.totalBookings} value={bookings.length} accent />
              <StatCard label={d.pendingApproval} value={pendingCount} />
              <StatCard label={d.baghdad} value={totalBaghdad} sub={d.bookings.toLowerCase()} />
              <StatCard label={d.erbil} value={totalErbil} sub={d.bookings.toLowerCase()} />
            </div>

            {/* Task 9: Upcoming Bookings (3-Day Rolling Window) */}
            {upcomingBookings.length > 0 && (
              <div className="mb-8 bg-white border border-charcoal/15 rounded-3xl p-6 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-forest animate-ping" />
                    <h3 className="font-serif text-2xl text-charcoal font-medium">
                      {d.upcomingTitle}
                    </h3>
                  </div>
                  <span className="font-sans text-[10px] tracking-wider uppercase bg-forest/10 text-forest font-bold px-3 py-1 rounded-full border border-forest/20">
                    {upcomingBookings.length} {locale === 'ar' ? 'حجوزات قريبة' : 'Upcoming'}
                  </span>
                </div>
                <p className="font-sans text-xs text-charcoal/65 mb-6">
                  {d.upcomingDesc}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {upcomingBookings.map((ub) => (
                    <div
                      key={ub.id}
                      className="border border-charcoal/15 bg-[#FAF9F5] rounded-2xl p-5 flex flex-col justify-between gap-3.5 hover:bg-white hover:border-forest/40 hover:shadow-md transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span className="font-sans text-[9px] tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-forest/10 text-forest font-semibold border border-forest/15">
                            {ub.type === 'full-day' ? d.fullDay : d.session}
                          </span>
                          <span className="font-sans text-xs text-forest font-bold">
                            {ub.date}
                          </span>
                        </div>
                        <p className="font-serif text-lg text-charcoal font-medium">{ub.customerInfo.fullName}</p>
                        <p className="font-sans text-xs text-charcoal/65 capitalize mt-0.5 font-medium">
                          {d[ub.city as keyof typeof d] || ub.city} · {ub.packageId ? (PACKAGE_NAMES[ub.packageId] ?? ub.packageId) : '—'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-charcoal/10 flex items-center justify-between gap-2 flex-wrap">
                        <a href={`tel:${ub.customerInfo.phone}`} className="font-sans text-xs text-forest font-semibold hover:underline">
                          {ub.customerInfo.phone}
                        </a>
                        <div className="flex items-center gap-2">
                          <span className={clsx(
                            'font-sans text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-md font-semibold',
                            ub.status === 'pending' && 'bg-amber-100 text-amber-900 border border-amber-200',
                            ub.status === 'confirmed' && 'bg-blue-100 text-blue-900 border border-blue-200',
                            ub.status === 'approved' && 'bg-emerald-100 text-emerald-900 border border-emerald-200',
                          )}>
                            {d[ub.status as keyof typeof d] || ub.status}
                          </span>
                          {sentReminders.has(ub.id) ? (
                            <span
                              title={locale === 'ar' ? 'تم إرسال التذكير' : 'Reminder already sent'}
                              className="inline-flex items-center gap-1 font-sans text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-md font-semibold bg-charcoal/08 text-charcoal/40 border border-charcoal/12 cursor-default select-none"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              {locale === 'ar' ? 'أُرسل' : 'Sent'}
                            </span>
                          ) : (
                            <a
                              href={getReminderWhatsAppLink(ub)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={locale === 'ar' ? 'إرسال تذكير عبر واتساب' : 'Send Reminder via WhatsApp'}
                              onClick={() => markReminderSent(ub.id)}
                              className="inline-flex items-center gap-1 font-sans text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-md font-semibold bg-green-100 text-green-800 border border-green-200 hover:bg-green-200 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.524 5.847L0 24l6.302-1.498A11.924 11.924 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.791 9.791 0 01-5.001-1.368l-.36-.213-3.733.887.937-3.619-.234-.373A9.77 9.77 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                              </svg>
                              {locale === 'ar' ? 'تذكير' : 'Remind'}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {['all', 'pending', 'confirmed', 'approved'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setBookingFilter(f as any)}
                  className={clsx(
                    'font-sans text-[11px] tracking-[0.15em] uppercase px-4 py-2 rounded-xl border transition-all font-semibold shadow-2xs min-h-[38px]',
                    bookingFilter === f
                      ? 'bg-forest text-cream border-forest shadow-xs'
                      : 'bg-white text-charcoal/70 border-charcoal/15 hover:border-charcoal/30 hover:text-charcoal',
                  )}
                >
                  {d[f as keyof typeof d] || f}
                </button>
              ))}
            </div>

            {/* Bookings List */}
            {filteredBookings.length === 0 ? (
              <div className="bg-white border border-charcoal/10 rounded-2xl p-12 text-center">
                <p className="font-serif text-xl text-charcoal/40">{d.noBookings}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((b) => (
                  <div
                     key={b.id}
                     className="bg-white border border-charcoal/15 rounded-3xl p-6 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-start justify-between gap-6"
                  >
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className={clsx(
                            'font-sans text-[10px] tracking-[0.15em] uppercase px-3 py-1 rounded-md font-semibold border',
                            b.type === 'full-day'
                              ? 'bg-forest/10 text-forest border-forest/20'
                              : 'bg-forest/05 text-forest border-forest/15',
                          )}
                        >
                          {b.type === 'full-day' ? d.fullDay : d.session}
                        </span>
                        <span
                          className={clsx(
                            'font-sans text-[10px] tracking-[0.15em] uppercase px-3 py-1 rounded-md font-semibold border',
                            b.status === 'pending' && 'bg-amber-100 text-amber-900 border-amber-200',
                            b.status === 'confirmed' && 'bg-blue-100 text-blue-900 border-blue-200',
                            b.status === 'approved' && 'bg-emerald-100 text-emerald-900 border-emerald-200',
                          )}
                        >
                          {d[b.status as keyof typeof d] || b.status}
                        </span>
                        <span className="font-sans text-xs text-charcoal/55 font-medium">
                          {d.bookedOn} {new Date(b.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                        <div>
                          <p className="font-sans text-[10px] tracking-wider text-charcoal/50 uppercase mb-1 font-semibold">
                            {d.customer}
                          </p>
                          <p className="font-serif text-lg text-charcoal font-medium">{b.customerInfo.fullName}</p>
                        </div>
                        <div>
                          <p className="font-sans text-[10px] tracking-wider text-charcoal/50 uppercase mb-1 font-semibold">
                            {d.phone}
                          </p>
                          <a href={`tel:${b.customerInfo.phone}`} className="font-sans text-sm text-forest font-semibold hover:underline">
                            {b.customerInfo.phone}
                          </a>
                        </div>
                        <div>
                          <p className="font-sans text-[10px] tracking-wider text-charcoal/50 uppercase mb-1 font-semibold">
                            {d.email}
                          </p>
                          <p className="font-sans text-sm text-charcoal font-medium">{b.customerInfo.email || '—'}</p>
                        </div>
                        <div>
                          <p className="font-sans text-[10px] tracking-wider text-charcoal/50 uppercase mb-1 font-semibold">
                            {d.cityPackage}
                          </p>
                          <p className="font-sans text-sm text-charcoal capitalize font-medium">
                            {d[b.city as keyof typeof d] || b.city} · {b.packageId ? (locale === 'ar' ? (b.packageId === 'essential' ? 'المجموعة الأساسية' : b.packageId === 'signature' ? 'المجموعة المميزة' : b.packageId === 'premium' ? 'المجموعة الفاخرة' : b.packageId === 'vip' ? 'مجموعة كبار الشخصيات' : 'المجموعة الملكية') : PACKAGE_NAMES[b.packageId] ?? b.packageId) : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="font-sans text-[10px] tracking-wider text-charcoal/50 uppercase mb-1 font-semibold">
                            {d.locationId}
                          </p>
                          <p className="font-sans text-sm text-charcoal font-medium">{b.location}</p>
                        </div>
                        <div>
                          <p className="font-sans text-[10px] tracking-wider text-charcoal/50 uppercase mb-1 font-semibold">
                            {d.targetDate}
                          </p>
                          <p className="font-sans text-sm text-forest font-bold">{b.date}</p>
                        </div>
                      </div>

                      {b.customerInfo.notes && (
                        <div className="pt-3 border-t border-charcoal/10">
                          <p className="font-sans text-[10px] tracking-wider text-charcoal/50 uppercase mb-1.5 font-semibold">
                            {d.notes}
                          </p>
                          <p className="font-sans text-xs text-charcoal bg-linen/50 border border-charcoal/10 p-3.5 rounded-xl leading-relaxed">
                            {b.customerInfo.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 justify-end shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-charcoal/05 w-full md:w-52 animate-fadeIn">
                      <div className="grid grid-cols-2 gap-2 w-full md:flex md:flex-col">
                        {/* Welcome & Deposit Button */}
                        {b.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => handleWelcomeSend(b)}
                            className="w-full font-sans text-[10px] tracking-[0.12em] uppercase bg-red-600 text-cream hover:bg-red-700 px-3 py-2.5 rounded-lg transition-colors font-medium text-center flex items-center justify-center min-h-[38px]"
                          >
                            {d.sendWelcome}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="w-full font-sans text-[10px] tracking-[0.12em] uppercase bg-charcoal/05 text-charcoal/30 px-3 py-2.5 rounded-lg cursor-not-allowed text-center flex items-center justify-center min-h-[38px]"
                          >
                            {d.welcomeSent}
                          </button>
                        )}

                        {/* Send Final Confirm Button */}
                        {b.status === 'pending' && (
                          <button
                            type="button"
                            disabled
                            className="w-full font-sans text-[10px] tracking-[0.12em] uppercase bg-charcoal/05 text-charcoal/30 px-3 py-2.5 rounded-lg cursor-not-allowed text-center flex items-center justify-center min-h-[38px]"
                          >
                            {d.sendFinal}
                          </button>
                        )}
                        {b.status === 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => handleFinalSend(b)}
                            className="w-full font-sans text-[10px] tracking-[0.12em] uppercase bg-forest text-cream hover:bg-forest-deep px-3 py-2.5 rounded-lg transition-colors font-semibold text-center flex items-center justify-center min-h-[38px]"
                          >
                            {d.sendFinal}
                          </button>
                        )}
                        {b.status === 'approved' && (
                          <button
                            type="button"
                            disabled
                            className="w-full font-sans text-[10px] tracking-[0.12em] uppercase bg-yellow-400 text-yellow-950 px-3 py-2.5 rounded-lg cursor-not-allowed font-semibold text-center flex items-center justify-center min-h-[38px]"
                          >
                            {d.bookingApproved}
                          </button>
                        )}
                      </div>

                      {/* Delete Record Button */}
                      <button
                        type="button"
                        onClick={() => deleteBooking(b.id)}
                        className="w-full font-sans text-[10px] tracking-[0.15em] uppercase bg-black text-white hover:bg-charcoal px-3 py-2.5 rounded-lg transition-colors text-center flex items-center justify-center min-h-[38px]"
                      >
                        {d.deleteRecord}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: AVAILABILITY & LOCATIONS ─── */}
        {activeTab === 'availability' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Blocked Dates (completely shadowless) */}
            <div className="bg-white border border-charcoal/10 rounded-2xl p-6 lg:col-span-1 h-fit">
              <SectionHeading
                title={d.dateBlocking}
                desc={d.dateBlockingDesc}
              />

              {/* Premium Dashboard Calendar */}
              <div className="border border-charcoal/10 rounded-2xl overflow-hidden bg-white mb-6">
                {/* Month navigation */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-charcoal/08 bg-sand/10">
                  <button
                    type="button"
                    onClick={() =>
                      setAvailCursor(({ year, month }) =>
                        month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 },
                      )
                    }
                    className="w-7 h-7 rounded-full flex items-center justify-center text-charcoal/60 hover:bg-forest/05 hover:text-forest active:scale-95 transition-all duration-300"
                    aria-label="Previous month"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <AnimatePresence mode="wait">
                    <motion.p
                      key={`${availCursor.year}-${availCursor.month}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="font-serif text-sm text-charcoal font-medium"
                    >
                      {MONTH_FORMATTER.format(new Date(availCursor.year, availCursor.month, 1))}
                    </motion.p>
                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={() =>
                      setAvailCursor(({ year, month }) =>
                        month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 },
                      )
                    }
                    className="w-7 h-7 rounded-full flex items-center justify-center text-charcoal/60 hover:bg-forest/05 hover:text-forest active:scale-95 transition-all duration-300"
                    aria-label="Next month"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                {/* Weekdays */}
                <div className="grid grid-cols-7 px-2 pt-3 pb-1 border-b border-charcoal/03">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dVal, i) => (
                    <div key={i} className="text-center font-sans text-[9px] tracking-wider uppercase text-charcoal/30 font-semibold">
                      {dVal}
                    </div>
                  ))}
                </div>

                {/* Grid */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${availCursor.year}-${availCursor.month}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-7 px-2 py-3 gap-y-1"
                  >
                    {availCells.map((cell, i) => {
                      if (!cell.iso || !cell.day) {
                        return <div key={`empty-${i}`} />
                      }

                      if (cell.isPast) {
                        return (
                          <button
                            key={cell.iso}
                            type="button"
                            disabled
                            className="flex items-center justify-center h-8 w-8 mx-auto font-sans text-xs text-charcoal/20 cursor-not-allowed"
                          >
                            {cell.day}
                          </button>
                        )
                      }

                      const isFullyBooked = fullyBookedDates.includes(cell.iso || '')
                      return (
                        <motion.button
                          key={cell.iso}
                          type="button"
                          whileTap={{ scale: 0.93 }}
                          onClick={() => toggleBlockDate(cell.iso!)}
                          className={clsx(
                            'flex items-center justify-center h-8 w-8 mx-auto rounded-full',
                            'font-sans text-xs transition-all duration-200',
                            isFullyBooked
                              ? 'bg-red-500/10 border border-red-500/30 text-red-700 font-medium'
                              : cell.isBlocked
                                ? 'bg-forest/10 border border-forest/20 text-forest font-medium'
                                : cell.isToday
                                  ? 'border border-forest/30 text-forest hover:bg-forest/05'
                                  : 'text-charcoal hover:bg-forest/05 hover:text-forest',
                          )}
                          title={isFullyBooked ? 'Fully Booked - Click to Unblock' : cell.isBlocked ? 'Blocked - Click to Unblock' : 'Click to Block'}
                        >
                          {cell.day}
                        </motion.button>
                      )
                    })}
                  </motion.div>
                </AnimatePresence>

                {/* Calendar Legend */}
                <div className="flex items-center justify-around px-3 py-2.5 border-t border-charcoal/06 bg-sand/20 text-[10px] font-sans text-charcoal/65">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-forest/20 border border-forest/30 inline-block" />
                    <span>{locale === 'ar' ? 'محظور' : 'Blocked'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40 inline-block" />
                    <span>{locale === 'ar' ? 'مكتمل الحجز' : 'Fully Booked'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-forest/50 inline-block" />
                    <span>{locale === 'ar' ? 'اليوم' : 'Today'}</span>
                  </div>
                </div>
              </div>

              {/* Manual workflow explanation note (Task 8) */}
              <div className="mb-6 bg-forest/[0.03] border border-forest/10 rounded-xl p-3.5 flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full flex items-center justify-center bg-forest/10 text-forest flex-shrink-0 mt-0.5">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M6 8V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    <circle cx="6" cy="4" r="0.6" fill="currentColor" />
                  </svg>
                </div>
                <p className="font-sans text-[11px] text-charcoal/70 leading-relaxed text-left">
                  {d.availabilityWorkflowNote}
                </p>
              </div>

              <div className="border-t border-charcoal/06 pt-4">
                <h4 className="font-serif text-sm text-charcoal mb-2">{d.blockedDatesList}</h4>
                {blockedDates.length === 0 ? (
                  <p className="font-sans text-xs text-charcoal/40 py-4">
                    {d.noBlockedDates}
                  </p>
                ) : (
                  <ul className="divide-y divide-charcoal/06 max-h-52 overflow-y-auto pr-1">
                    {blockedDates.map((date) => {
                      const isFullyBooked = fullyBookedDates.includes(date)
                      return (
                        <li key={date} className="py-2 flex items-center justify-between text-xs gap-4">
                          <span className="font-sans text-charcoal/85 font-medium">{date}</span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => toggleFullyBooked(date)}
                              className={clsx(
                                'font-sans text-[10px] tracking-wider uppercase px-2.5 py-1 rounded transition-colors font-medium',
                                isFullyBooked
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-charcoal/05 text-charcoal/60 hover:bg-charcoal/10'
                              )}
                            >
                              {isFullyBooked ? '🔴 Fully Booked' : 'Mark Fully Booked'}
                            </button>
                            <button
                              type="button"
                              onClick={() => unblockDate(date)}
                              className="font-sans text-[10px] tracking-wider uppercase text-charcoal/40 hover:text-red-600 font-semibold"
                            >
                              {locale === 'ar' ? 'فتح اليوم' : 'Reopen'}
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* City Locations Management */}
            <div className="bg-white border border-charcoal/10 rounded-2xl p-6 shadow-sm lg:col-span-2">
              <SectionHeading
                title={d.locationsManagement}
                desc={d.locationsManagementDesc}
              />

              {/* City Toggle */}
              <div className="flex gap-2 mb-6 bg-linen/50 p-1 rounded-xl w-fit">
                {(['baghdad', 'erbil'] as CityId[]).map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedCity(city)}
                    className={clsx(
                      'font-sans text-xs tracking-[0.1em] uppercase px-4 py-2 rounded-lg transition-all',
                      selectedCity === city ? 'bg-forest text-cream' : 'text-charcoal/50',
                    )}
                  >
                    {city === 'baghdad' ? d.baghdad : d.erbil}
                  </button>
                ))}
              </div>

              {/* Add New Location Form */}
              <form onSubmit={addLocation} className="border border-charcoal/08 rounded-xl p-4 bg-linen/20 mb-6 space-y-3">
                <p className="font-sans text-[10px] tracking-wider uppercase text-charcoal/50 font-bold mb-1">
                  {d.addLocationTo} {selectedCity === 'baghdad' ? d.baghdad : d.erbil}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder={d.nameEn}
                    value={newLocName}
                    onChange={(e) => setNewLocName(e.target.value)}
                    className="font-sans text-xs border border-charcoal/15 rounded-lg px-3 py-2 outline-none focus:border-forest"
                  />
                  <input
                    type="text"
                    required
                    placeholder={d.nameAr}
                    value={newLocNameAr}
                    onChange={(e) => setNewLocNameAr(e.target.value)}
                    className="font-sans text-xs border border-charcoal/15 rounded-lg px-3 py-2 outline-none focus:border-forest text-right"
                  />
                  <input
                    type="text"
                    placeholder={d.descEn}
                    value={newLocDesc}
                    onChange={(e) => setNewLocDesc(e.target.value)}
                    className="font-sans text-xs border border-charcoal/15 rounded-lg px-3 py-2 outline-none focus:border-forest sm:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder={d.descAr}
                    value={newLocDescAr}
                    onChange={(e) => setNewLocDescAr(e.target.value)}
                    className="font-sans text-xs border border-charcoal/15 rounded-lg px-3 py-2 outline-none focus:border-forest sm:col-span-2 text-right"
                  />
                </div>
                <button
                  type="submit"
                  className="font-sans text-[10px] tracking-wider uppercase bg-forest text-cream px-4 py-2 rounded-lg"
                >
                  {d.addLocationOption}
                </button>
              </form>

              {/* Locations List */}
              <div className="space-y-3">
                {(locationsMap[selectedCity] || []).map((loc) => (
                  <div key={loc.id} className="border border-charcoal/08 rounded-xl p-4 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <p className="font-serif text-base text-charcoal">{loc.name}</p>
                        <span className="text-charcoal/20">|</span>
                        <p className="font-sans text-sm text-charcoal/70">{loc.nameAr}</p>
                      </div>
                      <p className="font-sans text-xs text-charcoal/45">{loc.description || (locale === 'ar' ? 'لا يوجد وصف' : 'No description')}</p>
                      <p className="font-sans text-xs text-charcoal/30 text-right">{loc.descriptionAr}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteLocation(loc.id)}
                      className="font-sans text-[10px] uppercase text-red-400 hover:text-red-600 shrink-0"
                    >
                      {d.remove}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: PACKAGE MANAGEMENT (Task 7) ─── */}
        {activeTab === 'packages' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl md:text-3xl text-charcoal">{d.packagesManagement}</h2>
                <p className="font-sans text-xs text-charcoal/50 mt-1">{d.packagesManagementDesc}</p>
              </div>

              <button
                type="button"
                onClick={handleCreateNewPackage}
                className="font-sans text-xs tracking-wider uppercase bg-forest text-cream px-5 py-3 rounded-xl hover:bg-forest-deep transition-colors self-start md:self-auto font-medium shadow-sm"
              >
                {d.addPackage}
              </button>
            </div>

            {/* City & Service Selectors */}
            <div className="flex flex-wrap items-center gap-4 bg-white border border-charcoal/10 rounded-2xl p-4 shadow-sm">
              {/* City selector */}
              <div className="flex items-center gap-2">
                <span className="font-sans text-xs text-charcoal/45 font-medium uppercase tracking-wider">
                  {locale === 'ar' ? 'المدينة' : 'City'}:
                </span>
                <div className="flex gap-1 bg-linen/50 p-1 rounded-xl">
                  {(['baghdad', 'erbil'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPkgCity(c)}
                      className={clsx(
                        'font-sans text-xs tracking-wider uppercase px-4 py-2 rounded-lg transition-all',
                        pkgCity === c ? 'bg-forest text-cream shadow-xs font-semibold' : 'text-charcoal/60 hover:text-charcoal',
                      )}
                    >
                      {d[c]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-px h-6 bg-charcoal/10 hidden sm:block" />

              {/* Service selector */}
              <div className="flex items-center gap-2">
                <span className="font-sans text-xs text-charcoal/45 font-medium uppercase tracking-wider">
                  {locale === 'ar' ? 'الخدمة' : 'Service'}:
                </span>
                <div className="flex gap-1 bg-linen/50 p-1 rounded-xl">
                  {(['sessions', 'full-day'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPkgService(s)}
                      className={clsx(
                        'font-sans text-xs tracking-wider uppercase px-4 py-2 rounded-lg transition-all',
                        pkgService === s ? 'bg-forest text-cream shadow-xs font-semibold' : 'text-charcoal/60 hover:text-charcoal',
                      )}
                    >
                      {s === 'sessions' ? (locale === 'ar' ? 'جلسات التصوير' : 'Sessions') : (locale === 'ar' ? 'يوم كامل' : 'Full Day')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Package Grid + Modal System */}
            {pkgLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="rounded-2xl border border-charcoal/10 bg-white p-5 animate-pulse h-36" />
                ))}
              </div>
            ) : (
              <>
                {/* Grid of summary cards */}
                {packagesList.filter((p) => p.city === pkgCity && p.service === pkgService).length === 0 && !editingPkgId ? (
                  <div className="bg-white border border-charcoal/10 rounded-2xl p-12 text-center">
                    <p className="font-serif text-xl text-charcoal/40 mb-3">
                      {locale === 'ar' ? 'لا توجد باقات مدخلة لهذه المدينة والخدمة بعد.' : 'No packages found for this city and service.'}
                    </p>
                    <button
                      type="button"
                      onClick={handleCreateNewPackage}
                      className="font-sans text-xs tracking-wider uppercase bg-forest text-cream px-5 py-2.5 rounded-xl font-medium shadow-sm"
                    >
                      {d.addPackage}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {packagesList
                      .filter((p) => p.city === pkgCity && p.service === pkgService)
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((pkg) => (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setActiveEditingPkg(pkg.id)}
                          className={clsx(
                            'group text-left bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:border-forest/40 hover:-translate-y-0.5',
                            activeEditingPkg === pkg.id ? 'border-forest ring-1 ring-forest/30' : 'border-charcoal/12',
                          )}
                        >
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-serif text-lg text-charcoal font-medium truncate">{pkg.name}</p>
                              {pkg.name_ar && (
                                <p className="font-sans text-xs text-charcoal/45 truncate" dir="rtl">{pkg.name_ar}</p>
                              )}
                            </div>
                            <p className="font-serif text-xl text-forest font-light shrink-0">${pkg.price?.toLocaleString()}</p>
                          </div>
                          {pkg.badge && (
                            <span className="inline-block font-sans text-[9px] tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-linen border border-charcoal/10 text-charcoal font-semibold mb-2">
                              {pkg.badge}
                            </span>
                          )}
                          <p className="font-sans text-[11px] text-charcoal/50 line-clamp-2 leading-relaxed">
                            {pkg.description || (locale === 'ar' ? 'انقر لتعديل التفاصيل' : 'Click to edit details')}
                          </p>
                          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-charcoal/08">
                            <span className="font-sans text-[10px] text-charcoal/35 uppercase tracking-wider">{pkg.package_key}</span>
                            <span className="text-charcoal/20">·</span>
                            <span className="font-sans text-[10px] text-forest/60 uppercase tracking-wider group-hover:text-forest transition-colors">
                              {locale === 'ar' ? 'تعديل ←' : 'Edit →'}
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>
                )}

                {/* ─── Package Edit Modal ─── */}
                {activeEditingPkg && (() => {
                  const pkg = packagesList.find((p) => p.id === activeEditingPkg)
                  if (!pkg) return null
                  return (
                    <div
                      className="fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
                      onClick={(e) => { if (e.target === e.currentTarget) setActiveEditingPkg(null) }}
                    >
                      <div className="w-full max-w-3xl bg-linen rounded-3xl shadow-2xl my-auto">
                        <PackageEditorCard
                          pkg={pkg}
                          d={d}
                          locale={locale}
                          onSave={async (updated) => { await handleSavePackage(updated); setActiveEditingPkg(null) }}
                          onDelete={async (id) => { await handleDeletePackage(id); setActiveEditingPkg(null) }}
                          onMoveUp={() => handleMoveOrder(pkg, 'up')}
                          onMoveDown={() => handleMoveOrder(pkg, 'down')}
                          isSaved={pkgSaveMessage === pkg.id}
                          onClose={() => setActiveEditingPkg(null)}
                        />
                      </div>
                    </div>
                  )
                })()}

                {/* ─── New Package Modal ─── */}
                {editingPkgId && editPkgForm && (
                  <div
                    className="fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
                    onClick={(e) => { if (e.target === e.currentTarget) { setEditingPkgId(null); setEditPkgForm(null) } }}
                  >
                    <div className="w-full max-w-2xl bg-linen rounded-3xl shadow-2xl p-6 space-y-5 animate-fadeIn max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between border-b border-charcoal/10 pb-3">
                        <span className="font-serif text-lg text-charcoal font-semibold">
                          {locale === 'ar' ? 'إنشاء باقة جديدة' : 'Create New Package'}
                        </span>
                        <button
                          type="button"
                          onClick={() => { setEditingPkgId(null); setEditPkgForm(null) }}
                          className="font-sans text-xs uppercase text-charcoal/40 hover:text-charcoal px-3 py-1 rounded-lg border border-charcoal/15"
                        >
                          {d.cancel}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="font-sans text-[10px] uppercase tracking-wider text-charcoal/50 block mb-1 font-semibold">{d.nameEn}</label>
                          <input
                            type="text"
                            required
                            value={editPkgForm.name}
                            onChange={(e) => setEditPkgForm({ ...editPkgForm, name: e.target.value })}
                            className="w-full font-sans text-xs border border-charcoal/15 rounded-xl px-3 py-2.5 outline-none focus:border-forest bg-white"
                          />
                        </div>
                        <div>
                          <label className="font-sans text-[10px] uppercase tracking-wider text-charcoal/50 block mb-1 font-semibold">{d.nameAr}</label>
                          <input
                            type="text"
                            required
                            value={editPkgForm.name_ar}
                            onChange={(e) => setEditPkgForm({ ...editPkgForm, name_ar: e.target.value })}
                            className="w-full font-sans text-xs border border-charcoal/15 rounded-xl px-3 py-2.5 outline-none focus:border-forest bg-white text-right"
                          />
                        </div>
                        <div>
                          <label className="font-sans text-[10px] uppercase tracking-wider text-charcoal/50 block mb-1 font-semibold">{d.priceUsd}</label>
                          <input
                            type="number"
                            required
                            value={editPkgForm.price}
                            onChange={(e) => setEditPkgForm({ ...editPkgForm, price: Number(e.target.value) })}
                            className="w-full font-sans text-xs border border-charcoal/15 rounded-xl px-3 py-2.5 outline-none focus:border-forest bg-white"
                          />
                        </div>
                        <div>
                          <label className="font-sans text-[10px] uppercase tracking-wider text-charcoal/50 block mb-1 font-semibold">{d.packageKey}</label>
                          <input
                            type="text"
                            required
                            value={editPkgForm.package_key}
                            onChange={(e) => setEditPkgForm({ ...editPkgForm, package_key: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                            className="w-full font-sans text-xs border border-charcoal/15 rounded-xl px-3 py-2.5 outline-none focus:border-forest bg-white"
                          />
                        </div>
                        <div>
                          <label className="font-sans text-[10px] uppercase tracking-wider text-charcoal/50 block mb-1 font-semibold">Badge (EN)</label>
                          <input
                            type="text"
                            value={editPkgForm.badge || ''}
                            onChange={(e) => setEditPkgForm({ ...editPkgForm, badge: e.target.value })}
                            placeholder="e.g. Most Popular"
                            className="w-full font-sans text-xs border border-charcoal/15 rounded-xl px-3 py-2.5 outline-none focus:border-forest bg-white"
                          />
                        </div>
                        <div>
                          <label className="font-sans text-[10px] uppercase tracking-wider text-charcoal/50 block mb-1 font-semibold">الشارة (عربي)</label>
                          <input
                            type="text"
                            value={editPkgForm.badge_ar || ''}
                            onChange={(e) => setEditPkgForm({ ...editPkgForm, badge_ar: e.target.value })}
                            placeholder="مثلاً الأكثر طلباً"
                            className="w-full font-sans text-xs border border-charcoal/15 rounded-xl px-3 py-2.5 outline-none focus:border-forest bg-white text-right"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="font-sans text-[10px] uppercase tracking-wider text-charcoal/50 block mb-1 font-semibold">{d.descEn}</label>
                          <textarea
                            value={editPkgForm.description || ''}
                            onChange={(e) => setEditPkgForm({ ...editPkgForm, description: e.target.value })}
                            rows={2}
                            className="w-full font-sans text-xs border border-charcoal/15 rounded-xl px-3 py-2 outline-none focus:border-forest bg-white resize-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="font-sans text-[10px] uppercase tracking-wider text-charcoal/50 block mb-1 font-semibold">{d.descAr}</label>
                          <textarea
                            value={editPkgForm.description_ar || ''}
                            onChange={(e) => setEditPkgForm({ ...editPkgForm, description_ar: e.target.value })}
                            rows={2}
                            className="w-full font-sans text-xs border border-charcoal/15 rounded-xl px-3 py-2 outline-none focus:border-forest bg-white resize-none text-right"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => { setEditingPkgId(null); setEditPkgForm(null) }}
                          className="font-sans text-xs uppercase px-4 py-2.5 rounded-lg border border-charcoal/20 text-charcoal/60"
                        >
                          {d.cancel}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSavePackage(editPkgForm)}
                          className="font-sans text-xs tracking-wider uppercase bg-forest text-cream px-6 py-2.5 rounded-lg font-medium shadow-sm hover:bg-forest-deep transition-colors"
                        >
                          {d.savePackage}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── TAB: PORTFOLIO MANAGEMENT ─── */}
        {activeTab === 'portfolio' && (
          <div className="space-y-8">

            {/* ── Create Category ── */}
            <div className="bg-white border border-charcoal/10 rounded-2xl p-6 shadow-sm max-w-xl">
              <SectionHeading title={d.portfolioCategories} desc={d.portfolioCategoriesDesc} />
              <form onSubmit={createCategory} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder={d.catCode}
                  value={newCatId}
                  onChange={(e) => setNewCatId(e.target.value)}
                  className="font-sans text-xs border border-charcoal/15 rounded-xl px-3 py-2 outline-none focus:border-forest"
                />
                <input
                  type="text"
                  required
                  placeholder={d.catNameEn}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="font-sans text-xs border border-charcoal/15 rounded-xl px-3 py-2 outline-none focus:border-forest"
                />
                <input
                  type="text"
                  placeholder={d.catNameAr}
                  value={newCatNameAr}
                  onChange={(e) => setNewCatNameAr(e.target.value)}
                  className="font-sans text-xs border border-charcoal/15 rounded-xl px-3 py-2 outline-none focus:border-forest text-right"
                />
                <button
                  type="submit"
                  className="font-sans text-xs tracking-wider uppercase bg-forest text-cream py-2 rounded-xl sm:col-span-3 mt-1"
                >
                  {d.createCat}
                </button>
              </form>
            </div>

            {/* ── Category Cards Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const catImages = portfolioImgs.filter((img) => img.category === cat.id)
                const previewSrc = catImages[0] ? imageSrcSet(catImages[0].id).sm : null

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCatModal(cat.id)}
                    className={clsx(
                      'group text-left bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5',
                      activeCatModal === cat.id ? 'border-forest ring-1 ring-forest/30' : 'border-charcoal/12',
                    )}
                  >
                    {/* Thumbnail strip */}
                    <div className="h-28 bg-linen relative overflow-hidden">
                      {previewSrc ? (
                        <img
                          src={previewSrc}
                          alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-sans text-[10px] uppercase tracking-widest text-charcoal/25">
                            {locale === 'ar' ? 'لا توجد صور' : 'No photos yet'}
                          </span>
                        </div>
                      )}
                      {catImages.length > 1 && (
                        <span className="absolute top-2 right-2 font-sans text-[9px] uppercase tracking-widest bg-charcoal/60 text-cream px-2 py-0.5 rounded-full">
                          +{catImages.length}
                        </span>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-serif text-base text-charcoal font-medium truncate">{cat.name}</p>
                          <p className="font-sans text-[11px] text-charcoal/45 truncate" dir="rtl">{cat.nameAr}</p>
                        </div>
                        <span className="font-sans text-[10px] text-charcoal/35 shrink-0 bg-linen px-2 py-0.5 rounded-full">
                          {catImages.length} {locale === 'ar' ? 'صورة' : 'photos'}
                        </span>
                      </div>
                      <p className="font-sans text-[10px] text-forest/60 uppercase tracking-wider mt-3 group-hover:text-forest transition-colors">
                        {locale === 'ar' ? 'إدارة الصور ←' : 'Manage photos →'}
                      </p>
                    </div>
                  </button>
                )
              })}

              {categories.length === 0 && (
                <div className="sm:col-span-2 lg:col-span-3 bg-white border border-charcoal/10 rounded-2xl p-12 text-center">
                  <p className="font-serif text-xl text-charcoal/35">
                    {locale === 'ar' ? 'لم يتم إنشاء أي تصنيف بعد.' : 'No categories created yet.'}
                  </p>
                </div>
              )}
            </div>

            {/* ── Category Images Modal ── */}
            {activeCatModal && (() => {
              const cat = categories.find((c) => c.id === activeCatModal)
              if (!cat) return null
              const catImages = portfolioImgs.filter((img) => img.category === cat.id)
              const canDelete = catImages.length === 0

              return (
                <div
                  className="fixed inset-0 z-50 bg-charcoal/55 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
                  onClick={(e) => { if (e.target === e.currentTarget) setActiveCatModal(null) }}
                >
                  <div className="w-full max-w-4xl bg-linen rounded-3xl shadow-2xl my-auto overflow-hidden">

                    {/* Modal header */}
                    <div className="flex items-start justify-between gap-4 p-6 border-b border-charcoal/10">
                      <div className="flex-1 min-w-0">
                        {renamingCatId === cat.id ? (
                          <div className="flex gap-2 flex-wrap items-center">
                            <input
                              type="text"
                              value={renameNameEn}
                              onChange={(e) => setRenameNameEn(e.target.value)}
                              className="font-sans text-xs border border-charcoal/15 rounded-lg px-3 py-1.5 outline-none focus:border-forest bg-white"
                              placeholder="English"
                            />
                            <input
                              type="text"
                              value={renameNameAr}
                              onChange={(e) => setRenameNameAr(e.target.value)}
                              className="font-sans text-xs border border-charcoal/15 rounded-lg px-3 py-1.5 outline-none focus:border-forest bg-white text-right"
                              placeholder="العربية"
                            />
                            <button
                              type="button"
                              onClick={() => renameCategory(cat.id)}
                              className="font-sans text-[10px] uppercase text-forest font-semibold"
                            >
                              {d.save}
                            </button>
                            <button
                              type="button"
                              onClick={() => setRenamingCatId(null)}
                              className="font-sans text-[10px] uppercase text-charcoal/40"
                            >
                              {d.cancel}
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-serif text-2xl text-charcoal">{cat.name}</h3>
                              <span className="text-charcoal/20">|</span>
                              <span className="font-sans text-sm text-charcoal/55">{cat.nameAr}</span>
                            </div>
                            <p className="font-sans text-xs text-charcoal/40 mt-0.5">
                              {catImages.length} {locale === 'ar' ? 'صور في هذا التصنيف' : 'images in category'} · <span className="text-charcoal/30">{cat.id}</span>
                            </p>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        {renamingCatId !== cat.id && (
                          <button
                            type="button"
                            onClick={() => { setRenamingCatId(cat.id); setRenameNameEn(cat.name); setRenameNameAr(cat.nameAr) }}
                            className="font-sans text-[10px] uppercase text-forest hover:underline"
                          >
                            {d.rename}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={!canDelete}
                          onClick={() => { deleteCategory(cat.id); setActiveCatModal(null) }}
                          className={clsx(
                            'font-sans text-[10px] uppercase',
                            !canDelete ? 'text-charcoal/20 cursor-not-allowed' : 'text-red-500 hover:underline',
                          )}
                          title={!canDelete ? (locale === 'ar' ? 'لا يمكن حذف تصنيف يحتوي على صور' : 'Remove all images first') : ''}
                        >
                          {d.deleteCat}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveCatModal(null)}
                          className="font-sans text-[10px] uppercase text-charcoal/40 hover:text-charcoal px-3 py-1.5 border border-charcoal/15 rounded-lg"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Upload box */}
                    <div className="px-6 pt-5">
                      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-dashed border-charcoal/15">
                        <label className="flex flex-col cursor-pointer shrink-0">
                          <span className="font-sans text-xs tracking-wider uppercase bg-forest text-cream px-4 py-2.5 rounded-lg hover:bg-forest-deep transition">
                            {uploading ? (locale === 'ar' ? 'جاري الرفع…' : 'Uploading…') : d.uploadImages}
                          </span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            disabled={uploading}
                            onChange={(e) => handleImageUpload(cat.id, e.target.files)}
                          />
                        </label>
                        <p className="font-sans text-[10px] text-charcoal/40">{d.uploadDesc}</p>
                      </div>
                    </div>

                    {/* Images grid */}
                    <div className="p-6">
                      {catImages.length === 0 ? (
                        <p className="font-sans text-xs text-charcoal/35 py-10 text-center">{d.emptyCat}</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {catImages.map((img) => {
                            const src = imageSrcSet(img.id).sm
                            return (
                              <div
                                key={img.id}
                                onClick={() => handleStartEditImage(img)}
                                className="relative group rounded-xl overflow-hidden border border-charcoal/10 bg-sand/20 shadow-xs flex flex-col cursor-pointer transition-all duration-300 hover:shadow-md hover:border-forest/40"
                              >
                                <div className="relative aspect-square overflow-hidden bg-charcoal/05">
                                  <img
                                    src={src}
                                    alt={img.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                  {/* Action Buttons Overlay */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/30 to-transparent opacity-0 group-hover:opacity-100 flex flex-col justify-end p-2 transition-all duration-200 gap-1.5">
                                    <div className="flex items-center gap-1.5 justify-center">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleStartEditImage(img)
                                        }}
                                        className="font-sans text-[10px] font-semibold tracking-wider uppercase bg-white text-charcoal hover:bg-cream px-2 py-1 rounded-md shadow-sm flex items-center gap-1 transition"
                                        title={locale === 'ar' ? 'تعديل الاسم' : 'Edit Name'}
                                      >
                                        <span>✏️</span>
                                        <span>{locale === 'ar' ? 'تعديل' : 'Rename'}</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          deletePortfolioImage(img.id)
                                        }}
                                        className="font-sans text-[10px] font-semibold tracking-wider uppercase bg-red-600 text-white hover:bg-red-700 px-2 py-1 rounded-md shadow-sm flex items-center gap-1 transition"
                                        title={locale === 'ar' ? 'حذف الصورة' : 'Delete Image'}
                                      >
                                        <span>🗑️</span>
                                        <span>{locale === 'ar' ? 'حذف' : 'Delete'}</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Caption Bar showing Image Title */}
                                <div className="p-2 bg-white flex items-center justify-between gap-1 border-t border-charcoal/06">
                                  <span className="font-sans text-xs text-charcoal/80 font-medium truncate" title={img.title}>
                                    {img.title || (locale === 'ar' ? 'بدون اسم' : 'Untitled')}
                                  </span>
                                  <span className="text-[10px] text-charcoal/30 group-hover:text-forest transition-colors shrink-0">
                                    ✏️
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* ─── Edit Image Name & Details Modal ─── */}
        <AnimatePresence>
          {editingImage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-charcoal/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white w-full max-w-md rounded-2xl p-6 sm:p-7 shadow-2xl border border-charcoal/10 relative"
              >
                <button
                  type="button"
                  onClick={() => setEditingImage(null)}
                  className="absolute top-4 right-4 rtl:right-auto rtl:left-4 w-8 h-8 rounded-full flex items-center justify-center text-charcoal/50 hover:text-charcoal hover:bg-charcoal/06 transition-colors text-base"
                >
                  ✕
                </button>

                <h3 className="font-serif text-xl sm:text-2xl text-charcoal font-semibold mb-1">
                  {locale === 'ar' ? 'تعديل اسم الصورة' : 'Edit Image Name'}
                </h3>
                <p className="font-sans text-xs text-charcoal/60 mb-4">
                  {locale === 'ar'
                    ? 'يمكنك تغيير اسم وعنوان الصورة ليظهر في المعرض بشكل مناسب.'
                    : 'Update the image name and title as it appears in the portfolio.'}
                </p>

                {/* Image Preview Thumbnail */}
                <div className="w-full h-44 rounded-xl overflow-hidden mb-4 bg-charcoal/05 border border-charcoal/10 flex items-center justify-center">
                  <img
                    src={imageSrcSet(editingImage.id).sm}
                    alt={editingImage.title}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Name Input */}
                <div className="mb-6">
                  <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-charcoal/70 mb-2">
                    {locale === 'ar' ? 'اسم الصورة / العنوان' : 'Image Name / Title'}
                  </label>
                  <input
                    type="text"
                    value={editImageTitle}
                    onChange={(e) => setEditImageTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveImageTitle()
                    }}
                    autoFocus
                    placeholder={locale === 'ar' ? 'أدخل اسم الصورة...' : 'Enter image title...'}
                    className="w-full px-4 py-2.5 rounded-xl border border-charcoal/20 bg-sand/10 font-sans text-sm text-charcoal focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-charcoal/08">
                  <button
                    type="button"
                    onClick={() => {
                      const idToDelete = editingImage.id
                      setEditingImage(null)
                      deletePortfolioImage(idToDelete)
                    }}
                    className="font-sans text-xs font-semibold uppercase tracking-wider text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition"
                  >
                    {locale === 'ar' ? 'حذف الصورة' : 'Delete'}
                  </button>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setEditingImage(null)}
                      className="font-sans text-xs tracking-wider uppercase px-4 py-2 rounded-xl border border-charcoal/20 text-charcoal/70 hover:bg-charcoal/05 transition"
                    >
                      {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveImageTitle}
                      disabled={savingImageTitle || !editImageTitle.trim()}
                      className="font-sans text-xs font-semibold tracking-wider uppercase px-5 py-2 rounded-xl bg-forest text-cream hover:bg-forest/90 transition shadow-xs disabled:opacity-50"
                    >
                      {savingImageTitle
                        ? (locale === 'ar' ? 'جاري الحفظ…' : 'Saving…')
                        : (locale === 'ar' ? 'حفظ التعديل' : 'Save Name')}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ─── TAB: KIND WORDS ─── */}
        {activeTab === 'kindWords' && (
          <div>
            <SectionHeading title={d.kindWords} desc={d.kindWordsDesc} />

            {/* Add / Edit Form */}
            <div className="bg-white rounded-2xl border border-charcoal/12 shadow-xs p-6 mb-8">
              <h3 className="font-serif text-lg text-charcoal font-medium mb-5">
                {editingTestimonial ? d.editTestimonial : d.addTestimonial}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Names */}
                <div>
                  <label className="block font-sans text-[10px] font-semibold uppercase tracking-widest text-charcoal/60 mb-1.5">{d.namesEn}</label>
                  <input
                    type="text"
                    value={testimonialForm.names}
                    onChange={(e) => setTestimonialForm((f) => ({ ...f, names: e.target.value }))}
                    placeholder="Layla & Omar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal/20 bg-sand/10 font-sans text-sm text-charcoal focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all"
                  />
                </div>
                <div>
                  <label className="block font-sans text-[10px] font-semibold uppercase tracking-widest text-charcoal/60 mb-1.5">{d.namesAr}</label>
                  <input
                    type="text"
                    value={testimonialForm.namesAr}
                    onChange={(e) => setTestimonialForm((f) => ({ ...f, namesAr: e.target.value }))}
                    placeholder="ليلى وعمر"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal/20 bg-sand/10 font-sans text-sm text-charcoal focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all"
                  />
                </div>
                {/* Occasion */}
                <div>
                  <label className="block font-sans text-[10px] font-semibold uppercase tracking-widest text-charcoal/60 mb-1.5">{d.locationEn}</label>
                  <input
                    type="text"
                    value={testimonialForm.location}
                    onChange={(e) => setTestimonialForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="Full Day Wedding"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal/20 bg-sand/10 font-sans text-sm text-charcoal focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all"
                  />
                </div>
                <div>
                  <label className="block font-sans text-[10px] font-semibold uppercase tracking-widest text-charcoal/60 mb-1.5">{d.locationAr}</label>
                  <input
                    type="text"
                    value={testimonialForm.locationAr}
                    onChange={(e) => setTestimonialForm((f) => ({ ...f, locationAr: e.target.value }))}
                    placeholder="حفل زفاف يوم كامل"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal/20 bg-sand/10 font-sans text-sm text-charcoal focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all"
                  />
                </div>
                {/* Quote EN */}
                <div className="md:col-span-2">
                  <label className="block font-sans text-[10px] font-semibold uppercase tracking-widest text-charcoal/60 mb-1.5">{d.quoteEn}</label>
                  <textarea
                    rows={3}
                    value={testimonialForm.quote}
                    onChange={(e) => setTestimonialForm((f) => ({ ...f, quote: e.target.value }))}
                    placeholder="They disappeared into the background..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal/20 bg-sand/10 font-sans text-sm text-charcoal focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all resize-none"
                  />
                </div>
                {/* Quote AR */}
                <div className="md:col-span-2">
                  <label className="block font-sans text-[10px] font-semibold uppercase tracking-widest text-charcoal/60 mb-1.5">{d.quoteAr}</label>
                  <textarea
                    rows={3}
                    value={testimonialForm.quoteAr}
                    onChange={(e) => setTestimonialForm((f) => ({ ...f, quoteAr: e.target.value }))}
                    dir="rtl"
                    placeholder="اختفوا في الخلفية..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal/20 bg-sand/10 font-sans text-sm text-charcoal focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveTestimonial}
                  disabled={savingTestimonial || !testimonialForm.names.trim() || !testimonialForm.quote.trim()}
                  className="font-sans text-xs font-semibold tracking-wider uppercase px-6 py-2.5 rounded-xl bg-forest text-cream hover:bg-forest/90 transition shadow-xs disabled:opacity-50"
                >
                  {savingTestimonial ? (locale === 'ar' ? 'جاري الحفظ…' : 'Saving…') : d.saveTestimonial}
                </button>
                {editingTestimonial && (
                  <button
                    type="button"
                    onClick={() => { setEditingTestimonial(null); setTestimonialForm(BLANK_TESTIMONIAL) }}
                    className="font-sans text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl border border-charcoal/20 text-charcoal/70 hover:bg-charcoal/05 transition"
                  >
                    {d.cancel}
                  </button>
                )}
              </div>
            </div>

            {/* Testimonials List */}
            {testimonials.length === 0 ? (
              <p className="font-sans text-xs text-charcoal/40 py-10 text-center">{d.noTestimonials}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {testimonials.map((item, idx) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-charcoal/10 p-5 shadow-xs flex flex-col gap-3 group">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-serif text-base text-charcoal font-medium">{item.names}</p>
                        {item.namesAr && <p className="font-sans text-xs text-charcoal/50 mt-0.5" dir="rtl">{item.namesAr}</p>}
                        <p className="font-sans text-[10px] tracking-wider uppercase text-forest/80 mt-1">{item.location}</p>
                      </div>
                      <span className="font-sans text-[10px] text-charcoal/30 bg-charcoal/05 rounded-lg px-2 py-1 shrink-0">#{idx + 1}</span>
                    </div>
                    <blockquote className="font-serif text-sm text-charcoal/75 italic leading-relaxed border-l-2 border-sage/40 pl-3">
                      {item.quote}
                    </blockquote>
                    {item.quoteAr && (
                      <blockquote className="font-sans text-xs text-charcoal/50 leading-relaxed border-r-2 border-sage/30 pr-3 text-right" dir="rtl">
                        {item.quoteAr}
                      </blockquote>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-charcoal/08">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTestimonial(item)
                          setTestimonialForm({
                            names: item.names, namesAr: item.namesAr || '',
                            quote: item.quote, quoteAr: item.quoteAr || '',
                            location: item.location, locationAr: item.locationAr || '',
                            order: item.order ?? idx,
                          })
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="font-sans text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-lg border border-charcoal/20 text-charcoal/70 hover:bg-charcoal/05 transition"
                      >
                        {d.editTestimonial}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTestimonial(item.id)}
                        className="font-sans text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                      >
                        {d.deleteTestimonial}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── Storage Toast Notification ─── */}
      {storageToastVisible && (() => {
        const usedGB    = storageUsedBytes / (1024 ** 3)
        const limitGB   = 9
        const pct       = Math.min((usedGB / limitGB) * 100, 100)
        const freeGB    = Math.max(limitGB - usedGB, 0)
        const isWarning = pct >= 70 && pct < 90
        const isDanger  = pct >= 90

        const barColor = isDanger
          ? 'bg-red-500'
          : isWarning
            ? 'bg-amber-400'
            : 'bg-forest'

        const iconColor = isDanger
          ? 'text-red-500'
          : isWarning
            ? 'text-amber-500'
            : 'text-forest'

        const icon = isDanger ? '⚠️' : isWarning ? '🟡' : '🗄️'

        const label = isDanger
          ? (locale === 'ar' ? 'التخزين شارف على الامتلاء!' : 'Storage almost full!')
          : isWarning
            ? (locale === 'ar' ? 'التخزين مرتفع' : 'Storage getting high')
            : (locale === 'ar' ? 'مساحة التخزين' : 'Storage usage')

        return (
          <div
            className={clsx(
              'fixed bottom-6 right-6 z-[9999] w-72 rounded-2xl shadow-2xl border backdrop-blur-sm p-4',
              'transition-all duration-500 animate-in slide-in-from-bottom-4 fade-in',
              isDanger
                ? 'bg-red-50/95 border-red-200'
                : isWarning
                  ? 'bg-amber-50/95 border-amber-200'
                  : 'bg-white/95 border-charcoal/12',
            )}
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{icon}</span>
                <span className={clsx('font-sans text-[11px] font-semibold tracking-wide uppercase', iconColor)}>
                  {label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStorageToastVisible(false)
                  if (storageToastTimerRef.current) clearTimeout(storageToastTimerRef.current)
                }}
                className="text-charcoal/35 hover:text-charcoal/70 transition-colors text-sm leading-none"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full bg-charcoal/08 rounded-full overflow-hidden mb-2">
              <div
                className={clsx('h-full rounded-full transition-all duration-700', barColor)}
                style={{ width: `${pct.toFixed(1)}%` }}
              />
            </div>

            {/* Numbers row */}
            <div className="flex items-center justify-between">
              <span className="font-sans text-[10px] text-charcoal/50">
                {usedGB.toFixed(2)} GB {locale === 'ar' ? 'من' : 'of'} {limitGB} GB
              </span>
              <span className={clsx('font-sans text-[10px] font-bold', iconColor)}>
                {pct.toFixed(0)}%
              </span>
            </div>

            {/* Free space */}
            <p className="font-sans text-[10px] text-charcoal/40 mt-1">
              {locale === 'ar'
                ? `المتبقي: ${freeGB.toFixed(2)} GB`
                : `Free: ${freeGB.toFixed(2)} GB`}
            </p>
          </div>
        )
      })()}
    </div>
  )
}

function DashboardPage() {
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthed(true)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuthed(true)
      } else {
        setAuthed(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sage"></div>
      </div>
    )
  }

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />
  }

  return (
    <Dashboard
      onLogout={async () => {
        if (supabase) {
          await supabase.auth.signOut()
        }
        setAuthed(false)
      }}
    />
  )
}
