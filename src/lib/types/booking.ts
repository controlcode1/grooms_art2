/**
 * Canonical booking types shared across the booking wizard and dashboard.
 *
 * Keeping types in one place means both the front-end wizard and the dashboard
 * always agree on the shape of a stored booking — no mismatch risk.
 */

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'approved'
export type BookingType = 'session' | 'full-day'

export interface BookingCustomerInfo {
  fullName: string
  phone: string
  email: string   // optional — may be empty string
  notes: string   // optional — may be empty string
}

export interface Booking {
  id: string
  type: BookingType
  status: BookingStatus
  city: string           // 'baghdad' | 'erbil'
  packageId: string      // session: 'essential'|'signature'|'premium' / full-day: 'vip'|'royal'
  location: string       // location id from LOCATIONS data
  date: string           // 'YYYY-MM-DD'
  customerInfo: BookingCustomerInfo
  createdAt: string      // ISO timestamp

  /**
   * Stub hook for WhatsApp confirmation.
   *
   * When set, this flag signals that a WhatsApp message should be triggered
   * upon approval. Future implementation: pass this booking to a WhatsApp
   * Business API call or a webhook.
   *
   * Currently a no-op — only the field is stored.
   */
  whatsappTriggered?: boolean

  /**
   * Indicates whether an upcoming reminder was sent via WhatsApp.
   */
  reminderSent?: boolean
}

/**
 * Stub: called when the photographer approves a booking.
 *
 * Replace the body of this function with a real WhatsApp Business API call,
 * a webhook, or a Twilio request when you're ready to integrate messaging.
 */
export function triggerWhatsApp(booking: Booking): void {
  // TODO: integrate WhatsApp Business API or Twilio here.
  // The booking object contains everything needed:
  //   booking.customerInfo.phone  — recipient number
  //   booking.customerInfo.fullName, booking.date, booking.packageId
  console.info('[WhatsApp stub] Would send confirmation to:', booking.customerInfo.phone, {
    name: booking.customerInfo.fullName,
    date: booking.date,
    package: booking.packageId,
    city: booking.city,
  })
}
