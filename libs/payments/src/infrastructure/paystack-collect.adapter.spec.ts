import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PaystackCollectAdapter } from './paystack-collect.adapter';

function stubFetch(handler: (url: string, init?: RequestInit) => unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => ({
      ok: true,
      status: 200,
      json: async () => handler(url, init),
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PaystackCollectAdapter', () => {
  it('initializes a transaction and returns the authorization URL', async () => {
    stubFetch((url) => {
      expect(url).toContain('/transaction/initialize');
      return {
        status: true,
        data: {
          authorization_url: 'https://checkout.paystack.com/abc',
          access_code: 'abc',
          reference: 'mojo_ch_1',
        },
      };
    });
    const adapter = new PaystackCollectAdapter('sk_test_123');

    const opened = await adapter.initialize({
      email: 'ada@example.com',
      amountMinor: 800_000,
      currency: 'NGN',
      reference: 'mojo_ch_1',
      callbackUrl: 'https://mojo.test/payments/verify',
    });

    expect(opened.authorizationUrl).toBe('https://checkout.paystack.com/abc');
  });

  it('verifies a transaction including the reusable authorization', async () => {
    stubFetch(() => ({
      status: true,
      data: {
        reference: 'mojo_ch_1',
        status: 'success',
        amount: 800_000,
        currency: 'NGN',
        paid_at: '2026-09-15T01:00:00.000Z',
        authorization: { authorization_code: 'AUTH_1', last4: '4084', card_type: 'visa' },
        customer: { email: 'ada@example.com' },
      },
    }));
    const adapter = new PaystackCollectAdapter('sk_test_123');

    const verified = await adapter.verify('mojo_ch_1');

    expect(verified.status).toBe('success');
    expect(verified.authorization?.authorizationCode).toBe('AUTH_1');
  });

  it('throws a readable error when Paystack refuses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 402,
        json: async () => ({ status: false, message: 'Insufficient funds' }),
      })),
    );
    const adapter = new PaystackCollectAdapter('sk_test_123');

    await expect(
      adapter.chargeAuthorization({
        authorizationCode: 'AUTH_1',
        email: 'ada@example.com',
        amountMinor: 800_000,
        currency: 'NGN',
        reference: 'mojo_ch_2',
      }),
    ).rejects.toThrow('Insufficient funds');
  });

  it('validates webhook signatures with a constant-time compare', async () => {
    const adapter = new PaystackCollectAdapter('sk_test_123');
    const payload = JSON.stringify({ event: 'charge.success' });
    const signature = createHmac('sha512', 'sk_test_123').update(payload).digest('hex');

    expect(adapter.verifyWebhookSignature(payload, signature)).toBe(true);
    expect(adapter.verifyWebhookSignature(payload, `${signature}x`.slice(1))).toBe(false);
    expect(adapter.verifyWebhookSignature(payload, null)).toBe(false);
  });
});
