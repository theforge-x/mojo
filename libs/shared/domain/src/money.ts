/** Money is always an integer count of the smallest currency unit (kobo/cents). */
export interface Money {
  readonly amountMinor: number;
  readonly currency: 'NGN' | 'USD';
}

export function money(amountMinor: number, currency: Money['currency']): Money {
  if (!Number.isInteger(amountMinor)) {
    throw new Error('Money amounts must be integers in the minor unit — never floats.');
  }
  return { amountMinor, currency };
}

export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountMinor + b.amountMinor, a.currency);
}

export function subtractMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountMinor - b.amountMinor, a.currency);
}

export function percentOf(amount: Money, percent: number): Money {
  return money(Math.round(amount.amountMinor * (percent / 100)), amount.currency);
}

export function formatMoney(amount: Money): string {
  const major = amount.amountMinor / 100;
  const symbol = amount.currency === 'NGN' ? '₦' : '$';
  return `${symbol}${major.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
}
