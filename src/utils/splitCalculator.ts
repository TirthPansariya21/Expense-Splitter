import { ExpenseSplit, SplitType } from '../types';
import { paiseToRupees, rupeesToPaise } from './formatCurrency';

/**
 * Pure functions for calculating exact splits among group members.
 *
 * CRITICAL ROUNDING PRINCIPLE:
 * We convert all currency amounts into integer paise (1 INR = 100 paise).
 * In fractional division (like ₹100 split 3 ways = 33.333...), integer division
 * yields a base share and an integer remainder.
 * We distribute the remaining paise 1-by-1 to ensure:
 * SUM(member_paise) === total_paise EXACTLY with ZERO leakage.
 */

export interface SplitCalculationInput {
  totalAmount: number; // in Rupees
  splitType: SplitType;
  selectedMemberIds: string[];
  exactAmounts?: Record<string, number>; // memberId -> rupees
  percentages?: Record<string, number>; // memberId -> percentage (0-100)
  shares?: Record<string, number>; // memberId -> share multiplier (e.g. 1, 2)
}

export interface SplitCalculationResult {
  isValid: boolean;
  errorMessage?: string;
  splits: ExpenseSplit[];
  totalPaise: number;
}

/**
 * Calculates equal split among selected members.
 * Distributes leftover paise to the first few members so the sum equals totalPaise.
 */
export function calculateEqualSplit(
  totalPaise: number,
  memberIds: string[]
): ExpenseSplit[] {
  if (memberIds.length === 0) return [];
  if (totalPaise <= 0) {
    return memberIds.map((id) => ({
      memberId: id,
      amountPaise: 0,
      amount: 0,
    }));
  }

  const n = memberIds.length;
  const basePaise = Math.floor(totalPaise / n);
  const remainderPaise = totalPaise % n;

  return memberIds.map((memberId, index) => {
    // Distribute 1 extra paisa to the first `remainderPaise` members
    const memberPaise = basePaise + (index < remainderPaise ? 1 : 0);
    return {
      memberId,
      amountPaise: memberPaise,
      amount: paiseToRupees(memberPaise),
    };
  });
}

/**
 * Calculates exact split where user enters each person's specific rupee amount.
 * Validates that the sum of parts matches total amount exactly.
 */
export function calculateExactSplit(
  totalPaise: number,
  memberIds: string[],
  exactAmounts: Record<string, number> = {}
): SplitCalculationResult {
  if (memberIds.length === 0) {
    return { isValid: false, errorMessage: 'Select at least one member to split.', splits: [], totalPaise };
  }

  let sumPaise = 0;
  const splits: ExpenseSplit[] = memberIds.map((memberId) => {
    const rupees = Number(exactAmounts[memberId]) || 0;
    const paise = rupeesToPaise(rupees);
    sumPaise += paise;
    return {
      memberId,
      amountPaise: paise,
      amount: paiseToRupees(paise),
    };
  });

  const diffPaise = totalPaise - sumPaise;
  if (diffPaise !== 0) {
    const diffRupees = paiseToRupees(Math.abs(diffPaise));
    return {
      isValid: false,
      errorMessage:
        diffPaise > 0
          ? `Amounts fall short by ₹${diffRupees.toFixed(2)}. Sum: ₹${paiseToRupees(sumPaise).toFixed(2)} vs Total: ₹${paiseToRupees(totalPaise).toFixed(2)}`
          : `Amounts exceed total by ₹${diffRupees.toFixed(2)}. Sum: ₹${paiseToRupees(sumPaise).toFixed(2)} vs Total: ₹${paiseToRupees(totalPaise).toFixed(2)}`,
      splits,
      totalPaise,
    };
  }

  return { isValid: true, splits, totalPaise };
}

/**
 * Calculates percentage-based split.
 * Validates that percentages sum to 100%.
 * Allocates base paise and allocates remainder to highest percentage holders.
 */
