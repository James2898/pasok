import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  getDictionary,
  isLocale,
  LOCALE_COOKIE_NAME,
  type Dictionary,
  type Locale,
} from "./dictionaries";

/**
 * Reads the active locale from the `pasok_lang` cookie on the server.
 * Defaults to Filipino (`fil`) when no valid cookie is present.
 */
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

/**
 * Returns both the resolved locale and its typed dictionary for Server Components.
 */
export async function getServerI18n(): Promise<{
  locale: Locale;
  t: Dictionary;
}> {
  const locale = await getServerLocale();
  return {
    locale,
    t: getDictionary(locale),
  };
}
