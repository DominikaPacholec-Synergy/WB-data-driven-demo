// TODO: put to some helpers folder
export const formatMoney = (amount: unknown, currency = "EUR"): string => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
};
