/**
 * Zero-dependency bilingual dictionary (Filipino default, English switch)
 * per PBI Language section & Grill Q1.5 / Q4.6.
 */

export const SUPPORTED_LOCALES = ["fil", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fil";
export const LOCALE_COOKIE_NAME = "pasok_lang";

export function isLocale(value: unknown): value is Locale {
  return value === "fil" || value === "en";
}

export interface Dictionary {
  appName: string;
  tagline: string;
  languageSwitch: {
    label: string;
    filipino: string;
    english: string;
    currentLanguageBadge: string;
  };
  roles: {
    teacher: string;
    secretary: string;
    parent: string;
  };
  dayTypes: {
    whole_day: string;
    early_dismissal: string;
    half_day: string;
    suspended_weather: string;
    suspended_other: string;
    holiday: string;
    school_event: string;
    other_no_class: string;
  };
  dayStates: {
    not_recorded: string;
    submitted: string;
    locked: string;
    unconfirmedBadge: string;
  };
  absenceReasons: {
    sick: string;
    family_matter: string;
    excused: string;
    school_activity: string;
    not_stated: string;
  };
  noteHint: string;
  parentNotice: {
    genericPageTitle: string;
    bannerTitle: string;
    bannerBody: string;
    wrongEntryHint: string;
    privacyTitle: string;
    whatWeStoreLabel: string;
    whatWeStoreText: string;
    whyLabel: string;
    whyText: string;
    whoSeesItLabel: string;
    whoSeesItText: string;
    whatWeDontDoLabel: string;
    whatWeDontDoText: string;
    howLongLabel: string;
    howLongText: string;
    yourChoicesLabel: string;
    yourChoicesText: string;
  };
  home: {
    phase0Badge: string;
    manilaTodayLabel: string;
    quickLinksTitle: string;
    teacherPortal: string;
    secretarySheet: string;
    parentDemoPreview: string;
    privacyPreviewTitle: string;
    dayTypesPreviewTitle: string;
    absenceReasonsPreviewTitle: string;
  };
}

export const dictionaries: Record<Locale, Dictionary> = {
  fil: {
    appName: "Pasok",
    tagline: "Pantulong sa pagtatala ng pagdalo sa advisory class",
    languageSwitch: {
      label: "Wika",
      filipino: "Filipino",
      english: "English",
      currentLanguageBadge: "Kasalukuyang wika: Filipino (Default)",
    },
    roles: {
      teacher: "Guro (Adviser)",
      secretary: "Class Secretary",
      parent: "Magulang o Tagapag-alaga",
    },
    dayTypes: {
      whole_day: "Buong araw",
      early_dismissal: "Maagang uwian",
      half_day: "Kalahating araw",
      suspended_weather: "Suspendido: panahon",
      suspended_other: "Suspendido: iba pang dahilan",
      holiday: "Holiday (Walang pasok)",
      school_event: "Gawain o okasyon sa paaralan",
      other_no_class: "Iba pang araw na walang klase",
    },
    dayStates: {
      not_recorded: "Hindi pa naitatala",
      submitted: "Naisumite (Hindi pa kumpirmado)",
      locked: "Kumpirmado ng guro",
      unconfirmedBadge: "Hindi pa kumpirmado",
    },
    absenceReasons: {
      sick: "May sakit",
      family_matter: "Usaping pampamilya",
      excused: "Pinayagan (nagpaalam ang magulang sa guro)",
      school_activity: "Gawain sa paaralan",
      not_stated: "Hindi binanggit ang dahilan",
    },
    noteHint: "Panatilihing maikli at batay sa katotohanan (hanggang 150 karakter).",
    parentNotice: {
      genericPageTitle: "Pasok — Talaan ng Pagdalo sa Klase",
      bannerTitle: "Hindi opisyal na kasangkapan sa klase.",
      bannerBody:
        "Ang pahinang ito ay pantulong para sa advisory class. Hindi ito ang opisyal na talaan ng pagdalo ng paaralan. Ang class secretary ang nagtatala ng mga entry at maaaring hindi pa ito kumpirmado ng guro, kaya maaaring may pagkakamali.",
      wrongEntryHint: "May maling entry? Magmensahe sa inyong adviser.",
      privacyTitle: "Abiso sa Pagkapribado (Privacy Notice)",
      whatWeStoreLabel: "Ano ang iniimbak:",
      whatWeStoreText:
        "ang pangalan ng inyong anak, araw-araw na pagdalo, mga dahilan ng pagliban at maikling tala, mga uri ng araw tulad ng suspensyon, at kung kailan binuksan ang personal na link (walang IP address o device ng magulang). Para sa mga guro at secretary: Google email, pangalan, at talaan ng kanilang mga pagbabago kasama ang oras, IP address, at device.",
      whyLabel: "Bakit:",
      whyText:
        "upang makita ng mga magulang kung pumapasok ang kanilang anak, at upang masagot ng adviser ang mga tanong.",
      whoSeesItLabel: "Sino ang nakakakita:",
      whoSeesItText:
        "ang adviser at ang class secretary ang nakakakita ng talaan ng klase. Ang sinumang may personal na link ng inyong anak ay makakakita lamang ng talaan ng batang iyon, kaya pakiingatan ang link at huwag itong ibahagi. Ang taong nangangasiwa ng sistemang ito ay maaaring teknikal na makapasok sa nakaimbak na datos para sa maintenance, at hindi niya ito tinitingnan.",
      whatWeDontDoLabel: "Ang hindi namin gagawin:",
      whatWeDontDoText:
        "ibenta ang inyong datos, magpakita ng mga ad, o ibahagi ito sa sinuman sa labas ng klase. Nakaimbak ito sa aming mga hosting provider para lamang mapatakbo ang tool na ito.",
      howLongLabel: "Gaano katagal:",
      howLongText:
        "sa loob ng humigit-kumulang 30 araw matapos isara ang klase, permanenteng buburahin ang klase at lahat ng talaan nito.",
      yourChoicesLabel: "Ang inyong mga pagpipilian:",
      yourChoicesText:
        "makipag-ugnayan sa inyong adviser upang ipawasto o ipabura ang talaan ng inyong anak, o upang palitan ang inyong link kung ito ay nawala o naibahagi.",
    },
    home: {
      phase0Badge: "Phase 0: Pundasyon (Foundation)",
      manilaTodayLabel: "Petsa ngayon sa Pilipinas (Asia/Manila):",
      quickLinksTitle: "Mga Pahina ng Sistema",
      teacherPortal: "Dashboard ng Guro (/teacher)",
      secretarySheet: "Talaan ng Secretary (/secretary)",
      parentDemoPreview: "Halimbawang Link ng Magulang (/s/[token])",
      privacyPreviewTitle: "Paunawa sa Magulang at Abiso sa Pagkapribado",
      dayTypesPreviewTitle: "Mga Uri ng Araw (Day Types)",
      absenceReasonsPreviewTitle: "Mga Dahilan ng Pagliban (Absence Reasons)",
    },
  },
  en: {
    appName: "Pasok",
    tagline: "Advisory class attendance helper tool",
    languageSwitch: {
      label: "Language",
      filipino: "Filipino",
      english: "English",
      currentLanguageBadge: "Current language: English",
    },
    roles: {
      teacher: "Teacher (Adviser)",
      secretary: "Class Secretary",
      parent: "Parent or Guardian",
    },
    dayTypes: {
      whole_day: "Whole day",
      early_dismissal: "Early dismissal",
      half_day: "Half day",
      suspended_weather: "Suspended: weather",
      suspended_other: "Suspended: other",
      holiday: "Holiday",
      school_event: "School event or activity",
      other_no_class: "Other no-class day",
    },
    dayStates: {
      not_recorded: "Not yet recorded",
      submitted: "Submitted (Unconfirmed)",
      locked: "Confirmed by teacher",
      unconfirmedBadge: "Unconfirmed",
    },
    absenceReasons: {
      sick: "Sick",
      family_matter: "Family matter",
      excused: "Excused (parent informed teacher)",
      school_activity: "School activity",
      not_stated: "Reason not stated",
    },
    noteHint: "Keep it short and factual (up to 150 characters).",
    parentNotice: {
      genericPageTitle: "Pasok — Class Attendance Record",
      bannerTitle: "Unofficial classroom tool.",
      bannerBody:
        "This page is a helper for the advisory class. It is not the school’s official attendance record. Entries are recorded by the class secretary and may be unconfirmed until the teacher confirms them, so mistakes are possible.",
      wrongEntryHint: "Wrong entry? Message your adviser.",
      privacyTitle: "Privacy Notice",
      whatWeStoreLabel: "What we store:",
      whatWeStoreText:
        "your child’s name, daily attendance, absence reasons and short notes, day types such as suspensions, and when the personal link was opened (no parent IP address or device is recorded). For teachers and secretaries: Google email, name, and a log of their changes with time, IP address and device.",
      whyLabel: "Why:",
      whyText:
        "so parents can see whether their child is in school, and so the adviser can answer questions.",
      whoSeesItLabel: "Who sees it:",
      whoSeesItText:
        "the adviser and the class secretary see the class record. Anyone with your child’s personal link sees that child’s record only, so please keep the link private and do not share it. The person who maintains this system can technically access stored data for maintenance and does not browse it.",
      whatWeDontDoLabel: "What we don’t do:",
      whatWeDontDoText:
        "sell your data, show ads, or share it with anyone outside the class. It is stored with our hosting providers only to run this tool.",
      howLongLabel: "How long:",
      howLongText:
        "within about 30 days after the class is closed, the class and all its records are permanently deleted.",
      yourChoicesLabel: "Your choices:",
      yourChoicesText:
        "ask your adviser to correct or remove your child’s record, or to replace your link if it was lost or shared.",
    },
    home: {
      phase0Badge: "Phase 0: Foundation",
      manilaTodayLabel: "Today in the Philippines (Asia/Manila):",
      quickLinksTitle: "System Routes",
      teacherPortal: "Teacher Dashboard (/teacher)",
      secretarySheet: "Secretary Daily Sheet (/secretary)",
      parentDemoPreview: "Sample Parent Link (/s/[token])",
      privacyPreviewTitle: "Parent Banner & Privacy Notice",
      dayTypesPreviewTitle: "Day Types",
      absenceReasonsPreviewTitle: "Preset Absence Reasons",
    },
  },
};

export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}
