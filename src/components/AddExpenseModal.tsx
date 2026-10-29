import React, { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  Calendar,
  Check,
  Percent,
  Sliders,
  DollarSign,
  Scale,
} from 'lucide-react';
import { Expense, ExpenseCategory, Group, SplitType } from '../types';
import { CATEGORIES } from '../utils/constants';
import { formatINR, paiseToRupees, rupeesToPaise } from '../utils/formatCurrency';
import { calculateSplits } from '../utils/splitCalculator';
import { CategoryIcon } from './CategoryIcon';
import { Avatar } from './Avatar';

interface AddExpenseModalProps {
  isOpen: boolean;
  group: Group;
  expenseToEdit?: Expense | null;
  initialValues?: {
    description?: string;
    amount?: number;
    category?: ExpenseCategory;
    paidById?: string;
    splitWithIds?: string[];
    splitType?: SplitType;
    notes?: string;
  } | null;
  onSave: (expenseData: {
    description: string;
    amount: number;
    date: string;
    category: ExpenseCategory;
    paidById: string;
    splitType: SplitType;
    splits: any[];
    notes?: string;
  }) => void;
  onClose: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  group,
  expenseToEdit,
  initialValues,
  onSave,
  onClose,
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [paidById, setPaidById] = useState<string>('');
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');

  // Member selections for splits
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [exactAmounts, setExactAmounts] = useState<Record<string, number>>({});
  const [percentages, setPercentages] = useState<Record<string, number>>({});
  const [shares, setShares] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');

  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form state
  useEffect(() => {
    if (!isOpen) return;

    const allMemberIds = group.members.map((m) => m.id);

    if (expenseToEdit) {
      setDescription(expenseToEdit.description);
      setAmount(expenseToEdit.amount.toString());
      setDate(expenseToEdit.date);
      setCategory(expenseToEdit.category);
      setPaidById(expenseToEdit.paidById);
      setSplitType(expenseToEdit.splitType);
      setNotes(expenseToEdit.notes || '');

      const splitIds = expenseToEdit.splits.map((s) => s.memberId);
      setSelectedMemberIds(splitIds);

      const exactMap: Record<string, number> = {};
      const pctMap: Record<string, number> = {};
      const shareMap: Record<string, number> = {};

      expenseToEdit.splits.forEach((s) => {
        exactMap[s.memberId] = s.amount;
        if (s.percentage !== undefined) pctMap[s.memberId] = s.percentage;
        if (s.shares !== undefined) shareMap[s.memberId] = s.shares;
      });

      setExactAmounts(exactMap);
      setPercentages(pctMap);
      setShares(shareMap);
    } else if (initialValues) {
      setDescription(initialValues.description || '');
      setAmount(initialValues.amount ? initialValues.amount.toString() : '');
      setDate(new Date().toISOString().slice(0, 10));
      setCategory(initialValues.category || 'Food');
      setPaidById(initialValues.paidById || group.members[0]?.id || '');
      setSplitType(initialValues.splitType || 'EQUAL');
      setNotes(initialValues.notes || '');

      const targetSplitIds =
        initialValues.splitWithIds && initialValues.splitWithIds.length > 0
          ? initialValues.splitWithIds
          : allMemberIds;
      setSelectedMemberIds(targetSplitIds);

      // Default shares
      const defaultShares: Record<string, number> = {};
      targetSplitIds.forEach((id) => (defaultShares[id] = 1));
      setShares(defaultShares);

      // Default percentages
      const defaultPcts: Record<string, number> = {};
      const count = targetSplitIds.length || 1;
      const basePct = +(100 / count).toFixed(2);
      targetSplitIds.forEach((id) => (defaultPcts[id] = basePct));
      setPercentages(defaultPcts);

      // Default exact
      const defaultExact: Record<string, number> = {};
      const numAmount = initialValues.amount || 0;
      const baseExact = +(numAmount / count).toFixed(2);
      targetSplitIds.forEach((id) => (defaultExact[id] = baseExact));
      setExactAmounts(defaultExact);
    } else {
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setCategory('Food');
      setPaidById(group.members[0]?.id || '');
      setSplitType('EQUAL');
      setSelectedMemberIds(allMemberIds);
      setNotes('');

      // Default shares
      const sMap: Record<string, number> = {};
      allMemberIds.forEach((id) => (sMap[id] = 1));
      setShares(sMap);

      // Default percentages
      const pMap: Record<string, number> = {};
      const count = allMemberIds.length || 1;
      const basePct = +(100 / count).toFixed(2);
      allMemberIds.forEach((id) => (pMap[id] = basePct));
      setPercentages(pMap);

      setExactAmounts({});
    }

    setFormError(null);
  }, [isOpen, expenseToEdit, initialValues, group]);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;

  // Real-time calculation using splitCalculator
  const splitResult = calculateSplits({
    totalAmount: numAmount,
    splitType,
    selectedMemberIds,
    exactAmounts,
    percentages,
    shares,
  });

  const handleToggleMember = (id: string) => {
    let next: string[];
    if (selectedMemberIds.includes(id)) {
      if (selectedMemberIds.length === 1) {
        setFormError('At least one person must be included in the split.');
        return;
      }
      next = selectedMemberIds.filter((mId) => mId !== id);
    } else {
      next = [...selectedMemberIds, id];
    }
    setSelectedMemberIds(next);
    setFormError(null);

    // Rebalance default shares / percentages if needed
    if (splitType === 'PERCENT') {
      const pMap: Record<string, number> = {};
      const eq = +(100 / next.length).toFixed(2);
      next.forEach((mId) => (pMap[mId] = eq));
      setPercentages(pMap);
    }
  };

