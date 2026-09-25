import { describe, expect, it } from 'vitest';
import { contract, isOk, NATIVE_PAYMENT_CALLBACK, parsePaymentReference } from './index';

describe('contract paths', () => {
  it('builds the lab token path per session', () => {
    expect(contract.labToken('sess_1')).toBe('/api/lab/sess_1/token');
  });

  it('encodes the verify reference', () => {
    expect(contract.paymentsVerify('a b')).toBe('/api/payments/verify?reference=a%20b');
  });

  it('appends groupSize to the quote path only when given', () => {
    expect(contract.quote('t_1')).toBe('/api/quote?tutorId=t_1');
    expect(contract.quote('t_1', 12)).toBe('/api/quote?tutorId=t_1&groupSize=12');
  });
});

describe('isOk', () => {
  it('narrows success and failure envelopes', () => {
    expect(isOk({ ok: true, token: 'abc' })).toBe(true);
    expect(isOk({ ok: false, error: 'nope' })).toBe(false);
  });
});

describe('parsePaymentReference', () => {
  it('reads the native mojo:// callback the app receives', () => {
    expect(parsePaymentReference(`${NATIVE_PAYMENT_CALLBACK}?reference=abc123`)).toBe('abc123');
  });

  it('reads the web verify page URL too', () => {
    expect(parsePaymentReference('https://mojo.example.com/payments/verify?reference=abc123')).toBe(
      'abc123',
    );
  });

  it('ignores sibling query params and decodes values', () => {
    expect(parsePaymentReference('mojo://payments/verify?trxref=x&reference=a%20b')).toBe('a b');
  });

  it('returns null when there is no reference', () => {
    expect(parsePaymentReference(NATIVE_PAYMENT_CALLBACK)).toBeNull();
    expect(parsePaymentReference('mojo://payments/verify?trxref=x')).toBeNull();
    expect(parsePaymentReference('mojo://payments/verify?reference=')).toBeNull();
    expect(parsePaymentReference('not a url')).toBeNull();
  });
});
