import Link from "next/link";
import { LanguageToggle } from "@/app/components/language-toggle";
import { getServerI18n } from "@/lib/i18n";
import { formatManilaSchoolDate, getManilaToday } from "@/lib/time";

export default async function HomePage() {
  const { locale, t } = await getServerI18n();
  const manilaToday = getManilaToday();
  const formattedToday = formatManilaSchoolDate(manilaToday, locale);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {t.appName}
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
              {t.home.phase0Badge}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-600">{t.tagline}</p>
        </div>
        <LanguageToggle currentLocale={locale} labels={t.languageSwitch} />
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {t.languageSwitch.currentLanguageBadge}
        </p>
        <p className="mt-2 text-sm text-slate-800">
          <span className="font-medium">{t.home.manilaTodayLabel}</span>{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
            {manilaToday}
          </code>{" "}
          ({formattedToday})
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-900">
          {t.home.quickLinksTitle}
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Link
            href="/teacher"
            className="rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            {t.home.teacherPortal}
          </Link>
          <Link
            href="/secretary"
            className="rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            {t.home.secretarySheet}
          </Link>
          <Link
            href="/s/demo-token-student-01-pasok-2026"
            className="rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            {t.home.parentDemoPreview}
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <h2 className="text-sm font-semibold text-slate-900">
            {t.home.dayTypesPreviewTitle}
          </h2>
          <ul className="mt-2 space-y-1 text-xs text-slate-700">
            {Object.entries(t.dayTypes).map(([key, label]) => (
              <li key={key} className="flex items-center justify-between gap-2">
                <span>{label}</span>
                <code className="text-[11px] text-slate-400">{key}</code>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <h2 className="text-sm font-semibold text-slate-900">
            {t.home.absenceReasonsPreviewTitle}
          </h2>
          <ul className="mt-2 space-y-1 text-xs text-slate-700">
            {Object.entries(t.absenceReasons).map(([key, label]) => (
              <li key={key} className="flex items-center justify-between gap-2">
                <span>{label}</span>
                <code className="text-[11px] text-slate-400">{key}</code>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
            {t.noteHint}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-slate-800">
        <p className="font-semibold text-amber-950">
          {t.parentNotice.bannerTitle}
        </p>
        <p className="mt-1 text-amber-900">{t.parentNotice.bannerBody}</p>
        <p className="mt-2 font-medium text-amber-950">
          {t.parentNotice.wrongEntryHint}
        </p>
        <details className="mt-3 rounded-lg border border-amber-200/80 bg-white p-3">
          <summary className="cursor-pointer font-semibold text-slate-900">
            {t.parentNotice.privacyTitle}
          </summary>
          <ul className="mt-2 space-y-1.5 text-slate-700">
            <li>
              <strong>{t.parentNotice.whatWeStoreLabel}</strong>{" "}
              {t.parentNotice.whatWeStoreText}
            </li>
            <li>
              <strong>{t.parentNotice.whyLabel}</strong>{" "}
              {t.parentNotice.whyText}
            </li>
            <li>
              <strong>{t.parentNotice.whoSeesItLabel}</strong>{" "}
              {t.parentNotice.whoSeesItText}
            </li>
            <li>
              <strong>{t.parentNotice.whatWeDontDoLabel}</strong>{" "}
              {t.parentNotice.whatWeDontDoText}
            </li>
            <li>
              <strong>{t.parentNotice.howLongLabel}</strong>{" "}
              {t.parentNotice.howLongText}
            </li>
            <li>
              <strong>{t.parentNotice.yourChoicesLabel}</strong>{" "}
              {t.parentNotice.yourChoicesText}
            </li>
          </ul>
        </details>
      </section>
    </main>
  );
}
