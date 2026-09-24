import { describe, expect, it } from 'vitest';
import { resolvePaymentCallbackUrl } from './callback-url';

const ORIGIN = 'https://mojo.example.com';
const WEB_VERIFY = `${ORIGIN}/payments/verify`;

describe('resolvePaymentCallbackUrl', () => {
  it('keeps the exact web verify page', () => {
    expect(resolvePaymentCallbackUrl(WEB_VERIFY, ORIGIN)).toBe(WEB_VERIFY);
  });

  it('allows the native mojo:// deep-link scheme', () => {
    expect(resolvePaymentCallbackUrl('mojo://payments/verify?reference=abc', ORIGIN)).toBe(
      'mojo://payments/verify?reference=abc',
    );
  });

  it('rejects external URLs back to the web verify page', () => {
    expect(resolvePaymentCallbackUrl('https://evil.example.com/steal', ORIGIN)).toBe(WEB_VERIFY);
  });

  it('rejects same-origin lookalikes with extra path or query', () => {
    expect(resolvePaymentCallbackUrl(`${WEB_VERIFY}?reference=abc`, ORIGIN)).toBe(WEB_VERIFY);
    expect(resolvePaymentCallbackUrl(`${WEB_VERIFY}/extra`, ORIGIN)).toBe(WEB_VERIFY);
  });

  it('falls back when nothing was requested', () => {
    expect(resolvePaymentCallbackUrl('', ORIGIN)).toBe(WEB_VERIFY);
  });
});
