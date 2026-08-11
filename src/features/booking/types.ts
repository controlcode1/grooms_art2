export type BookingStep = 'package' | 'date' | 'addons' | 'deposit'

export interface BookingState {
  packageId: string | null
  date: string | null // ISO yyyy-mm-dd
  addonIds: string[]
}

export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'
