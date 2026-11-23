import Link from "next/link";
import { LanguageToggle } from "@/app/components/language-toggle";
import { getServerI18n } from "@/lib/i18n";

export default async function SecretaryPage() {
  const { locale, t } = await getServerI18n();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {t.roles.secretary}
          </h1>
          <p className="text-xs text-slate-500">{t.home.phase0Badge}</p>
        </div>
        <LanguageToggle currentLocale={locale} labels={t.languageSwitch} />
      </header>
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <Link href="/" className="font-medium text-slate-900 underline">
          ← {t.appName}
        </Link>
      </div>
    </main>
  );
}
