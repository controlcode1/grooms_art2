export interface Dictionary {
  meta: {
    siteName: string
    tagline: string
  }
  nav: {
    home: string
    portfolio: string
    fullDay: string
    sessions: string
    about: string
    book: string
    menu: string
    close: string
  }
  home: {
    heroEyebrow: string
    heroTitle: string
    heroSubtitle: string
    heroCta: string
    heroSecondaryCta: string
    introEyebrow: string
    introTitle: string
    introBody: string
    previewEyebrow: string
    previewTitle: string
    previewCta: string
    testimonialsEyebrow: string
    testimonialsTitle: string
    footerFeedbackEyebrow: string
    footerCtaTitle: string
    footerCtaBody: string
    footerCtaButton: string
  }
  portfolio: {
    eyebrow: string
    title: string
    subtitle: string
    filters: {
      all: string
      wedding: string
      portrait: string
      fullDay: string
      cinematic: string
    }
    loadMore: string
    emptyTitle: string
    emptyBody: string
    backToPortfolio: string
    exif: string
  }
  fullDay: {
    eyebrow: string
    title: string
    subtitle: string
    chapters: {
      morning: string
      ceremony: string
      portraits: string
      golden: string
      evening: string
    }
    cinematicTitle: string
    cinematicBody: string
    packagesEyebrow: string
    packagesTitle: string
    selectCta: string
    selected: string
    confirmTitle: string
    confirmBody: string
    confirmButton: string
    bookingSuccessTitle: string
    bookingSuccessBody: string
  }
  about: {
    eyebrow: string
    title: string
    intro: string
    philosophyTitle: string
    philosophyBody: string
    equipmentTitle: string
    equipmentBody: string
    teamTitle: string
  }
  booking: {
    eyebrow: string
    title: string
    subtitle: string
    steps: {
      package: string
      date: string
      addons: string
      deposit: string
    }
    package: {
      title: string
      selectCta: string
      selected: string
    }
    date: {
      title: string
      helper: string
      available: string
      limited: string
      unavailable: string
    }
    addons: {
      title: string
      skip: string
    }
    deposit: {
      title: string
      body: string
      button: string
    }
    back: string
    continue: string
    successTitle: string
    successBody: string
    errorTitle: string
    errorBody: string
    retry: string
  }
  customerInfo: {
    title: string
    subtitle: string
    fullName: string
    fullNamePlaceholder: string
    phone: string
    phonePlaceholder: string
    email: string
    emailPlaceholder: string
    notes: string
    notesPlaceholder: string
    required: string
    optional: string
  }
  sessions: {
    eyebrow: string
    title: string
    selectCity: string
    cities: {
      baghdad: string
      erbil: string
    }
    packageTitle: string
    mostPopular: string
    locationTitle: string
    dateTitle: string
    dateHelper: string
    available: string
    booked: string
    back: string
    continue: string
    confirmTitle: string
    confirmBody: string
    confirmButton: string
    successTitle: string
    successBody: string
  }
  footer: {
    studio: string
    navigate: string
    connect: string
    rights: string
    craftedBy: string
  }
  common: {
    loading: string
    retry: string
    close: string
    next: string
    previous: string
  }
}
