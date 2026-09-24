/**
 * Payment-callback allowlist. Redirect checkout hands `callbackUrl` to
 * Paystack, which bounces the payer's browser there after payment — an open
 * redirect if we echoed arbitrary caller input. Only two destinations are
 * inside the app's control: the web verify page on this origin, and the
 * registered `mojo://` deep-link scheme for the native client. Anything
 * else (including same-origin lookalikes with extra path/query) falls back
 * to the web verify page.
 */
export function resolvePaymentCallbackUrl(requested: string, origin: string): string {
  const webVerify = `${origin}/payments/verify`;
  if (requested === webVerify || requested.startsWith('mojo://')) {
    return requested;
  }
  return webVerify;
}