  const handleSelectAllMembers = () => {
    setSelectedMemberIds(group.members.map((m) => m.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      setFormError('Please enter what this expense was for.');
      return;
    }

    if (numAmount <= 0) {
      setFormError('Please enter a valid amount greater than ₹0.');
      return;
    }

    if (!paidById) {
      setFormError('Please select who paid for this expense.');
      return;
    }

    if (selectedMemberIds.length === 0) {
      setFormError('Please select at least one person to split with.');
      return;
    }

    if (!splitResult.isValid) {
      setFormError(splitResult.errorMessage || 'Invalid split breakdown.');
      return;
    }

    onSave({
      description: description.trim(),
      amount: numAmount,
      date,
      category,
      paidById,
      splitType,
      splits: splitResult.splits,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <CategoryIcon category={category} size={20} withBackground />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {expenseToEdit ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                in {group.emoji} {group.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-sm">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/40 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Amount & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setFormError(null);
                  }}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 text-base focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  autoFocus={!expenseToEdit}
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setFormError(null);
                }}
                placeholder="e.g. Dinner at cafe, Petrol, Groceries"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Date
              </label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
              >
                {Object.keys(CATEGORIES).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Who Paid */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Paid by
            </label>
            <div className="flex flex-wrap gap-2">
              {group.members.map((m) => {
                const isSelected = paidById === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaidById(m.id);
                      setFormError(null);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Avatar name={m.name} color={m.color} size="xs" />
                    <span>{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split Type Selector */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Split Method
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleSelectAllMembers}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Select all
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
              <button
                type="button"
                onClick={() => setSplitType('EQUAL')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  splitType === 'EQUAL'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Scale size={14} />
                <span>Equal</span>
              </button>
              <button
                type="button"
                onClick={() => setSplitType('EXACT')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  splitType === 'EXACT'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <DollarSign size={14} />
                <span>Exact</span>
              </button>
              <button
                type="button"
                onClick={() => setSplitType('PERCENT')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  splitType === 'PERCENT'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Percent size={14} />
                <span>Percent</span>
              </button>
              <button
                type="button"
                onClick={() => setSplitType('SHARES')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  splitType === 'SHARES'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Sliders size={14} />
                <span>Shares</span>
              </button>
            </div>
          </div>

          {/* Members Split Details */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-2">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Split among ({selectedMemberIds.length} included)</span>
              {numAmount > 0 && splitType === 'EQUAL' && selectedMemberIds.length > 0 && (
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  ≈ {formatINR(numAmount / selectedMemberIds.length)} / person
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {group.members.map((member) => {
                const isChecked = selectedMemberIds.includes(member.id);
                const currentSplit = splitResult.splits.find((s) => s.memberId === member.id);

                return (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between gap-3 p-2 rounded-xl transition-colors ${
                      isChecked
                        ? 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700'
                        : 'opacity-50 hover:opacity-75'
                    }`}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleMember(member.id)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <Avatar name={member.name} color={member.color} size="xs" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {member.name}
                      </span>
                    </label>

                    {/* Mode specific input */}
                    {isChecked && (
                      <div className="flex items-center gap-2">
                        {splitType === 'EQUAL' && (
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {formatINR(currentSplit?.amount || 0)}
                          </span>
                        )}

                        {splitType === 'EXACT' && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-400">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={exactAmounts[member.id] !== undefined ? exactAmounts[member.id] : ''}
                              onChange={(e) => {
                                setExactAmounts({
                                  ...exactAmounts,
                                  [member.id]: parseFloat(e.target.value) || 0,
                                });
                                setFormError(null);
                              }}
                              placeholder="0"
                              className="w-20 px-2 py-1 text-right text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        )}

                        {splitType === 'PERCENT' && (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={percentages[member.id] !== undefined ? percentages[member.id] : ''}
                              onChange={(e) => {
                                setPercentages({
                                  ...percentages,
                                  [member.id]: parseFloat(e.target.value) || 0,
                                });
                                setFormError(null);
                              }}
                              placeholder="0"
                              className="w-16 px-2 py-1 text-right text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500"
                            />
                            <span className="text-xs text-slate-400">%</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 min-w-[50px] text-right">
                              ({formatINR(currentSplit?.amount || 0)})
                            </span>
                          </div>
                        )}

                        {splitType === 'SHARES' && (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={shares[member.id] !== undefined ? shares[member.id] : 1}
                              onChange={(e) => {
                                setShares({
                                  ...shares,
                                  [member.id]: Math.max(0, parseInt(e.target.value, 10) || 0),
                                });
                                setFormError(null);
                              }}
                              className="w-14 px-2 py-1 text-center text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500"
                            />
                            <span className="text-[11px] text-slate-400">shares</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 min-w-[50px] text-right">
                              ({formatINR(currentSplit?.amount || 0)})
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Split Type Helper / Error message */}
            {!splitResult.isValid && splitResult.errorMessage && (
              <p className="text-[11px] text-rose-500 font-medium pt-1">
                ⚠️ {splitResult.errorMessage}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Google Pay transaction ID, or bill breakdown"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={numAmount <= 0 || !splitResult.isValid}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check size={15} />
              <span>{expenseToEdit ? 'Save Changes' : 'Record Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
