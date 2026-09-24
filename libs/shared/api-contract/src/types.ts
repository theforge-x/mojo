/**
 * Shared HTTP contract between `apps/hub` (server) and `apps/mobile`
 * (Expo client). Single source of truth for route paths, `{ok,…}`
 * envelopes, and deep-link parsing — so a hub route change that breaks
 * mobile fails here (types + specs) instead of silently at runtime.
 *
 * Pure TypeScript only: no DOM, no Node, no React Native imports, so the
 * same file typechecks under Next, Vitest, and Metro/Hermes.
 */

export type Role = 'student' | 'tutor' | 'admin';

export interface ContractUser {
  readonly id: string;
  readonly email: string;
  readonly role: Role;
}

export type ApiResponse<T> = { readonly ok: true } & T | { readonly ok: false; readonly error: string };

export function isOk<T>(response: ApiResponse<T>): response is { readonly ok: true } & T {
  return response.ok === true;
}

/** Short-lived LiveKit credentials minted per participant. */
export interface LabAccess {
  readonly roomName: string;
  readonly serverUrl: string;
  readonly participantToken: string;
  readonly expiresAt: string;
}

export interface PushDevice {
  readonly userId: string;
  readonly token: string;
  readonly platform: 'ios' | 'android';
  readonly createdAt: string;
}

export type NotificationChannel = 'email' | 'whatsapp' | 'push';

export interface NotificationPreferences {
  readonly channels: readonly NotificationChannel[];
}

/** Minimal settled-charge shape the verify endpoint returns. */
export interface SettledCharge {
  readonly reference: string;
  readonly status: string;
  readonly amountMinor: number;
  readonly currency: string;
}

/** Minimal session shape the mobile home screen renders. */
export interface SessionSummary {
  readonly id: string;
  readonly tutorId: string;
  readonly studentId: string;
  readonly startIso: string;
  readonly endIso: string;
  readonly status: string;
  readonly isTrial: boolean;
  /** Group lab membership — null for one-on-one sessions. */
  readonly groupId: string | null;
}

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface SignupRequest {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly role?: Extract<Role, 'student' | 'tutor'>;
  readonly timezone?: string;
  readonly locale?: string;
}

export interface InitializePaymentRequest {
  readonly tutorId: string;
  readonly startIso: string;
  readonly endIso: string;
  readonly isTrial?: boolean;
  readonly callbackUrl?: string;
}

export type LoginResponse = ApiResponse<{ readonly user: ContractUser; readonly token: string }>;
export type SignupResponse = ApiResponse<{ readonly user: ContractUser; readonly token: string }>;
export type LogoutResponse = ApiResponse<Record<string, never>>;
export type LabTokenResponse = ApiResponse<{ readonly access: LabAccess }>;
export type DevicesResponse = ApiResponse<{ readonly devices: readonly PushDevice[] }>;
export type PreferencesResponse = ApiResponse<{ readonly preferences: NotificationPreferences }>;
export type VerifyPaymentResponse = ApiResponse<{ readonly charge: SettledCharge }>;
export type MySessionsResponse = ApiResponse<{ readonly sessions: readonly SessionSummary[] }>;
