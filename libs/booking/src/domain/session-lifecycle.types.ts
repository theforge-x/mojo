export type DeliveryConfirmationSource = 'student' | 'auto_window';

export interface DeliveryConfirmation {
  readonly sessionId: string;
  readonly confirmedBy: DeliveryConfirmationSource;
  readonly confirmedAt: string;
}

/** The auto-confirm window referenced throughout the roadmap's payout logic. */
export const AUTO_CONFIRM_WINDOW_HOURS = 48;
