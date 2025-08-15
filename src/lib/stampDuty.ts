import { CONFIG } from './config';

export type PurchaseType = 'personal' | 'second_home' | 'ltd' | 'first_time';

// Compute SDLT for England/NI residential property with an optional 3% surcharge for
// additional properties (second home) and most LTD purchases used for BTL.
// Bands (as of 2024):
//  - 0% up to £250k
//  - 5% £250k–£925k
//  - 10% £925k–£1.5m
//  - 12% over £1.5m
// Additional property surcharge: +3% of full price.
export function computeStampDuty(price: number, type: PurchaseType): number {
  if (!Number.isFinite(price) || price <= 0) return 0;
  // First-time buyer relief (England/NI): 0% up to £425k, 5% between £425k–£625k.
  // Above £625k, normal residential rates (no surcharge) apply.
  if (type === 'first_time') {
    if (price <= 425000) return 0;
    if (price <= 625000) {
      const slice = price - 425000;
      return Math.round(slice * 0.05);
    }
    // Fall-through to normal residential rates if above £625k
    type = 'personal';
  }
  const bands = CONFIG.STAMP_DUTY.BANDS;
  const rates = CONFIG.STAMP_DUTY.RATES;

  let remaining = price;
  let tax = 0;
  let prevCap = 0;
  for (let i = 0; i < bands.length; i++) {
    const cap = bands[i];
    const slice = Math.max(0, Math.min(remaining, cap - prevCap));
    tax += slice * rates[i];
    remaining -= slice;
    prevCap = cap;
  }
  if (remaining > 0) tax += remaining * rates[rates.length - 1];

  const needsSurcharge = type === 'second_home' || type === 'ltd';
  if (needsSurcharge) tax += price * 0.03;

  return Math.round(tax);
}


