import { prisma } from "../prisma.js";

export interface AuditLogEntry {
  organizationId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Write a structured audit log entry to the database and console.
 * Fire-and-forget safe: errors are swallowed so logging never breaks the request.
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  const logData = {
    timestamp: new Date().toISOString(),
    event: entry.action,
    level: "info",
    orgId: entry.organizationId,
    userId: entry.actorUserId ?? null,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    data: entry.metadata ?? null,
  };

  console.log(JSON.stringify(logData));

  try {
    await prisma.auditLog.create({
      data: {
        organizationId: entry.organizationId,
        actorUserId: entry.actorUserId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        description: entry.description ?? null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

/**
 * Fire-and-forget wrapper. Call from routes without awaiting.
 */
export function audit(entry: AuditLogEntry): void {
  writeAuditLog(entry).catch(console.error);
}
