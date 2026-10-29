import {
  DebtSimplificationStep,
  Expense,
  Member,
  MemberBalance,
  SimplificationSummary,
} from '../types';
import { paiseToRupees } from './formatCurrency';

/**
 * ============================================================================
 * DEBT SIMPLIFICATION ALGORITHM (Cash Flow Minimization)
 * ============================================================================
 * In a group of N friends, an unoptimized ledger can result in up to N * (N - 1) / 2
 * bilateral debts (e.g., A owes B ₹100, B owes C ₹100, C owes A ₹50...).
 *
 * This algorithm simplifies these debts into at most (N - 1) transactions using
 * a Greedy Net Balance Matching approach:
 *
 * 1. Calculate Net Balance for each member across all expenses:
 *      Net Balance = Total Amount Paid - Total Amount Owed
 *    - If Net > 0: Person is a "Creditor" (they paid more than their share and are owed money).
 *    - If Net < 0: Person is a "Debtor" (they owe money to the group).
 *    - If Net === 0: Person is fully settled.
 *    Note: The sum of all net balances across all group members is ALWAYS mathematically 0.
 *
 * 2. Separate into two lists:
 *    - Debtors (negative balance, ascending: largest debt first, e.g. -₹1200 before -₹300)
 *    - Creditors (positive balance, descending: largest credit first, e.g. +₹1000 before +₹500)
 *
 * 3. Greedily match the largest debtor with the largest creditor:
 *    - Settle amount = min(abs(debtor.balance), creditor.balance)
 *    - Record transaction: Debtor pays Creditor ₹SettleAmount
 *    - Debtor balance becomes: debtor.balance + SettleAmount (closer to 0)
 *    - Creditor balance becomes: creditor.balance - SettleAmount (closer to 0)
 *    - Remove whichever party reaches 0.
 *    - Repeat until both lists are empty.
 *
 * This ensures the minimum number of physical transactions needed to make everyone whole.
 * ============================================================================
 */

/**
 * Computes net balances for all group members in integer paise.
 */
export function calculateMemberBalances(
  members: Member[],
  expenses: Expense[]
): MemberBalance[] {
  const memberMap = new Map<string, Member>();
  members.forEach((m) => memberMap.set(m.id, m));

  const paidMap = new Map<string, number>();
  const owedMap = new Map<string, number>();

  // Initialize
  members.forEach((m) => {
    paidMap.set(m.id, 0);
    owedMap.set(m.id, 0);
  });

  // Aggregate all expenses and settlements
  for (const expense of expenses) {
    const paidBy = expense.paidById;
    // Payer contributed the total expense paise
    paidMap.set(paidBy, (paidMap.get(paidBy) || 0) + expense.amountPaise);

    // Each participant in splits owes their respective share
    for (const split of expense.splits) {
      owedMap.set(split.memberId, (owedMap.get(split.memberId) || 0) + split.amountPaise);
    }
  }

  return members.map((member) => {
    const totalPaidPaise = paidMap.get(member.id) || 0;
    const totalOwedPaise = owedMap.get(member.id) || 0;
    const netBalancePaise = totalPaidPaise - totalOwedPaise;

    return {
      memberId: member.id,
      name: member.name,
      totalPaidPaise,
      totalOwedPaise,
      netBalancePaise,
      totalPaid: paiseToRupees(totalPaidPaise),
      totalOwed: paiseToRupees(totalOwedPaise),
      netBalance: paiseToRupees(netBalancePaise),
    };
  });
}

/**
 * Calculates the raw pairwise debt matrix (who owes who prior to simplification).
 * Used to report "X raw debts reduced to Y simplified payments".
 */
