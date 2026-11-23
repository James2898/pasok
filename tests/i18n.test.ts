import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  dictionaries,
  getDictionary,
  isLocale,
  LOCALE_COOKIE_NAME,
} from "@/lib/i18n/dictionaries";

describe("lib/i18n — Bilingual dictionaries & cookie defaults", () => {
  it("defaults to Filipino ('fil') and uses 'pasok_lang' cookie", () => {
    expect(DEFAULT_LOCALE).toBe("fil");
    expect(LOCALE_COOKIE_NAME).toBe("pasok_lang");
    expect(isLocale("fil")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("es")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("provides matching keys across Filipino and English dictionaries, including Grill Q4.6 privacy wording", () => {
    const fil = getDictionary("fil");
    const en = getDictionary("en");

    expect(Object.keys(fil.dayTypes)).toEqual(Object.keys(en.dayTypes));
    expect(Object.keys(fil.dayStates)).toEqual(Object.keys(en.dayStates));
    expect(Object.keys(fil.absenceReasons)).toEqual(
      Object.keys(en.absenceReasons)
    );

    // Grill Q4.6: "within about 30 days after the class is closed" + "when the link was opened"
    expect(en.parentNotice.howLongText).toContain(
      "within about 30 days after the class is closed"
    );
    expect(en.parentNotice.whatWeStoreText).toContain(
      "when the personal link was opened"
    );
    expect(fil.parentNotice.howLongText).toContain("30 araw");
    expect(fil.parentNotice.whatWeStoreText).toContain(
      "kung kailan binuksan ang personal na link"
    );

    // Fallback to Filipino when called with default
    expect(getDictionary()).toBe(dictionaries.fil);
  });
});
