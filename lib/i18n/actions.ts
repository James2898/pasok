"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE_NAME,
  type Locale,
} from "./dictionaries";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Server Action that saves the user's chosen language (`fil` or `en`) in a
 * durable cookie (`pasok_lang`) per Grill Q1.5 and revalidates the current layout.
 */
export async function setLocaleAction(formData: FormData): Promise<void> {
  const requested = formData.get("locale");
  const nextLocale: Locale = isLocale(requested) ? requested : DEFAULT_LOCALE;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, nextLocale, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });

  revalidatePath("/", "layout");
}