export function calculatePercentageSplit(
  totalPaise: number,
  memberIds: string[],
  percentages: Record<string, number> = {}
): SplitCalculationResult {
  if (memberIds.length === 0) {
    return { isValid: false, errorMessage: 'Select at least one member to split.', splits: [], totalPaise };
  }

  const totalPct = memberIds.reduce(
    (acc, id) => acc + (Number(percentages[id]) || 0),
    0
  );

  // Allow negligible floating point tolerance for percentages (e.g. 33.33 + 33.33 + 33.34 = 100)
  if (Math.abs(totalPct - 100) > 0.05) {
    return {
      isValid: false,
      errorMessage: `Percentages must sum to 100% (currently ${totalPct.toFixed(2)}%).`,
      splits: [],
      totalPaise,
    };
  }

  // Calculate base paise for each member
  let allocatedPaise = 0;
  const indexedMembers = memberIds.map((memberId) => {
    const pct = Number(percentages[memberId]) || 0;
    const sharePaise = Math.floor((totalPaise * pct) / 100);
    allocatedPaise += sharePaise;
    return { memberId, pct, sharePaise };
  });

  // Distribute leftover paise to members with the largest percentage shares
  let remainderPaise = totalPaise - allocatedPaise;
  const sortedByPct = [...indexedMembers].sort((a, b) => b.pct - a.pct);

  const finalPaiseMap: Record<string, number> = {};
  for (const item of indexedMembers) {
    finalPaiseMap[item.memberId] = item.sharePaise;
  }

  let idx = 0;
  while (remainderPaise > 0 && idx < sortedByPct.length) {
    finalPaiseMap[sortedByPct[idx].memberId] += 1;
    remainderPaise -= 1;
    idx++;
  }

  const splits: ExpenseSplit[] = memberIds.map((memberId) => {
    const paise = finalPaiseMap[memberId];
    return {
      memberId,
      amountPaise: paise,
      amount: paiseToRupees(paise),
      percentage: Number(percentages[memberId]) || 0,
    };
  });

  return { isValid: true, splits, totalPaise };
}

/**
 * Calculates share-based split (e.g. Person A has 2 shares, Person B has 1 share).
 * Distributes leftover paise to members with the most shares.
 */
export function calculateSharesSplit(
  totalPaise: number,
  memberIds: string[],
  shares: Record<string, number> = {}
): SplitCalculationResult {
  if (memberIds.length === 0) {
    return { isValid: false, errorMessage: 'Select at least one member to split.', splits: [], totalPaise };
  }

  const totalShares = memberIds.reduce(
    (acc, id) => acc + Math.max(0, Number(shares[id]) || 0),
    0
  );

  if (totalShares <= 0) {
    return {
      isValid: false,
      errorMessage: 'Total shares must be greater than zero.',
      splits: [],
      totalPaise,
    };
  }

  let allocatedPaise = 0;
  const indexedMembers = memberIds.map((memberId) => {
    const memberShares = Math.max(0, Number(shares[memberId]) || 0);
    const sharePaise = Math.floor((totalPaise * memberShares) / totalShares);
    allocatedPaise += sharePaise;
    return { memberId, memberShares, sharePaise };
  });

  let remainderPaise = totalPaise - allocatedPaise;
  const sortedByShares = [...indexedMembers].sort((a, b) => b.memberShares - a.memberShares);

  const finalPaiseMap: Record<string, number> = {};
  for (const item of indexedMembers) {
    finalPaiseMap[item.memberId] = item.sharePaise;
  }

  let idx = 0;
  while (remainderPaise > 0 && idx < sortedByShares.length) {
    finalPaiseMap[sortedByShares[idx].memberId] += 1;
    remainderPaise -= 1;
    idx++;
  }

  const splits: ExpenseSplit[] = memberIds.map((memberId) => {
    const paise = finalPaiseMap[memberId];
    return {
      memberId,
      amountPaise: paise,
      amount: paiseToRupees(paise),
      shares: Number(shares[memberId]) || 0,
    };
  });

  return { isValid: true, splits, totalPaise };
}

/**
 * Master split dispatcher based on chosen split type.
 */
export function calculateSplits(input: SplitCalculationInput): SplitCalculationResult {
  const { totalAmount, splitType, selectedMemberIds, exactAmounts, percentages, shares } = input;
  const totalPaise = rupeesToPaise(totalAmount);

  if (totalPaise <= 0) {
    return {
      isValid: false,
      errorMessage: 'Amount must be greater than ₹0.',
      splits: [],
      totalPaise,
    };
  }

  if (selectedMemberIds.length === 0) {
    return {
      isValid: false,
      errorMessage: 'Please select at least one person to split with.',
      splits: [],
      totalPaise,
    };
  }

  switch (splitType) {
    case 'EQUAL':
      return {
        isValid: true,
        splits: calculateEqualSplit(totalPaise, selectedMemberIds),
        totalPaise,
      };

    case 'EXACT':
      return calculateExactSplit(totalPaise, selectedMemberIds, exactAmounts);

    case 'PERCENT':
      return calculatePercentageSplit(totalPaise, selectedMemberIds, percentages);

    case 'SHARES':
      return calculateSharesSplit(totalPaise, selectedMemberIds, shares);

    default:
      return {
        isValid: false,
        errorMessage: 'Invalid split type selected.',
        splits: [],
        totalPaise,
      };
  }
}
