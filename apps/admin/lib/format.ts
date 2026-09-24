export function formatMinor(amountMinor: number, currency = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amountMinor / 100);
}
