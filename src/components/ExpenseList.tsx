import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Sparkles,
  ArrowUpDown,
  Edit2,
  Trash2,
  Receipt,
  Users,
} from 'lucide-react';
import { Expense, ExpenseCategory, Group, Member } from '../types';
import { CATEGORIES } from '../utils/constants';
import { formatINR } from '../utils/formatCurrency';
import { CategoryIcon } from './CategoryIcon';
import { Avatar } from './Avatar';
import { ConfirmModal } from './ConfirmModal';

interface ExpenseListProps {
  group: Group;
  expenses: Expense[];
  currentMemberId: string | null;
  onAddExpense: () => void;
  onQuickAddAI: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  group,
  expenses,
  currentMemberId,
  onAddExpense,
  onQuickAddAI,
  onEditExpense,
  onDeleteExpense,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'All'>('All');
  const [selectedPayer, setSelectedPayer] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const memberMap = useMemo(() => {
    const map = new Map<string, Member>();
    group.members.forEach((m) => map.set(m.id, m));
    return map;
  }, [group.members]);

  // Filter & Sort expenses
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((exp) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const payerName = memberMap.get(exp.paidById)?.name.toLowerCase() || '';
          const matchDesc = exp.description.toLowerCase().includes(q);
          const matchNotes = (exp.notes || '').toLowerCase().includes(q);
          const matchPayer = payerName.includes(q);
          if (!matchDesc && !matchNotes && !matchPayer) return false;
        }

        // Category filter
        if (selectedCategory !== 'All' && exp.category !== selectedCategory) {
          return false;
        }

        // Payer filter
        if (selectedPayer !== 'All' && exp.paidById !== selectedPayer) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt.localeCompare(a.createdAt);
        }
        if (sortBy === 'date-asc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime() || a.createdAt.localeCompare(b.createdAt);
        }
        if (sortBy === 'amount-desc') {
          return b.amount - a.amount;
        }
        if (sortBy === 'amount-asc') {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [expenses, searchQuery, selectedCategory, selectedPayer, sortBy, memberMap]);

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search description, payer, or notes..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onQuickAddAI}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Type natural speech to add with Gemini AI"
          >
            <Sparkles size={15} />
            <span>Quick Add AI</span>
          </button>
          <button
            type="button"
            onClick={onAddExpense}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filter Row: Categories + Payer + Sort */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            All Categories
          </button>
          {(Object.keys(CATEGORIES) as ExpenseCategory[]).map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <CategoryIcon category={cat} size={13} />
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Payer and Sort dropdowns */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Payer Filter */}
          <select
            value={selectedPayer}
            onChange={(e) => setSelectedPayer(e.target.value)}
            className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="All">All Payers</option>
            {group.members.map((m) => (
              <option key={m.id} value={m.id}>
                Paid by {m.name}
              </option>
            ))}
          </select>

          {/* Sort */}
          <div className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300">
            <ArrowUpDown size={12} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-medium bg-transparent border-0 focus:outline-hidden cursor-pointer"
            >
              <option value="date-desc">Newest Date</option>
              <option value="date-asc">Oldest Date</option>
              <option value="amount-desc">Amount: High to Low</option>
              <option value="amount-asc">Amount: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expense List Cards */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
            <Receipt size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            No expenses found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            {expenses.length === 0
              ? 'This group has no expenses yet. Add your first expense or use Quick Add with AI!'
              : 'No expenses match the current search or filters.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={onQuickAddAI}
              className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              Try Quick Add AI
            </button>
            <button
              onClick={onAddExpense}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Add Expense
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredExpenses.map((expense) => {
            const payer = memberMap.get(expense.paidById);
            const isSettlement = expense.isSettlement;

            // Formatted date
            const dateObj = new Date(expense.date);
            const formattedDate = !isNaN(dateObj.getTime())
              ? dateObj.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : expense.date;

            // Current user perspective calculation
            let userShareInfo: { text: string; color: string } | null = null;
            if (currentMemberId) {
              const userSplit = expense.splits.find((s) => s.memberId === currentMemberId);
              const isPayer = expense.paidById === currentMemberId;

              if (isPayer && userSplit) {
                const getsBack = expense.amount - userSplit.amount;
                userShareInfo = {
                  text: `You paid ${formatINR(expense.amount)} (lent ${formatINR(getsBack)})`,
                  color: 'text-emerald-600 dark:text-emerald-400',
                };
              } else if (isPayer && !userSplit) {
                userShareInfo = {
                  text: `You paid ${formatINR(expense.amount)} (lent full amount)`,
                  color: 'text-emerald-600 dark:text-emerald-400',
                };
              } else if (!isPayer && userSplit) {
                userShareInfo = {
                  text: `You owe ${formatINR(userSplit.amount)}`,
                  color: 'text-rose-600 dark:text-rose-400',
                };
              } else {
                userShareInfo = {
                  text: 'Not involved',
                  color: 'text-slate-400',
                };
              }
            }

            return (
              <div
                key={expense.id}
                className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all hover:shadow-md flex items-center justify-between gap-3 group ${
                  isSettlement
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {/* Left: Category Icon & Details */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <CategoryIcon
                    category={isSettlement ? 'Settlement' : expense.category}
                    size={20}
                    withBackground
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {expense.description}
                      </h4>
                      {isSettlement && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                          Settlement
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <Avatar name={payer?.name || 'Payer'} color={payer?.color} size="xs" />
                        <span>Paid by {payer?.name || 'Unknown'}</span>
                      </span>

                      {!isSettlement && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium">
                            <Users size={11} className="text-slate-400" />
                            <span>
                              {expense.splitType.toLowerCase()} ({expense.splits.length})
                            </span>
                          </span>
                        </>
                      )}

                      {userShareInfo && (
                        <>
                          <span>•</span>
                          <span className={`font-semibold ${userShareInfo.color}`}>
                            {userShareInfo.text}
                          </span>
                        </>
                      )}
                    </div>

                    {expense.notes && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-1">
                        Memo: {expense.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Amount & Quick Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div
                      className={`text-base font-extrabold ${
                        isSettlement
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {formatINR(expense.amount)}
                    </div>
                  </div>

                  {/* Edit / Delete Buttons */}
                  <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isSettlement && (
                      <button
                        type="button"
                        onClick={() => onEditExpense(expense)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit expense"
                      >
                        <Edit2 size={15} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setExpenseToDelete(expense)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Delete expense"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={expenseToDelete !== null}
        title="Delete Expense?"
        message={`Are you sure you want to delete "${expenseToDelete?.description}" (${formatINR(expenseToDelete?.amount || 0)})? This will recalculate all member balances immediately.`}
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={() => {
          if (expenseToDelete) {
            onDeleteExpense(expenseToDelete.id);
            setExpenseToDelete(null);
          }
        }}
        onCancel={() => setExpenseToDelete(null)}
      />
    </div>
  );
};
