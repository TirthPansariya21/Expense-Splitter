import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  Settings,
  Trash2,
  Plus,
  Sparkles,
  Receipt,
  Scale,
  BarChart3,
  Users,
} from 'lucide-react';
import { Expense, Group, SplitType } from '../types';
import { Avatar } from './Avatar';
import { ExpenseList } from './ExpenseList';
import { BalancesAndSettleUp } from './BalancesAndSettleUp';
import { GroupInsights } from './GroupInsights';
import { AddExpenseModal } from './AddExpenseModal';
import { QuickAddAIModal } from './QuickAddAIModal';
import { GroupModal } from './GroupModal';
import { ConfirmModal } from './ConfirmModal';
import { exportGroupToCSV } from '../utils/csvExport';
import { simplifyDebts } from '../utils/settleUp';
import { formatINR, rupeesToPaise } from '../utils/formatCurrency';

interface GroupDetailProps {
  group: Group;
  expenses: Expense[];
  currentMemberId: string | null;
  isDarkMode: boolean;
  onBack: () => void;
  onUpdateGroup: (group: Group) => void;
  onDeleteGroup: (groupId: string) => void;
  onAddExpense: (expense: Expense) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const GroupDetail: React.FC<GroupDetailProps> = ({
  group,
  expenses,
  currentMemberId,
  isDarkMode,
  onBack,
  onUpdateGroup,
  onDeleteGroup,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'insights'>('expenses');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isQuickAddAIOpen, setIsQuickAddAIOpen] = useState(false);
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [isDeleteGroupOpen, setIsDeleteGroupOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [prefilledFromAI, setPrefilledFromAI] = useState<any | null>(null);

  // Group specific expenses
  const groupExpenses = expenses.filter((e) => e.groupId === group.id);
  const simplification = simplifyDebts(group.members, groupExpenses);

  const handleSaveExpense = (data: any) => {
    if (expenseToEdit) {
      const updated: Expense = {
        ...expenseToEdit,
        description: data.description,
        amount: data.amount,
        amountPaise: rupeesToPaise(data.amount),
        date: data.date,
        category: data.category,
        paidById: data.paidById,
        splitType: data.splitType,
        splits: data.splits,
        notes: data.notes,
      };
      onUpdateExpense(updated);
      setExpenseToEdit(null);
    } else {
      const newExp: Expense = {
        id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        groupId: group.id,
        description: data.description,
        amount: data.amount,
        amountPaise: rupeesToPaise(data.amount),
        date: data.date,
        category: data.category,
        paidById: data.paidById,
        splitType: data.splitType,
        splits: data.splits,
        notes: data.notes,
        createdAt: new Date().toISOString(),
      };
      onAddExpense(newExp);
    }
    setIsAddExpenseOpen(false);
    setPrefilledFromAI(null);
  };

  const handleRecordSettlement = (settlement: {
    payerId: string;
    receiverId: string;
    amount: number;
    date: string;
    notes: string;
  }) => {
    const payer = group.members.find((m) => m.id === settlement.payerId);
    const receiver = group.members.find((m) => m.id === settlement.receiverId);
    const amountPaise = rupeesToPaise(settlement.amount);

    const settlementExpense: Expense = {
      id: `exp-settle-${Date.now()}`,
      groupId: group.id,
      description: `${payer?.name || 'Debtor'} paid ${receiver?.name || 'Creditor'} (Settlement)`,
      amount: settlement.amount,
      amountPaise,
      date: settlement.date,
      category: 'Other',
      paidById: settlement.payerId,
      splitType: 'EXACT',
      splits: [
        {
          memberId: settlement.receiverId,
          amountPaise,
          amount: settlement.amount,
        },
      ],
      isSettlement: true,
      settlementDetails: {
        fromMemberId: settlement.payerId,
        toMemberId: settlement.receiverId,
      },
      notes: settlement.notes,
      createdAt: new Date().toISOString(),
    };

    onAddExpense(settlementExpense);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Group Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        {/* Back and Action Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>All Groups</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportGroupToCSV(group, groupExpenses)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Download Excel / CSV statement"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={() => setIsEditGroupOpen(true)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Edit Group"
            >
              <Settings size={15} />
            </button>

            <button
              onClick={() => setIsDeleteGroupOpen(true)}
              className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
              title="Delete Group"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Group Identity */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="text-4xl p-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shrink-0">
              {group.emoji}
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                {group.name}
              </h1>
              {group.description && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {group.description}
                </p>
              )}

              {/* Members Avatars List */}
              <div className="flex items-center gap-2 mt-2.5">
                <div className="flex -space-x-1.5 overflow-hidden">
                  {group.members.map((m) => (
                    <Avatar key={m.id} name={m.name} color={m.color} size="sm" showTooltip />
                  ))}
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {group.members.length} members
                </span>
              </div>
            </div>
          </div>

          {/* Quick Add CTA Buttons */}
          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <button
              type="button"
              onClick={() => setIsQuickAddAIOpen(true)}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-2xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles size={15} />
              <span>Quick Add AI</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setExpenseToEdit(null);
                setPrefilledFromAI(null);
                setIsAddExpenseOpen(true);
              }}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Receipt size={14} />
            <span>Expenses</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'expenses'
                  ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {groupExpenses.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('balances')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'balances'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Scale size={14} />
            <span>Balances & Settle</span>
            {simplification.transactions.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold">
                {simplification.transactions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'insights'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 size={14} />
            <span>Insights</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'expenses' && (
        <ExpenseList
          group={group}
          expenses={groupExpenses}
          currentMemberId={currentMemberId}
          onAddExpense={() => {
            setExpenseToEdit(null);
            setPrefilledFromAI(null);
            setIsAddExpenseOpen(true);
          }}
          onQuickAddAI={() => setIsQuickAddAIOpen(true)}
          onEditExpense={(expense) => {
            setExpenseToEdit(expense);
            setPrefilledFromAI(null);
            setIsAddExpenseOpen(true);
          }}
          onDeleteExpense={onDeleteExpense}
        />
      )}

      {activeTab === 'balances' && (
        <BalancesAndSettleUp
          group={group}
          expenses={groupExpenses}
          currentMemberId={currentMemberId}
          onRecordSettlement={handleRecordSettlement}
        />
      )}

      {activeTab === 'insights' && (
        <GroupInsights group={group} expenses={groupExpenses} isDarkMode={isDarkMode} />
      )}

      {/* Add / Edit Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        group={group}
        expenseToEdit={expenseToEdit}
        initialValues={prefilledFromAI}
        onSave={handleSaveExpense}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setExpenseToEdit(null);
          setPrefilledFromAI(null);
        }}
      />

      {/* Quick Add with AI Modal */}
      <QuickAddAIModal
        isOpen={isQuickAddAIOpen}
        group={group}
        currentMemberId={currentMemberId}
        onParsed={(parsedData) => {
          setIsQuickAddAIOpen(false);
          setExpenseToEdit(null);
          setPrefilledFromAI(parsedData);
          setIsAddExpenseOpen(true);
        }}
        onClose={() => setIsQuickAddAIOpen(false)}
      />

      {/* Edit Group Modal */}
      <GroupModal
        isOpen={isEditGroupOpen}
        groupToEdit={group}
        existingExpenses={expenses}
        onSave={(data) => {
          onUpdateGroup({
            ...group,
            name: data.name,
            emoji: data.emoji,
            description: data.description,
            members: data.members,
            updatedAt: new Date().toISOString(),
          });
          setIsEditGroupOpen(false);
        }}
        onClose={() => setIsEditGroupOpen(false)}
      />

      {/* Delete Group Confirm */}
      <ConfirmModal
        isOpen={isDeleteGroupOpen}
        title="Delete Group?"
        message={`Are you sure you want to delete "${group.name}"? All ${groupExpenses.length} associated expenses and settlement records will be permanently removed.`}
        confirmText="Delete Group"
        confirmVariant="danger"
        onConfirm={() => {
          setIsDeleteGroupOpen(false);
          onDeleteGroup(group.id);
        }}
        onCancel={() => setIsDeleteGroupOpen(false)}
      />
    </div>
  );
};
