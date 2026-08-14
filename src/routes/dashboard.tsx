import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { clsx } from 'clsx'
import { PalmEmblem } from '@/features/shared/components/PalmEmblem'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase/client'
import {
  DEFAULT_CATEGORIES,
  staticPortfolioImages,
  getPublicUrl,
  type PortfolioImage,
  type CategoryInfo,
} from '@/lib/data/portfolio'
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

export const Route = createFileRoute('/dashboard')({
  head: () => ({
    meta: [{ title: 'Dashboard — Grooms Art' }],
  }),
  component: DashboardPage,
})

// ─── Constants ──────────────────────────────────────────────────────────────
const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })

type DashboardTab = 'bookings' | 'availability' | 'portfolio'

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

// ─── Components ─────────────────────────────────────────────────────────────
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
        'rounded-2xl p-6 border',
        accent
          ? 'bg-forest text-cream border-forest/80'
          : 'bg-white border-charcoal/10 text-charcoal',
      )}
    >
      <p
        className={clsx(
          'font-sans text-[10px] tracking-[0.22em] uppercase mb-3',
          accent ? 'text-cream/60' : 'text-charcoal/40',
        )}
      >
        {label}
      </p>
      <p
        className={clsx(
          'font-serif text-4xl mb-1',
          accent ? 'text-cream' : 'text-charcoal',
        )}
      >
        {value}
      </p>
      {sub && (
        <p
          className={clsx(
            'font-sans text-xs',
            accent ? 'text-cream/50' : 'text-charcoal/40',
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
      <h2 className="font-serif text-2xl text-charcoal">{title}</h2>
      {desc && <p className="font-sans text-xs text-charcoal/50 mt-1">{desc}</p>}
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
    // Availability
    dateBlocking: 'Date Blocking',
    dateBlockingDesc: 'Click dates on the calendar to toggle blocked/unblocked status for bookings.',
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
  },
  ar: {
    bookings: 'الحجوزات',
    availability: 'التوفر',
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
    // Availability
    dateBlocking: 'حظر التواريخ',
    dateBlockingDesc: 'اضغط على التواريخ في التقويم لتبديل حالة الحظر للحجوزات.',
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

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const { locale, toggleLocale } = useI18n()
  const d = locale === 'ar' ? DASHBOARD_T.ar : DASHBOARD_T.en
  const [activeTab, setActiveTab] = useState<DashboardTab>('bookings')

  // ─── Toast Notifications ───────────────────────────────────────────────────
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([])
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  // ─── Notifications State ────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<{ id: string; message: string; is_read: boolean; created_at: string }[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications])

  const reloadNotifications = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (!error && data) setNotifications(data)
  }, [])

  const markNotificationsAsRead = async () => {
    if (!supabase) return
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length === 0) return
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)
    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    }
  }

  // ─── State for Bookings ───
  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed' | 'approved'>('all')

  const reloadBookings = useCallback(async () => {
    if (!supabase) {
      showToast(locale === 'ar' ? 'Supabase غير متصل.' : 'Supabase not configured.', 'error')
      return
    }
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
      }
    } catch (err) {
      console.error('Failed to load bookings:', err)
      showToast(locale === 'ar' ? 'فشل تحميل الحجوزات.' : 'Failed to load bookings.', 'error')
    }
  }, [locale, showToast])

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    reloadBookings()
    reloadNotifications()

    const bookingsChannel = client
      .channel('db_bookings_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => reloadBookings())
      .subscribe()

    const notifChannel = client
      .channel('db_notifications_rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        reloadNotifications()
        showToast(payload.new.message ?? (locale === 'ar' ? 'حجز جديد!' : 'New booking!'), 'success')
      })
      .subscribe()

    return () => {
      client.removeChannel(bookingsChannel)
      client.removeChannel(notifChannel)
    }
  }, [reloadBookings, reloadNotifications, showToast, locale])

  const updateBookingStatus = async (id: string, newStatus: BookingStatus) => {
    if (!supabase) return
    const currentBooking = bookings.find((b) => b.id === id)
    if (!currentBooking) return

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: newStatus,
          whatsapp_triggered: newStatus === 'confirmed' ? true : currentBooking.whatsappTriggered
        })
        .eq('id', id)
      if (error) throw error

      setBookings((prev) => prev.map((b) => {
        if (b.id === id) {
          const item = { ...b, status: newStatus }
          if (newStatus === 'confirmed') {
            triggerWhatsApp(item)
            item.whatsappTriggered = true
          }
          return item
        }
        return b
      }))
      showToast(locale === 'ar' ? 'تم تحديث حالة الحجز.' : 'Booking status updated.', 'success')
    } catch (err) {
      console.error(err)
      showToast(locale === 'ar' ? 'فشل تحديث حالة الحجز.' : 'Failed to update booking status.', 'error')
    }
  }

  const deleteBooking = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking record?')) return
    if (!supabase) return
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id)
      if (error) throw error
      setBookings((prev) => prev.filter((b) => b.id !== id))
      showToast(locale === 'ar' ? 'تم حذف الحجز.' : 'Booking deleted.', 'success')
    } catch (err) {
      console.error(err)
      showToast(locale === 'ar' ? 'فشل حذف الحجز.' : 'Failed to delete booking.', 'error')
    }
  }

  const handleWelcomeSend = (b: Booking) => {
    window.open(getWelcomeWhatsAppLink(b), '_blank')
    updateBookingStatus(b.id, 'confirmed')
  }

  const handleFinalSend = (b: Booking) => {
    window.open(getFinalConfirmationWhatsAppLink(b), '_blank')
    updateBookingStatus(b.id, 'approved')
  }

  // ─── State for Availability ───
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [fullyBookedDates, setFullyBookedDates] = useState<string[]>([])
  const [pendingFullyBookedDate, setPendingFullyBookedDate] = useState<string | null>(null)
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
  }

  const availCells = useMemo(() => {
    const firstDay = new Date(availCursor.year, availCursor.month, 1).getDay()
    const daysInMonth = new Date(availCursor.year, availCursor.month + 1, 0).getDate()
    const grid: { iso: string | null; day: number | null; isToday: boolean; isBlocked: boolean; isPast: boolean }[] = []
    for (let i = 0; i < firstDay; i++) {
      grid.push({ iso: null, day: null, isToday: false, isBlocked: false, isPast: false })
    }
    const todayIso = toLocalISODate(today)
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(availCursor.year, availCursor.month, d)
      const iso = toLocalISODate(date)
      const isBlocked = blockedDates.includes(iso) || fullyBookedDates.includes(iso)
      const isToday = iso === todayIso
      const isPast = iso < todayIso
      grid.push({ iso, day: d, isToday, isBlocked, isPast })
    }
    while (grid.length % 7 !== 0) {
      grid.push({ iso: null, day: null, isToday: false, isBlocked: false, isPast: false })
    }
    return grid
  }, [availCursor, blockedDates, fullyBookedDates, today])

  const reloadAvailability = useCallback(async () => {
    if (!supabase) return
    const { data: dates, error: datesErr } = await supabase.from('blocked_dates').select('*')
    if (!datesErr && dates) {
      setBlockedDates(dates.filter((d: any) => d.type === 'blocked').map((d: any) => d.date))
      setFullyBookedDates(dates.filter((d: any) => d.type === 'fully_booked').map((d: any) => d.date))
    }
    const { data: locs, error: locsErr } = await supabase.from('locations').select('*')
    if (!locsErr && locs) {
      const map: Record<CityId, Location[]> = { baghdad: [], erbil: [] }
      locs.forEach((l: any) => {
        if (map[l.city as CityId]) {
          map[l.city as CityId].push({
            id: l.id, city: l.city, name: l.name, nameAr: l.name_ar,
            description: l.description || '', descriptionAr: l.description_ar || '',
          })
        }
      })
      setLocationsMap(map)
    } else {
      setLocationsMap(DEFAULT_LOCATIONS)
    }
  }, [])

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    reloadAvailability()

    const blockedChannel = client
      .channel('db_blocked_dates_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blocked_dates' }, () => reloadAvailability())
      .subscribe()

    const locsChannel = client
      .channel('db_locations_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, () => reloadAvailability())
      .subscribe()

    return () => {
      client.removeChannel(blockedChannel)
      client.removeChannel(locsChannel)
    }
  }, [reloadAvailability])

  const blockDate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBlockedDate || !supabase) return
    if (blockedDates.includes(newBlockedDate) || fullyBookedDates.includes(newBlockedDate)) {
      showToast(locale === 'ar' ? 'هذا التاريخ محظور بالفعل.' : 'Date already blocked.', 'error')
      return
    }
    const { error } = await supabase.from('blocked_dates').insert({ date: newBlockedDate, type: 'blocked' })
    if (error) {
      showToast(locale === 'ar' ? 'فشل حظر التاريخ.' : 'Failed to block date.', 'error')
    } else {
      setBlockedDates((prev) => [...prev, newBlockedDate].sort())
      setNewBlockedDate('')
      showToast(locale === 'ar' ? 'تم حظر التاريخ.' : 'Date blocked.', 'success')
    }
  }

  const unblockDate = async (dateStr: string) => {
    if (!supabase) return
    const { error } = await supabase.from('blocked_dates').delete().eq('date', dateStr)
    if (error) {
      showToast(locale === 'ar' ? 'فشل إلغاء الحظر.' : 'Failed to unblock date.', 'error')
    } else {
      setBlockedDates((prev) => prev.filter((d) => d !== dateStr))
      setFullyBookedDates((prev) => prev.filter((d) => d !== dateStr))
      showToast(locale === 'ar' ? 'تم فتح التاريخ.' : 'Date unblocked.', 'success')
    }
  }

  const toggleBlockDate = async (dateStr: string) => {
    if (!supabase) return
    const isBlocked = blockedDates.includes(dateStr) || fullyBookedDates.includes(dateStr)
    if (isBlocked) {
      const { error } = await supabase.from('blocked_dates').delete().eq('date', dateStr)
      if (error) {
        showToast(locale === 'ar' ? 'فشل تعديل حالة اليوم.' : 'Failed to update date.', 'error')
      } else {
        setBlockedDates((prev) => prev.filter((d) => d !== dateStr))
        setFullyBookedDates((prev) => prev.filter((d) => d !== dateStr))
        showToast(locale === 'ar' ? 'تم فتح اليوم.' : 'Date opened.', 'success')
      }
    } else {
      const { error } = await supabase.from('blocked_dates').insert({ date: dateStr, type: 'blocked' })
      if (error) {
        showToast(locale === 'ar' ? 'فشل حظر اليوم.' : 'Failed to block date.', 'error')
      } else {
        setBlockedDates((prev) => [...prev, dateStr].sort())
        showToast(locale === 'ar' ? 'تم حظر اليوم.' : 'Date blocked.', 'success')
      }
    }
  }

  const confirmFullyBooked = async (dateStr: string) => {
    if (!supabase) return
    const isFullyBooked = fullyBookedDates.includes(dateStr)
    const { error } = await supabase.from('blocked_dates').upsert({ date: dateStr, type: isFullyBooked ? 'blocked' : 'fully_booked' })
    if (error) {
      showToast(locale === 'ar' ? 'فشل تحديث حالة اليوم.' : 'Failed to update date.', 'error')
    } else {
      if (isFullyBooked) {
        setFullyBookedDates((prev) => prev.filter((d) => d !== dateStr))
        setBlockedDates((prev) => [...prev, dateStr].sort())
        showToast(locale === 'ar' ? 'تم إعادة تصنيف اليوم كمحظور.' : 'Day changed to Blocked.', 'success')
      } else {
        setBlockedDates((prev) => prev.filter((d) => d !== dateStr))
        setFullyBookedDates((prev) => [...prev, dateStr].sort())
        showToast(locale === 'ar' ? 'تم قفل اليوم بالكامل.' : 'Day marked as Fully Booked.', 'success')
      }
    }
    setPendingFullyBookedDate(null)
  }

  const toggleFullyBooked = (dateStr: string) => {
    const isCurrentlyFull = fullyBookedDates.includes(dateStr)
    if (!isCurrentlyFull) {
      // Require confirmation before marking as fully booked
      setPendingFullyBookedDate(dateStr)
    } else {
      confirmFullyBooked(dateStr)
    }
  }

  const addLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLocName.trim() || !newLocNameAr.trim() || !supabase) return
    const { data, error } = await supabase
      .from('locations')
      .insert({ city: selectedCity, name: newLocName.trim(), name_ar: newLocNameAr.trim(), description: newLocDesc.trim(), description_ar: newLocDescAr.trim() })
      .select()
    if (error) {
      showToast(locale === 'ar' ? 'فشل إضافة الموقع.' : 'Failed to add location.', 'error')
    } else if (data && data[0]) {
      const added: Location = { id: data[0].id, city: data[0].city, name: data[0].name, nameAr: data[0].name_ar, description: data[0].description || '', descriptionAr: data[0].description_ar || '' }
      setLocationsMap((prev) => ({ ...prev, [selectedCity]: [...(prev[selectedCity] || []), added] }))
      setNewLocName(''); setNewLocNameAr(''); setNewLocDesc(''); setNewLocDescAr('')
      showToast(locale === 'ar' ? 'تم إضافة الموقع.' : 'Location added.', 'success')
    }
  }

  const deleteLocation = async (locId: string) => {
    if (!confirm('Are you sure you want to delete this location?') || !supabase) return
    const { error } = await supabase.from('locations').delete().eq('id', locId)
    if (error) {
      showToast(locale === 'ar' ? 'فشل حذف الموقع.' : 'Failed to delete location.', 'error')
    } else {
      setLocationsMap((prev) => ({ ...prev, [selectedCity]: (prev[selectedCity] || []).filter((l) => l.id !== locId) }))
      showToast(locale === 'ar' ? 'تم حذف الموقع.' : 'Location deleted.', 'success')
    }
  }

  // ─── State for Portfolio ───
  const [categories, setCategories] = useState<CategoryInfo[]>([...DEFAULT_CATEGORIES])
  const [portfolioImgs, setPortfolioImgs] = useState<PortfolioImage[]>([])
  const [newCatId, setNewCatId] = useState('')
  const [newCatName, setNewCatName] = useState('')
  const [newCatNameAr, setNewCatNameAr] = useState('')
  const [renamingCatId, setRenamingCatId] = useState<string | null>(null)
  const [renameNameEn, setRenameNameEn] = useState('')
  const [renameNameAr, setRenameNameAr] = useState('')
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)

  const reloadPortfolio = useCallback(async () => {
    if (!supabase) return
    try {
      const { data: cats, error: catsErr } = await supabase.from('portfolio_categories').select('*').order('sort_order', { ascending: true })
      let mergedCats = [...DEFAULT_CATEGORIES]
      if (!catsErr && cats) {
        cats.forEach((c: any) => {
          if (!mergedCats.some((existing) => existing.id === c.id)) {
            mergedCats.push({ id: c.id, name: c.name, nameAr: c.name_ar })
          }
        })
      }
      setCategories(mergedCats)

      const { data: imgs, error: imgsErr } = await supabase.from('portfolio_images').select('*').order('created_at', { ascending: false })
      if (!imgsErr && imgs) {
        const mapped: PortfolioImage[] = imgs.map((row: any) => ({
          id: getPublicUrl(row.storage_path),
          dbId: row.id,
          slug: row.slug,
          title: row.title,
          alt: row.alt || '',
          category: row.category,
          partOfFullDay: row.part_of_full_day,
          orientation: row.orientation || 'landscape',
          storagePath: row.storage_path,
          exif: { camera: 'Sony A7 IV', lens: '35mm f/1.4 GM', focalLength: '35mm', aperture: 'f/2.2', shutter: '1/500s', iso: 'ISO 100' },
        }))
        setPortfolioImgs([...mapped, ...staticPortfolioImages])
      } else {
        setPortfolioImgs(staticPortfolioImages)
      }
    } catch (err) {
      console.error('Failed to reload portfolio:', err)
      showToast(locale === 'ar' ? 'فشل تحميل بيانات المعرض.' : 'Failed to load portfolio.', 'error')
    }
  }, [locale, showToast])

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    reloadPortfolio()

    const catsChannel = client
      .channel('db_portfolio_cats_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio_categories' }, () => reloadPortfolio())
      .subscribe()

    const imgsChannel = client
      .channel('db_portfolio_imgs_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio_images' }, () => reloadPortfolio())
      .subscribe()

    return () => {
      client.removeChannel(catsChannel)
      client.removeChannel(imgsChannel)
    }
  }, [reloadPortfolio])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploadProgress !== null) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [uploadProgress])

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    const id = newCatId.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
    if (!id || !newCatName.trim() || !supabase) return
    if (categories.some((c) => c.id === id)) {
      showToast(locale === 'ar' ? 'معرّف التصنيف موجود.' : 'Category ID already exists.', 'error')
      return
    }
    const { error } = await supabase.from('portfolio_categories').insert({ id, name: newCatName.trim(), name_ar: newCatNameAr.trim() || newCatName.trim() })
    if (error) {
      showToast(locale === 'ar' ? 'فشل إنشاء التصنيف.' : 'Failed to create category.', 'error')
    } else {
      setNewCatId(''); setNewCatName(''); setNewCatNameAr('')
      showToast(locale === 'ar' ? 'تم إنشاء التصنيف.' : 'Category created.', 'success')
      reloadPortfolio()
    }
  }

  const renameCategory = async (id: string) => {
    if (!renameNameEn.trim() || !supabase) return
    const { error } = await supabase.from('portfolio_categories').update({ name: renameNameEn.trim(), name_ar: renameNameAr.trim() || renameNameEn.trim() }).eq('id', id)
    if (error) {
      showToast(locale === 'ar' ? 'فشل تعديل اسم التصنيف.' : 'Failed to rename category.', 'error')
    } else {
      setRenamingCatId(null)
      showToast(locale === 'ar' ? 'تم تعديل التصنيف.' : 'Category renamed.', 'success')
      reloadPortfolio()
    }
  }

  const deleteCategory = async (catId: string) => {
    const hasImages = portfolioImgs.some((img) => img.category === catId)
    if (hasImages) {
      showToast(locale === 'ar' ? 'احذف صور التصنيف أولاً.' : 'Remove category images first.', 'error')
      return
    }
    if (!confirm('Are you sure you want to delete this category?') || !supabase) return
    const { error } = await supabase.from('portfolio_categories').delete().eq('id', catId)
    if (error) {
      showToast(locale === 'ar' ? 'فشل حذف التصنيف.' : 'Failed to delete category.', 'error')
    } else {
      showToast(locale === 'ar' ? 'تم حذف التصنيف.' : 'Category deleted.', 'success')
      reloadPortfolio()
    }
  }

  const deletePortfolioImage = async (imgId: string) => {
    if (!confirm('Are you sure you want to remove this image?') || !supabase) return
    const targetImg = portfolioImgs.find((img) => img.id === imgId)
    if (!targetImg?.storagePath || !targetImg?.dbId) return
    try {
      const { error: storageErr } = await supabase.storage.from('portfolio').remove([targetImg.storagePath])
      if (storageErr) throw storageErr
      const { error: dbErr } = await supabase.from('portfolio_images').delete().eq('id', targetImg.dbId)
      if (dbErr) throw dbErr
      showToast(locale === 'ar' ? 'تم حذف الصورة.' : 'Image deleted.', 'success')
      reloadPortfolio()
    } catch (err) {
      console.error(err)
      showToast(locale === 'ar' ? 'فشل حذف الصورة.' : 'Failed to delete image.', 'error')
    }
  }

  const dataURLtoBlob = (dataurl: string): Blob => {
    const arr = dataurl.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/webp'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) { u8arr[n] = bstr.charCodeAt(n) }
    return new Blob([u8arr], { type: mime })
  }

  const handleImageUpload = async (catId: string, files: FileList | null) => {
    if (!files || files.length === 0 || !supabase) return
    setUploadProgress({ current: 0, total: files.length })
    try {
      for (let i = 0; i < files.length; i++) {
        setUploadProgress({ current: i + 1, total: files.length })
        const file = files[i]
        const dataUrl = await optimizeToWebP(file)
        const webpBlob = dataURLtoBlob(dataUrl)
        const title = file.name.replace(/\.[^/.]+$/, '')
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const storagePath = `${catId}/${Date.now()}-${slug}.webp`
        const { error: storageError } = await supabase.storage.from('portfolio').upload(storagePath, webpBlob, { contentType: 'image/webp' })
        if (storageError) throw storageError
        const { error: dbError } = await supabase.from('portfolio_images').insert({ slug, title, alt: `${title} - portfolio upload`, category: catId, storage_path: storagePath, orientation: 'landscape' })
        if (dbError) throw dbError
      }
      showToast(locale === 'ar' ? 'تم رفع الصور بنجاح.' : 'Images uploaded successfully.', 'success')
      reloadPortfolio()
    } catch (err) {
      console.error(err)
      showToast(locale === 'ar' ? 'فشل رفع بعض الصور.' : 'Failed to upload some images.', 'error')
    } finally {
      setUploadProgress(null)
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
    <div className="min-h-screen bg-[#F5F3EE]" dir="ltr">
      {/* Header bar */}
      <header className="fixed inset-x-0 top-0 z-50 p-4 md:p-6 flex justify-center">
        <div className="w-full max-w-6xl flex items-center justify-between px-6 md:px-10 py-3.5 rounded-full bg-[#F5F3EE]/40 backdrop-blur-md border border-charcoal/05">
          <Link to="/" className="block py-0.5 transition-opacity duration-300 hover:opacity-85">
            <img
              src="/images/logo.png"
              alt="Grooms Art Logo"
              className="h-8 md:h-9 w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleLocale}
              className="font-sans text-xs tracking-[0.2em] uppercase text-charcoal/60 hover:text-charcoal transition-colors duration-300"
              aria-label="Toggle language"
            >
              {locale === 'en' ? 'AR' : 'EN'}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  if (!showNotifications) markNotificationsAsRead()
                }}
                className="relative p-1.5 rounded-full text-charcoal/50 hover:bg-forest/08 hover:text-forest transition-all"
                aria-label="Notifications"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[9px] font-sans font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#F5F3EE]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 mt-3 w-80 bg-white border border-charcoal/12 rounded-2xl shadow-xl z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-charcoal/08 flex items-center justify-between bg-linen/30">
                        <span className="font-serif text-sm text-charcoal">
                          {locale === 'ar' ? 'الإشعارات' : 'Notifications'}
                        </span>
                        {unreadCount > 0 && (
                          <span className="font-sans text-[10px] bg-forest/10 text-forest px-2 py-0.5 rounded-full">
                            {unreadCount} {locale === 'ar' ? 'جديد' : 'new'}
                          </span>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-charcoal/05">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center font-sans text-xs text-charcoal/40">
                            {locale === 'ar' ? 'لا توجد إشعارات.' : 'No notifications yet.'}
                          </div>
                        ) : notifications.map((n) => (
                          <div
                            key={n.id}
                            className={clsx(
                              'px-4 py-3 font-sans text-xs transition-colors',
                              !n.is_read && 'bg-forest/[0.03] font-medium'
                            )}
                          >
                            <p className="text-charcoal/85 leading-relaxed mb-1">{n.message}</p>
                            <span className="text-[10px] text-charcoal/35">
                              {new Date(n.created_at).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <Link
              to="/"
              className="font-sans text-xs tracking-[0.2em] uppercase text-charcoal/60 hover:text-charcoal transition-colors duration-300"
            >
              Home
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="font-sans text-xs tracking-[0.2em] uppercase text-charcoal/60 hover:text-charcoal transition-colors duration-300"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-10 pt-28 pb-10">
        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-8 bg-white rounded-xl p-1 border border-charcoal/08 w-fit shadow-sm">
          {(['bookings', 'availability', 'portfolio'] as DashboardTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              className={clsx(
                'font-sans text-xs tracking-[0.15em] uppercase px-4 py-2.5 rounded-lg transition-all duration-300',
                activeTab === t
                  ? 'bg-forest text-cream shadow-sm'
                  : 'text-charcoal/50 hover:text-charcoal',
              )}
            >
              {t === 'bookings'
                ? `${d.bookings} (${pendingCount} ${d.pending.toLowerCase()})`
                : t === 'availability'
                  ? d.availability
                  : d.portfolio}
            </button>
          ))}
        </div>

        {/* ─── TAB: BOOKINGS ─── */}
        {activeTab === 'bookings' && (
          <div>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label={d.totalBookings} value={bookings.length} accent />
              <StatCard label={d.pendingApproval} value={pendingCount} />
              <StatCard label={d.baghdad} value={totalBaghdad} sub={d.bookings.toLowerCase()} />
              <StatCard label={d.erbil} value={totalErbil} sub={d.bookings.toLowerCase()} />
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {['all', 'pending', 'confirmed', 'approved'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setBookingFilter(f as any)}
                  className={clsx(
                    'font-sans text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-md border transition-all',
                    bookingFilter === f
                      ? 'bg-charcoal text-cream border-charcoal'
                      : 'bg-white text-charcoal/60 border-charcoal/15 hover:border-charcoal/30',
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
                     className="bg-white border border-charcoal/10 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6"
                  >
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className={clsx(
                            'font-sans text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 rounded',
                            b.type === 'full-day'
                              ? 'bg-forest/10 text-forest'
                              : 'bg-sage/15 text-forest/85',
                          )}
                        >
                          {b.type === 'full-day' ? d.fullDay : d.session}
                        </span>
                        <span
                          className={clsx(
                            'font-sans text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 rounded',
                            b.status === 'pending' && 'bg-yellow-100 text-yellow-800',
                            b.status === 'confirmed' && 'bg-blue-100 text-blue-800',
                            b.status === 'approved' && 'bg-green-100 text-green-800',
                          )}
                        >
                          {d[b.status as keyof typeof d] || b.status}
                        </span>
                        <span className="font-sans text-xs text-charcoal/40">
                          {d.bookedOn} {new Date(b.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                        <div>
                          <p className="font-sans text-[9px] tracking-wider text-charcoal/40 uppercase mb-0.5">
                            {d.customer}
                          </p>
                          <p className="font-serif text-lg text-charcoal">{b.customerInfo.fullName}</p>
                        </div>
                        <div>
                          <p className="font-sans text-[9px] tracking-wider text-charcoal/40 uppercase mb-0.5">
                            {d.phone}
                          </p>
                          <a href={`tel:${b.customerInfo.phone}`} className="font-sans text-sm text-forest underline">
                            {b.customerInfo.phone}
                          </a>
                        </div>
                        <div>
                          <p className="font-sans text-[9px] tracking-wider text-charcoal/40 uppercase mb-0.5">
                            {d.email}
                          </p>
                          <p className="font-sans text-sm text-charcoal">{b.customerInfo.email || '—'}</p>
                        </div>
                        <div>
                          <p className="font-sans text-[9px] tracking-wider text-charcoal/40 uppercase mb-0.5">
                            {d.cityPackage}
                          </p>
                          <p className="font-sans text-sm text-charcoal capitalize">
                            {d[b.city as keyof typeof d] || b.city} · {b.packageId ? (locale === 'ar' ? (b.packageId === 'essential' ? 'المجموعة الأساسية' : b.packageId === 'signature' ? 'المجموعة المميزة' : b.packageId === 'premium' ? 'المجموعة الفاخرة' : b.packageId === 'vip' ? 'مجموعة كبار الشخصيات' : 'المجموعة الملكية') : PACKAGE_NAMES[b.packageId] ?? b.packageId) : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="font-sans text-[9px] tracking-wider text-charcoal/40 uppercase mb-0.5">
                            {d.locationId}
                          </p>
                          <p className="font-sans text-sm text-charcoal">{b.location}</p>
                        </div>
                        <div>
                          <p className="font-sans text-[9px] tracking-wider text-charcoal/40 uppercase mb-0.5">
                            {d.targetDate}
                          </p>
                          <p className="font-sans text-sm text-forest font-semibold">{b.date}</p>
                        </div>
                      </div>

                      {b.customerInfo.notes && (
                        <div className="pt-2 border-t border-charcoal/05">
                          <p className="font-sans text-[9px] tracking-wider text-charcoal/40 uppercase mb-1">
                            {d.notes}
                          </p>
                          <p className="font-sans text-xs text-charcoal/70 bg-linen/40 p-3 rounded-lg leading-relaxed">
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

        {/* ─── TAB: PORTFOLIO MANAGEMENT ─── */}
        {activeTab === 'portfolio' && (
          <div className="space-y-10">
            {/* Create Category */}
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

            {/* Categories List & Image Upload */}
            <div className="space-y-6">
              {categories.map((cat) => {
                const catImages = portfolioImgs.filter((img) => img.category === cat.id)
                const isStatic = DEFAULT_CATEGORIES.some((c) => c.id === cat.id)

                return (
                  <div key={cat.id} className="bg-white border border-charcoal/10 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-start justify-between flex-wrap gap-4 border-b border-charcoal/06 pb-4">
                      {renamingCatId === cat.id ? (
                        <div className="flex gap-2 flex-wrap items-center">
                          <input
                            type="text"
                            value={renameNameEn}
                            onChange={(e) => setRenameNameEn(e.target.value)}
                            className="font-sans text-xs border border-charcoal/15 rounded px-2 py-1 outline-none"
                            placeholder="English"
                          />
                          <input
                            type="text"
                            value={renameNameAr}
                            onChange={(e) => setRenameNameAr(e.target.value)}
                            className="font-sans text-xs border border-charcoal/15 rounded px-2 py-1 outline-none text-right"
                            placeholder="العربية"
                          />
                          <button
                            type="button"
                            onClick={() => renameCategory(cat.id)}
                            className="font-sans text-[10px] uppercase text-forest hover:underline"
                          >
                            {d.save}
                          </button>
                          <button
                            type="button"
                            onClick={() => setRenamingCatId(null)}
                            className="font-sans text-[10px] uppercase text-charcoal/40 hover:underline"
                          >
                            {d.cancel}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-serif text-lg text-charcoal">{cat.name}</h3>
                            <span className="text-charcoal/20">|</span>
                            <span className="font-sans text-sm text-charcoal/60">{cat.nameAr}</span>
                            <span className="font-sans text-[10px] text-charcoal/30 font-bold uppercase tracking-wider">
                              ({cat.id})
                            </span>
                          </div>
                          <p className="font-sans text-xs text-charcoal/40 mt-0.5">
                            {catImages.length} {locale === 'ar' ? 'صور في هذا التصنيف' : 'images total in category'}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setRenamingCatId(cat.id)
                            setRenameNameEn(cat.name)
                            setRenameNameAr(cat.nameAr)
                          }}
                          className="font-sans text-[10px] uppercase text-forest hover:underline"
                        >
                          {d.rename}
                        </button>
                        <button
                          type="button"
                          disabled={catImages.length > 0}
                          onClick={() => deleteCategory(cat.id)}
                          className={clsx(
                            'font-sans text-[10px] uppercase',
                            catImages.length > 0
                              ? 'text-charcoal/20 cursor-not-allowed'
                              : 'text-red-500 hover:underline',
                          )}
                          title={catImages.length > 0 ? (locale === 'ar' ? 'لا يمكن حذف تصنيف يحتوي على صور' : 'Cannot delete category while it contains images') : ''}
                        >
                          {d.deleteCat}
                        </button>
                      </div>
                    </div>

                    {/* Multiple Image Upload Box */}
                    <div className="flex flex-col gap-3 bg-linen/25 p-4 rounded-xl border border-dashed border-charcoal/15">
                      <div className="flex items-center gap-4">
                        <label className="flex flex-col cursor-pointer">
                          <span className={clsx(
                            'font-sans text-xs tracking-wider uppercase px-4 py-2.5 rounded-lg transition',
                            uploadProgress !== null
                              ? 'bg-forest/40 text-cream cursor-not-allowed'
                              : 'bg-forest text-cream hover:bg-forest/85'
                          )}>
                            {uploadProgress !== null
                              ? `${locale === 'ar' ? 'جاري الرفع' : 'Uploading'} ${uploadProgress.current}/${uploadProgress.total}…`
                              : d.uploadImages}
                          </span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            disabled={uploadProgress !== null}
                            onChange={(e) => handleImageUpload(cat.id, e.target.files)}
                          />
                        </label>
                        <p className="font-sans text-[10px] text-charcoal/40">
                          {d.uploadDesc}
                        </p>
                      </div>
                      {uploadProgress !== null && (
                        <div className="w-full bg-charcoal/08 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            className="bg-forest h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Image Previews */}
                    {catImages.length === 0 ? (
                      <p className="font-sans text-xs text-charcoal/30 py-4 text-center">
                        {d.emptyCat}
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {catImages.map((img) => {
                          const src = img.id.startsWith('data:') || img.id.startsWith('blob:') || img.id.startsWith('http')
                            ? img.id
                            : `/images/portfolio/${img.id}-sm.webp`

                          return (
                            <div key={img.id} className="relative aspect-square group rounded-lg overflow-hidden border border-charcoal/06">
                              <img
                                src={src}
                                alt={img.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                <button
                                  type="button"
                                  onClick={() => deletePortfolioImage(img.id)}
                                  className="font-sans text-[9px] tracking-widest uppercase bg-red-600 text-cream px-2 py-1 rounded"
                                >
                                  {locale === 'ar' ? 'حذف' : 'Delete'}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Fully Booked Confirmation Dialog */}
      <AnimatePresence>
        {pendingFullyBookedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-charcoal/40 backdrop-blur-sm flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <line x1="9" y1="14" x2="15" y2="14" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl text-charcoal mb-2">
                  {locale === 'ar' ? 'تأكيد القفل الكامل' : 'Mark as Fully Booked?'}
                </h3>
                <p className="font-sans text-sm text-charcoal/55 leading-relaxed">
                  {locale === 'ar'
                    ? `هل أنت متأكد من قفل يوم ${pendingFullyBookedDate} بالكامل؟ لن يتمكن أي عميل من الحجز في هذا اليوم.`
                    : `Mark ${pendingFullyBookedDate} as Fully Booked? Clients will not be able to book this date.`}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPendingFullyBookedDate(null)}
                  className="flex-1 font-sans text-sm border border-charcoal/20 text-charcoal/60 rounded-xl py-3 hover:bg-charcoal/05 transition"
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => confirmFullyBooked(pendingFullyBookedDate)}
                  className="flex-1 font-sans text-sm bg-red-600 text-white rounded-xl py-3 hover:bg-red-700 transition"
                >
                  {locale === 'ar' ? 'نعم، قفل اليوم' : 'Yes, Mark Fully Booked'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[70] flex flex-col gap-2 items-end pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={clsx(
                'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg font-sans text-sm max-w-xs',
                toast.type === 'success'
                  ? 'bg-charcoal text-cream'
                  : 'bg-red-600 text-white'
              )}
            >
              {toast.type === 'success' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
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
