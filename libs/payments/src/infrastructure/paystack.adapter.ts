import type { Money } from '@mojo/shared/domain';
import type { PayoutRail } from '../domain/payments.ports';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/**
 * Thin adapter over Paystack's Transfers API. Kept deliberately small —
 * this is the only file in the whole codebase allowed to know Paystack's
 * request/response shape.
 */
export class PaystackPayoutRail implements PayoutRail {
  constructor(private readonly secretKey: string) {}

  async send(tutorId: string, amount: Money): Promise<{ externalRef: string }> {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        amount: amount.amountMinor,
        recipient: tutorId, // in practice, a stored Paystack transfer-recipient code
        reason: 'Mojo tutor payout',
      }),
    });

    if (!response.ok) {
      throw new Error(`Paystack transfer failed with status ${response.status}`);
    }

    const body = (await response.json()) as { data: { transfer_code: string } };
    return { externalRef: body.data.transfer_code };
  }
}
