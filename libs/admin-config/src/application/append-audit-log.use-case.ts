import type { AuditLogRepository } from '../domain/admin-config.ports';
import type { AuditLogEntry } from '../domain/admin-config.types';

export function makeAppendAuditLog(deps: { logs: AuditLogRepository }) {
  return async function appendAuditLog(entry: AuditLogEntry): Promise<void> {
    await deps.logs.append(entry);
  };
}
