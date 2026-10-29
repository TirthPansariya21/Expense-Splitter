/**
 * Utility functions for Indian Rupee (INR) formatting and Paise conversions.
 * Working with integer paise prevents floating point rounding drift.
 */

export function rupeesToPaise(rupees: number): number {
  return Math.round((Number(rupees) || 0) * 100);
}

export function paiseToRupees(paise: number): number {
  return (Number(paise) || 0) / 100;
}

/**
 * Format an amount in INR with Indian comma numbering system (e.g. ₹1,24,500.00 or ₹450).
 */
export function formatINR(
  amountInRupees: number,
  options: {
    showDecimals?: boolean;
    showSign?: boolean;
    compact?: boolean;
  } = {}
): string {
  const { showDecimals = false, showSign = false, compact = false } = options;
  const num = Number(amountInRupees) || 0;
  const absNum = Math.abs(num);

  if (compact && absNum >= 100000) {
    // 1 Lakh+
    return `₹${(num / 100000).toFixed(1)}L`;
  }
  if (compact && absNum >= 1000) {
    return `₹${(num / 1000).toFixed(1)}k`;
  }

  // Use en-IN locale for Indian numbering standard (Lakhs and Crores)
  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : (num % 1 !== 0 ? 2 : 0),
  });

  const formatted = formatter.format(absNum);
  const signPrefix = showSign ? (num > 0 ? '+' : num < 0 ? '-' : '') : (num < 0 ? '-' : '');

  return `${signPrefix}₹${formatted}`;
}

export function formatPaise(
  paise: number,
  options: {
    showDecimals?: boolean;
    showSign?: boolean;
    compact?: boolean;
  } = {}
): string {
  return formatINR(paiseToRupees(paise), options);
}
