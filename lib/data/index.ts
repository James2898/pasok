import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Single server-side data-access module for all student and class reads/writes.
 * - Marked `server-only` so importing it from a client component is a build error.
 * - All staff operations require a verified `ClassContext` (produced by `lib/auth`),
 *   preventing accidental cross-class queries when using the service role key.
 * - Future AES-256-GCM field-level encryption (v2) hooks into this module alone.
 */

export type MemberRole = "teacher" | "secretary";

export type DayType =
  | "whole_day"
  | "early_dismissal"
  | "half_day"
  | "suspended_weather"
  | "suspended_other"
  | "holiday"
  | "school_event"
  | "other_no_class";

export type DayState = "not_recorded" | "submitted" | "locked";

export type AbsenceReason =
  | "sick"
  | "family_matter"
  | "excused"
  | "school_activity"
  | "not_stated";

/**
 * Verified class membership context required by all staff data operations.
 */
export interface ClassContext {
  readonly __brand: "VerifiedClassContext";
  readonly classId: string;
  readonly actorUserId: string;
  readonly actorEmail: string;
  readonly actorName: string | null;
  readonly actorRole: MemberRole;
  readonly ip: string | null;
  readonly userAgent: string | null;
}

/**
 * Hashes a raw student personal link token with SHA-256 (hex) for database lookup/storage.
 * The raw token is never persisted in the database or logs.
 */
export function hashStudentLinkToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

/**
 * Generates a high-entropy (256-bit / 43-char base64url) student personal link token
 * alongside its SHA-256 hex hash.
 */
export function generateStudentLinkToken(): {
  rawToken: string;
  tokenHash: string;
} {
  const rawToken = randomBytes(32).toString("base64url");
  return {
    rawToken,
    tokenHash: hashStudentLinkToken(rawToken),
  };
}

/**
 * Creates a server-only Supabase client authenticated with the `service_role` key.
 */
export function getServiceRoleClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY server environment variables."
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
