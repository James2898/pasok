import { describe, expect, it } from "vitest";
import {
  formatManilaSchoolDate,
  formatManilaTimestamp,
  getManilaToday,
  getWeekdayIndex,
  isSchoolWeekday,
  isWeekend,
  parseSchoolDate,
  toManilaDateString,
} from "@/lib/time";

describe("lib/time — Asia/Manila date & time helpers", () => {
  it("computes Manila calendar date across the UTC/Manila midnight boundary (UTC+8)", () => {
    // 2026-11-21 16:00:00 UTC is exactly 2026-11-22 00:00:00 in Asia/Manila
    const justAtManilaMidnight = new Date("2026-11-21T16:00:00.000Z");
    expect(toManilaDateString(justAtManilaMidnight)).toBe("2026-11-22");
    expect(getManilaToday(justAtManilaMidnight)).toBe("2026-11-22");

    // 1 second earlier: 2026-11-21 15:59:59 UTC is 2026-11-21 23:59:59 in Asia/Manila
    const oneSecondBeforeManilaMidnight = new Date("2026-11-21T15:59:59.000Z");
    expect(toManilaDateString(oneSecondBeforeManilaMidnight)).toBe("2026-11-21");
  });

  it("identifies Monday–Friday school weekdays vs Saturday/Sunday weekends", () => {
    // 2026-11-20 = Friday, 2026-11-21 = Saturday, 2026-11-22 = Sunday, 2026-11-23 = Monday
    expect(getWeekdayIndex("2026-11-20")).toBe(5);
    expect(isSchoolWeekday("2026-11-20")).toBe(true);
    expect(isWeekend("2026-11-20")).toBe(false);

    expect(getWeekdayIndex("2026-11-21")).toBe(6);
    expect(isSchoolWeekday("2026-11-21")).toBe(false);
    expect(isWeekend("2026-11-21")).toBe(true);

    expect(getWeekdayIndex("2026-11-22")).toBe(0);
    expect(isSchoolWeekday("2026-11-22")).toBe(false);
    expect(isWeekend("2026-11-22")).toBe(true);

    expect(getWeekdayIndex("2026-11-23")).toBe(1);
    expect(isSchoolWeekday("2026-11-23")).toBe(true);
    expect(isWeekend("2026-11-23")).toBe(false);
  });

  it("rejects malformed or impossible calendar dates", () => {
    expect(() => parseSchoolDate("2026/11/22")).toThrow();
    expect(() => parseSchoolDate("2026-02-30")).toThrow();
    expect(() => parseSchoolDate("2026-13-01")).toThrow();
  });

  it("formats school dates and timestamps in Asia/Manila for both fil and en", () => {
    const formattedEn = formatManilaSchoolDate("2026-06-08", "en");
    const formattedFil = formatManilaSchoolDate("2026-06-08", "fil");
    expect(formattedEn).toContain("2026");
    expect(formattedFil).toContain("2026");

    const ts = formatManilaTimestamp("2026-11-21T16:30:00.000Z", "en");
    // 16:30 UTC on Nov 21 is Nov 22, 12:30 AM in Manila
    expect(ts).toContain("22");
  });
});
