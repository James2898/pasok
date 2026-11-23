import "server-only";

/**
 * Phase 0 skeleton for `lib/export`.
 * Phase 6 implements CSV, PDF, and DOCX monthly attendance exports
 * in the exporter's selected UI language (Filipino or English) with
 * Asia/Manila timestamps and "Unconfirmed" labels on unlocked days.
 */
export type ExportFormat = "csv" | "pdf" | "docx";
