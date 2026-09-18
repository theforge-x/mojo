import { createHmac } from 'node:crypto';
import type { PaymentCollector, VerifiedTransaction } from '../domain/payments.ports';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/**
 * Collect side of Paystack (Transactions API). The only file allowed to know
 * the collect wire shape — everything upstream speaks `PaymentCollector`.
 * Amounts are minor units (kobo), matching the ledger everywhere.
 */
export class PaystackCollectAdapter implements PaymentCollector {
  constructor(private readonly secretKey: string) {}

  async initialize(input: {
    email: string;
    amountMinor: number;
    currency: string;
    reference: string;
    callbackUrl: string;
  }): Promise<{ authorizationUrl: string; accessCode: string; reference: string }> {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: input.email,
        amount: input.amountMinor,
        currency: input.currency,
        reference: input.reference,
        callback_url: input.callbackUrl,
      }),
    });
    const body = await this.readBody(response);
    const data = body.data ?? {};
    if (!response.ok || body.status !== true || typeof data.authorization_url !== 'string') {
      throw new Error(
        typeof body.message === 'string'
          ? `Paystack initialize failed: ${body.message}`
          : `Paystack initialize failed with status ${response.status}.`,
      );
    }
    return {
      authorizationUrl: data.authorization_url,
      accessCode: typeof data.access_code === 'string' ? data.access_code : '',
      reference: typeof data.reference === 'string' ? data.reference : input.reference,
    };
  }

  async verify(reference: string): Promise<VerifiedTransaction> {
    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${this.secretKey}` } },
    );
    const body = await this.readBody(response);
    if (!response.ok || body.status !== true || !body.data) {
      throw new Error(`Paystack verify failed with status ${response.status}.`);
    }
    const data = body.data;
    const authorization = (data.authorization ?? null) as Record<string, unknown> | null;
    const paidAt = typeof data.paid_at === 'string' ? data.paid_at : null;
    return {
      reference: typeof data.reference === 'string' ? data.reference : reference,
      status: typeof data.status === 'string' ? data.status : 'unknown',
      amountMinor: typeof data.amount === 'number' ? data.amount : 0,
      currency: typeof data.currency === 'string' ? data.currency : '',
      paidAt,
      authorization:
        authorization && typeof authorization.authorization_code === 'string'
          ? {
              authorizationCode: authorization.authorization_code,
              last4:
                typeof authorization.last4 === 'string' ? (authorization.last4 as string) : null,
              cardType:
                typeof authorization.card_type === 'string'
                  ? (authorization.card_type as string)
                  : null,
            }
          : null,
      customerEmail:
        typeof (data.customer as Record<string, unknown> | undefined)?.email === 'string'
          ? ((data.customer as Record<string, unknown>).email as string)
          : null,
    };
  }

  async chargeAuthorization(input: {
    authorizationCode: string;
    email: string;
    amountMinor: number;
    currency: string;
    reference: string;
  }): Promise<{ reference: string; status: string }> {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/charge_authorization`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authorization_code: input.authorizationCode,
        email: input.email,
        amount: input.amountMinor,
        currency: input.currency,
        reference: input.reference,
      }),
    });
    const body = await this.readBody(response);
    const data = body.data ?? {};
    if (!response.ok || body.status !== true) {
      throw new Error(
        typeof body.message === 'string'
          ? `Saved-card charge failed: ${body.message}`
          : `Saved-card charge failed with status ${response.status}.`,
      );
    }
    return {
      reference: typeof data.reference === 'string' ? data.reference : input.reference,
      status: typeof data.status === 'string' ? data.status : 'unknown',
    };
  }

  verifyWebhookSignature(payload: string, signature: string | null): boolean {
    if (!signature) return false;
    const expected = createHmac('sha512', this.secretKey).update(payload).digest('hex');
    return expected.length === signature.length && timingSafeEqualString(expected, signature);
  }

  private async readBody(response: Response): Promise<PaystackBody> {
    try {
      return (await response.json()) as PaystackBody;
    } catch {
      return {};
    }
  }
}

interface PaystackBody {
  readonly status?: unknown;
  readonly message?: unknown;
  readonly data?: Record<string, unknown>;
}

function timingSafeEqualString(a: string, b: string): boolean {
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
