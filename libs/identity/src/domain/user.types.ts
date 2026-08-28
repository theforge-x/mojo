export type Role = 'admin' | 'tutor' | 'student';

export interface User {
  readonly id: string;
  readonly email: string;
  readonly role: Role;
  readonly passwordHash: string;
  readonly timezone: string;
  readonly locale: string;
  readonly suspendedAt: string | null;
  readonly createdAt: string;
}

export interface Session {
  readonly token: string;
  readonly userId: string;
  readonly expiresAt: string;
}
