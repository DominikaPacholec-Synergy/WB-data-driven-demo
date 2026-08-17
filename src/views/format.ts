/** Money formatting for the demo's invoice figures. */
export function formatMoney(amount: unknown, currency = 'EUR'): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
}
