import { setLocaleAction, type Dictionary, type Locale } from "@/lib/i18n";

interface LanguageToggleProps {
  currentLocale: Locale;
  labels: Dictionary["languageSwitch"];
}

export function LanguageToggle({
  currentLocale,
  labels,
}: LanguageToggleProps) {
  return (
    <form
      action={setLocaleAction}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white p-1 text-xs font-medium shadow-xs"
      aria-label={labels.label}
    >
      <span className="px-2 text-slate-600">{labels.label}:</span>
      <button
        type="submit"
        name="locale"
        value="fil"
        aria-pressed={currentLocale === "fil"}
        className={`rounded-full px-3 py-1 transition-colors ${
          currentLocale === "fil"
            ? "bg-slate-900 text-white"
            : "text-slate-700 hover:bg-slate-100"
        }`}
      >
        {labels.filipino}
      </button>
      <button
        type="submit"
        name="locale"
        value="en"
        aria-pressed={currentLocale === "en"}
        className={`rounded-full px-3 py-1 transition-colors ${
          currentLocale === "en"
            ? "bg-slate-900 text-white"
            : "text-slate-700 hover:bg-slate-100"
        }`}
      >
        {labels.english}
      </button>
    </form>
  );
}
