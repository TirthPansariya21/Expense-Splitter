export type ExpenseCategory = 'Food' | 'Travel' | 'Stay' | 'Shopping' | 'Bills' | 'Other';

export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENT' | 'SHARES';

export interface Member {
  id: string;
  name: string;
  color?: string;
  avatarSeed?: string;
}

export interface ExpenseSplit {
  memberId: string;
  amountPaise: number; // exact integer paise
  amount: number; // in Rupees (amountPaise / 100)
  percentage?: number;
  shares?: number;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number; // in Rupees
  amountPaise: number; // in paise
  date: string; // ISO date string YYYY-MM-DD
  category: ExpenseCategory;
  paidById: string;
  splitType: SplitType;
  splits: ExpenseSplit[];
  notes?: string;
  isSettlement?: boolean; // If this expense was created to settle up a debt
  settlementDetails?: {
    fromMemberId: string;
    toMemberId: string;
  };
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  members: Member[];
  createdAt: string;
  updatedAt: string;
}

export interface MemberBalance {
  memberId: string;
  name: string;
  totalPaidPaise: number;
  totalOwedPaise: number;
  netBalancePaise: number; // positive = gets back, negative = owes
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

export interface DebtSimplificationStep {
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  amountPaise: number;
  amount: number;
}

export interface SimplificationSummary {
  rawDebtCount: number;
  simplifiedDebtCount: number;
  transactions: DebtSimplificationStep[];
  savingsPercentage: number;
}