export function calculateRawDebtCount(expenses: Expense[]): number {
  // Directed graph of pairwise debt: debtor -> creditor -> amountPaise
  const pairwiseDebt = new Map<string, Map<string, number>>();

  for (const expense of expenses) {
    const payer = expense.paidById;
    for (const split of expense.splits) {
      const debtor = split.memberId;
      if (debtor === payer) continue; // no debt to oneself

      if (!pairwiseDebt.has(debtor)) {
        pairwiseDebt.set(debtor, new Map());
      }
      const debtorDebts = pairwiseDebt.get(debtor)!;
      debtorDebts.set(payer, (debtorDebts.get(payer) || 0) + split.amountPaise);
    }
  }

  // Net pairwise debts between (A, B) and (B, A)
  const processedPairs = new Set<string>();
  let count = 0;

  const allDebtors = Array.from(pairwiseDebt.keys());
  for (const d1 of allDebtors) {
    const d1Debts = pairwiseDebt.get(d1)!;
    for (const [d2, amount1to2] of d1Debts.entries()) {
      const pairKey = [d1, d2].sort().join(':');
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);

      const amount2to1 = pairwiseDebt.get(d2)?.get(d1) || 0;
      const net = amount1to2 - amount2to1;
      if (Math.abs(net) > 0) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Pure function: simplifies debts using Greedy Net Balance Matching.
 */
export function simplifyDebts(
  members: Member[],
  expenses: Expense[]
): SimplificationSummary {
  if (members.length <= 1 || expenses.length === 0) {
    return {
      rawDebtCount: 0,
      simplifiedDebtCount: 0,
      transactions: [],
      savingsPercentage: 0,
    };
  }

  const memberBalances = calculateMemberBalances(members, expenses);
  const memberNameMap = new Map<string, string>();
  members.forEach((m) => memberNameMap.set(m.id, m.name));

  interface BalNode {
    memberId: string;
    balancePaise: number;
  }

  const debtors: BalNode[] = [];
  const creditors: BalNode[] = [];

  for (const mb of memberBalances) {
    if (mb.netBalancePaise < 0) {
      debtors.push({ memberId: mb.memberId, balancePaise: mb.netBalancePaise });
    } else if (mb.netBalancePaise > 0) {
      creditors.push({ memberId: mb.memberId, balancePaise: mb.netBalancePaise });
    }
  }

  // Sort debtors so largest debt (-₹5000 is smaller than -₹1000) is first
  debtors.sort((a, b) => a.balancePaise - b.balancePaise);
  // Sort creditors so largest credit (+₹5000) is first
  creditors.sort((a, b) => b.balancePaise - a.balancePaise);

  const transactions: DebtSimplificationStep[] = [];
  let debtorIdx = 0;
  let creditorIdx = 0;

  while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
    const debtor = debtors[debtorIdx];
    const creditor = creditors[creditorIdx];

    const debtRemaining = Math.abs(debtor.balancePaise);
    const creditRemaining = creditor.balancePaise;

    const settlePaise = Math.min(debtRemaining, creditRemaining);

    if (settlePaise > 0) {
      transactions.push({
        fromMemberId: debtor.memberId,
        fromMemberName: memberNameMap.get(debtor.memberId) || 'Unknown',
        toMemberId: creditor.memberId,
        toMemberName: memberNameMap.get(creditor.memberId) || 'Unknown',
        amountPaise: settlePaise,
        amount: paiseToRupees(settlePaise),
      });

      debtor.balancePaise += settlePaise;
      creditor.balancePaise -= settlePaise;
    }

    if (Math.abs(debtor.balancePaise) <= 0) {
      debtorIdx++;
    }
    if (creditor.balancePaise <= 0) {
      creditorIdx++;
    }
  }

  const rawDebtCount = calculateRawDebtCount(expenses);
  const simplifiedDebtCount = transactions.length;

  const baselineCount = Math.max(rawDebtCount, simplifiedDebtCount);
  const savingsPercentage =
    baselineCount > 0
      ? Math.max(0, Math.round(((baselineCount - simplifiedDebtCount) / baselineCount) * 100))
      : 0;

  return {
    rawDebtCount,
    simplifiedDebtCount,
    transactions,
    savingsPercentage,
  };
}
