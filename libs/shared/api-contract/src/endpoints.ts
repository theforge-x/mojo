/** Route paths for every hub endpoint the mobile client touches. */
export const contract = {
  login: '/api/auth/login',
  signup: '/api/auth/signup',
  logout: '/api/auth/logout',
  labToken: (sessionId: string) => `/api/lab/${encodeURIComponent(sessionId)}/token`,
  devices: '/api/notifications/devices',
  preferences: '/api/notifications/preferences',
  notificationsLog: '/api/notifications/log',
  paymentsInitialize: '/api/payments/initialize',
  paymentsVerify: (reference: string) =>
    `/api/payments/verify?reference=${encodeURIComponent(reference)}`,
  mySessions: '/api/sessions',
  quote: (tutorId: string, groupSize?: number) =>
    `/api/quote?tutorId=${encodeURIComponent(tutorId)}${typeof groupSize === 'number' ? `&groupSize=${groupSize}` : ''}`,
} as const;

/**
 * Deep-link plumbing shared by both ends of the payment flow.
 * The hub allowlist (`resolvePaymentCallbackUrl`) accepts the web verify
 * page or any `mojo://` URL — the native client always sends this one.
 */
export const MOJO_SCHEME = 'mojo';
export const NATIVE_PAYMENT_CALLBACK = `${MOJO_SCHEME}://payments/verify`;

/**
 * Pull the Paystack reference out of a payment callback URL — either the
 * `mojo://` deep link the app receives or the `https://` web verify page.
 * Manual query parsing (no `URL` global) so it runs identically on Hermes,
 * Node, and browsers. Returns null when there is no reference to settle.
 */
export function parsePaymentReference(callbackUrl: string): string | null {
  const queryIndex = callbackUrl.indexOf('?');
  if (queryIndex === -1) {
    return null;
  }
  const query = callbackUrl.slice(queryIndex + 1);
  for (const pair of query.split('&')) {
    const separatorIndex = pair.indexOf('=');
    const key = separatorIndex === -1 ? pair : pair.slice(0, separatorIndex);
    if (key !== 'reference') {
      continue;
    }
    const raw = separatorIndex === -1 ? '' : pair.slice(separatorIndex + 1);
    try {
      const value = decodeURIComponent(raw.replace(/\+/g, ' '));
      return value === '' ? null : value;
    } catch {
      return null;
    }
  }
  return null;
}
