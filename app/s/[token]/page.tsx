import type { Metadata } from "next";
import Link from "next/link";
import { LanguageToggle } from "@/app/components/language-toggle";
import { getServerI18n } from "@/lib/i18n";

/**
 * AC15: Generic page title so Messenger link previews never reveal the child's name.
 */
export const metadata: Metadata = {
  title: "Pasok — Talaan ng Pagdalo sa Klase",
  referrer: "no-referrer",
};

export default async function ParentTokenPage() {
  const { locale, t } = await getServerI18n();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {t.parentNotice.genericPageTitle}
          </h1>
          <p className="text-xs text-slate-500">{t.roles.parent}</p>
        </div>
        <LanguageToggle currentLocale={locale} labels={t.languageSwitch} />
      </header>

      <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-slate-800">
        <p className="font-semibold text-amber-950">
          {t.parentNotice.bannerTitle}
        </p>
        <p className="mt-1 text-amber-900">{t.parentNotice.bannerBody}</p>
        <p className="mt-2 font-medium text-amber-950">
          {t.parentNotice.wrongEntryHint}
        </p>
      </section>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <Link href="/" className="font-medium text-slate-900 underline">
          ← {t.appName}
        </Link>
      </div>
    </main>
  );
}
