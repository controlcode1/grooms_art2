import { SharedBookingWizard } from '@/features/booking/SharedBookingWizard'
import { SessionPackageStep } from './components/SessionPackageStep'
import { useI18n } from '@/lib/i18n'

const PACKAGE_NAMES: Record<string, string> = {
  essential: 'Essential',
  signature: 'Signature',
  premium: 'Premium',
}

export function SessionsWizard() {
  const { t } = useI18n()

  return (
    <SharedBookingWizard
      type="session"
      packageNames={PACKAGE_NAMES}
      successTitle={t.sessions.successTitle}
      successBody={t.sessions.successBody}
      renderPackageStep={(city, selected, onSelect) => (
        <SessionPackageStep city={city} selected={selected} onSelect={onSelect} />
      )}
    />
  )
}
