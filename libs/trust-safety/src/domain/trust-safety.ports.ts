import type { Dispute } from './trust-safety.types';

export interface DisputeRepository {
  findById(id: string): Promise<Dispute | null>;
  findBySession(sessionId: string): Promise<Dispute | null>;
  save(dispute: Dispute): Promise<void>;
}
