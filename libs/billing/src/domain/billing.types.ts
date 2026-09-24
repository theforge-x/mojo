export interface PaymentMethod {
  readonly id: string;
  readonly studentId: string;
  readonly rail: 'paystack' | 'flutterwave' | 'stripe';
  readonly last4: string | null;
  readonly authorizationCode: string | null;
  readonly isDefault: boolean;
}

export interface LessonSubscription {
  readonly id: string;
  readonly studentId: string;
  readonly tutorId: string;
  readonly lessonsPerCycle: number;
  readonly cycleLengthDays: number;
  readonly autoRenew: boolean;
  readonly status: 'active' | 'paused' | 'cancelled';
}
