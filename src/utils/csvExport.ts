import { Expense, Group } from '../types';
import { formatINR } from './formatCurrency';
import { calculateMemberBalances, simplifyDebts } from './settleUp';

export function exportGroupToCSV(group: Group, expenses: Expense[]) {
  const memberNameMap = new Map<string, string>();
  group.members.forEach((m) => memberNameMap.set(m.id, m.name));

  const balances = calculateMemberBalances(group.members, expenses);
  const simplification = simplifyDebts(group.members, expenses);

  const lines: string[] = [];

  // Metadata
  lines.push(`"SplitEasy - Group Expense Export"`);
  lines.push(`"Group Name","${group.name.replace(/"/g, '""')}"`);
  lines.push(`"Export Date","${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}"`);
  lines.push(`"Total Members","${group.members.length}"`);
  lines.push('');

  // Expenses Table
  lines.push(`"--- EXPENSES ---"`);
  lines.push(`"Date","Description","Category","Paid By","Split Type","Split With","Amount (INR)","Notes"`);

  expenses.forEach((exp) => {
    const payerName = memberNameMap.get(exp.paidById) || 'Unknown';
    const splitNames = exp.splits
      .map((s) => `${memberNameMap.get(s.memberId) || 'Unknown'} (₹${s.amount.toFixed(2)})`)
      .join('; ');

    const row = [
      `"${exp.date}"`,
      `"${exp.description.replace(/"/g, '""')}"`,
      `"${exp.category}"`,
      `"${payerName}"`,
      `"${exp.splitType}"`,
      `"${splitNames.replace(/"/g, '""')}"`,
      `"${exp.amount.toFixed(2)}"`,
      `"${(exp.notes || '').replace(/"/g, '""')}"`,
    ];
    lines.push(row.join(','));
  });

  lines.push('');

  // Balances Table
  lines.push(`"--- MEMBER BALANCES ---"`);
  lines.push(`"Member","Total Paid (INR)","Total Owed (INR)","Net Balance (INR)","Status"`);

  balances.forEach((bal) => {
    const status =
      bal.netBalancePaise > 0
        ? `Gets back ${formatINR(bal.netBalance)}`
        : bal.netBalancePaise < 0
        ? `Owes ${formatINR(Math.abs(bal.netBalance))}`
        : 'Settled up';

    lines.push(
      [
        `"${bal.name}"`,
        `"${bal.totalPaid.toFixed(2)}"`,
        `"${bal.totalOwed.toFixed(2)}"`,
        `"${bal.netBalance.toFixed(2)}"`,
        `"${status}"`,
      ].join(',')
    );
  });

  lines.push('');

  // Settle-Up Instructions
  lines.push(`"--- SIMPLIFIED SETTLEMENT PLAN (${simplification.transactions.length} payments) ---"`);
  lines.push(`"From (Debtor)","To (Creditor)","Amount (INR)"`);

  if (simplification.transactions.length === 0) {
    lines.push(`"All members are settled up!","","0.00"`);
  } else {
    simplification.transactions.forEach((tx) => {
      lines.push(
        [`"${tx.fromMemberName}"`, `"${tx.toMemberName}"`, `"${tx.amount.toFixed(2)}"`].join(',')
      );
    });
  }

  const csvContent = '\uFEFF' + lines.join('\n'); // add UTF-8 BOM for Excel compatibility
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const cleanName = group.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('download', `SplitEasy_${cleanName}_Expenses_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
