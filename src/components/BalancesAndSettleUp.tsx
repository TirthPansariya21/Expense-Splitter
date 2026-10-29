import React, { useState } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRightLeft,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DebtSimplificationStep, Expense, Group, Member } from '../types';
import { formatINR } from '../utils/formatCurrency';
import { calculateMemberBalances, simplifyDebts } from '../utils/settleUp';
import { Avatar } from './Avatar';
import { SettleUpModal } from './SettleUpModal';

interface BalancesAndSettleUpProps {
  group: Group;
  expenses: Expense[];
  currentMemberId: string | null;
  onRecordSettlement: (settlement: {
    payerId: string;
    receiverId: string;
    amount: number;
    date: string;
    notes: string;
  }) => void;
}

export const BalancesAndSettleUp: React.FC<BalancesAndSettleUpProps> = ({
  group,
  expenses,
  currentMemberId,
  onRecordSettlement,
}) => {
  const [showAlgorithmDetails, setShowAlgorithmDetails] = useState(false);
  const [settleModalState, setSettleModalState] = useState<{
    isOpen: boolean;
    payerId?: string;
    receiverId?: string;
    amount?: number;
  }>({ isOpen: false });

  const balances = calculateMemberBalances(group.members, expenses);
  const simplification = simplifyDebts(group.members, expenses);

  const isAllSettled =
    balances.length === 0 ||
    balances.every((b) => Math.abs(b.netBalancePaise) === 0);

  const handleQuickSettle = (tx: DebtSimplificationStep) => {
    setSettleModalState({
      isOpen: true,
      payerId: tx.fromMemberId,
      receiverId: tx.toMemberId,
      amount: tx.amount,
    });
  };

  const handleOpenCustomSettle = () => {
    setSettleModalState({
      isOpen: true,
      payerId: group.members[0]?.id,
      receiverId: group.members[1]?.id,
      amount: 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Status + Debt Minimization Highlight */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl">{isAllSettled ? '🎉' : '⚡'}</span>
              <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-300">
                {isAllSettled ? 'Clean Ledger' : 'Smart Debt Simplification'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black">
              {isAllSettled ? 'All Settled Up! 🎉' : 'Who Owes Whom'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              {isAllSettled
                ? 'Everyone in this group is squared away with zero outstanding debt.'
                : `We resolved all intermediate debts into just ${simplification.transactions.length} direct transfers.`}
            </p>
          </div>

          {!isAllSettled && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenCustomSettle}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs border border-white/15 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowRightLeft size={14} />
                <span>Custom Settle</span>
              </button>
            </div>
          )}
        </div>

        {/* Algorithm reduction metric callout */}
        {!isAllSettled && simplification.rawDebtCount > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                <Zap size={12} />
                <span>
                  {simplification.rawDebtCount} raw debts reduced to {simplification.transactions.length} payments
                </span>
              </div>
              {simplification.savingsPercentage > 0 && (
                <span className="text-indigo-200 text-[11px]">
                  ({simplification.savingsPercentage}% fewer transactions)
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAlgorithmDetails(!showAlgorithmDetails)}
              className="text-[11px] font-semibold text-indigo-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Info size={13} />
              <span>How this works</span>
              {showAlgorithmDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        )}
      </div>

      {/* Expandable Explanation of Debt Simplification Algorithm */}
      {showAlgorithmDetails && (
        <div className="p-5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/40 text-slate-800 dark:text-slate-200 text-xs space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200 text-sm">
            <ShieldCheck size={18} className="text-indigo-600 dark:text-indigo-400" />
            <span>How Greedy Debt Simplification Works</span>
          </div>
          <p className="leading-relaxed">
            Without simplification, if Rahul pays for dinner (Amit & Sneha owe Rahul), Sneha pays for cab (Rahul owes Sneha), and Amit pays for movie (Sneha owes Amit), friends end up sending 5-6 confusing partial payments back and forth.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/30">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                1. Net Balance
              </span>
              <span>We calculate each person's exact total paid minus total consumed.</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/30">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                2. Greedy Matching
              </span>
              <span>We sort debtors and creditors, matching the biggest debtor with the biggest creditor.</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/30">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                3. Minimal Transfers
              </span>
              <span>Zero circular payments; everyone is fully squared in at most (N - 1) transactions.</span>
            </div>
          </div>
        </div>
      )}

      {/* Simplified Settlement Transactions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Suggested Payments ({simplification.transactions.length})
          </h3>
          <span className="text-xs text-slate-400">
            Click 'Mark as settled' when paid
          </span>
        </div>

        {simplification.transactions.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No settlements needed
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Everyone has zero outstanding balance in this group.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {simplification.transactions.map((tx, idx) => {
              const fromMember = group.members.find((m) => m.id === tx.fromMemberId);
              const toMember = group.members.find((m) => m.id === tx.toMemberId);

              const isUserInvolved =
                currentMemberId &&
                (tx.fromMemberId === currentMemberId || tx.toMemberId === currentMemberId);

              return (
                <div
                  key={`${tx.fromMemberId}-${tx.toMemberId}-${idx}`}
                  className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex items-center justify-between gap-3 shadow-xs ${
                    isUserInvolved
                      ? 'border-indigo-300 dark:border-indigo-800 ring-2 ring-indigo-500/10'
                      : 'border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  {/* From -> To */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* From Debtor */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={tx.fromMemberName} color={fromMember?.color} size="sm" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[85px] sm:max-w-[100px]">
                        {tx.fromMemberName}
                      </span>
                    </div>

                    {/* Arrow with amount */}
                    <div className="flex flex-col items-center shrink-0 px-1">
                      <div className="flex items-center text-slate-400">
                        <span className="w-4 h-0.5 bg-slate-300 dark:bg-slate-700" />
                        <ArrowRight size={14} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">
                        pays
                      </span>
                    </div>

                    {/* To Creditor */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={tx.toMemberName} color={toMember?.color} size="sm" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[85px] sm:max-w-[100px]">
                        {tx.toMemberName}
                      </span>
                    </div>
                  </div>

                  {/* Amount & Settle Button */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 block">
                        {formatINR(tx.amount)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuickSettle(tx)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 size={13} />
                      <span className="hidden sm:inline">Mark as settled</span>
                      <span className="sm:hidden">Settle</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Member Net Balances Breakdown Cards */}
      <div className="space-y-3 pt-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Member Balance Summary
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {balances.map((bal) => {
            const member = group.members.find((m) => m.id === bal.memberId);
            const isSettled = Math.abs(bal.netBalancePaise) === 0;
            const getsBack = bal.netBalancePaise > 0;
            const owes = bal.netBalancePaise < 0;

            const isCurrent = currentMemberId === bal.memberId;

            return (
              <div
                key={bal.memberId}
                className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-xs flex flex-col justify-between ${
                  isCurrent
                    ? 'border-indigo-400 dark:border-indigo-700 ring-2 ring-indigo-500/10'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {/* Member Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={bal.name} color={member?.color} size="md" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1">
                        <span>{bal.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 rounded-full font-bold">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Paid: {formatINR(bal.totalPaid)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Net status */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">Net Balance</span>
                  <div className="text-right">
                    {isSettled && (
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                        Settled (₹0)
                      </span>
                    )}
                    {getsBack && (
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        Gets back {formatINR(bal.netBalance)}
                      </span>
                    )}
                    {owes && (
                      <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">
                        Owes {formatINR(Math.abs(bal.netBalance))}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settle Up Modal */}
      <SettleUpModal
        isOpen={settleModalState.isOpen}
        group={group}
        defaultPayerId={settleModalState.payerId}
        defaultReceiverId={settleModalState.receiverId}
        defaultAmount={settleModalState.amount}
        onSettle={(settlement) => {
          onRecordSettlement(settlement);
          setSettleModalState({ isOpen: false });
        }}
        onClose={() => setSettleModalState({ isOpen: false })}
      />
    </div>
  );
};
