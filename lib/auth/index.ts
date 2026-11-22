import "server-only";
import type { ClassContext, MemberRole } from "@/lib/data";

/**
 * Phase 0 skeleton for `lib/auth`.
 * Phase 1 implements Google OAuth sign-in, invite claiming, the "before user created"
 * auth hook, and live session verification against `class_members`.
 */
export function createVerifiedClassContext(params: {
  classId: string;
  actorUserId: string;
  actorEmail: string;
  actorName?: string | null;
  actorRole: MemberRole;
  ip?: string | null;
  userAgent?: string | null;
}): ClassContext {
  return {
    __brand: "VerifiedClassContext",
    classId: params.classId,
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail.trim().toLowerCase(),
    actorName: params.actorName ?? null,
    actorRole: params.actorRole,
    ip: params.ip ?? null,
    userAgent: params.userAgent ?? null,
  };
}
