export interface ChargeAmountLine {
  charge_amount: number;
  is_paid: boolean;
}

export interface ChargeTotals {
  total: number;
  collected: number;
  pending: number;
}

/** Sum all amounts; collected = paid rows; pending = total − collected. */
export function summarizeCharges(lines: ChargeAmountLine[]): ChargeTotals {
  let total = 0;
  let collected = 0;
  for (const line of lines) {
    const amt = line.charge_amount;
    total += amt;
    if (line.is_paid) collected += amt;
  }
  return { total, collected, pending: total - collected };
}
