import React, { useState, useEffect } from 'react';
import { X, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Group, Member } from '../types';
import { Avatar } from './Avatar';
import { formatINR, rupeesToPaise } from '../utils/formatCurrency';

interface SettleUpModalProps {
  isOpen: boolean;
  group: Group;
  defaultPayerId?: string;
  defaultReceiverId?: string;
  defaultAmount?: number;
  onSettle: (settlement: {
    payerId: string;
    receiverId: string;
    amount: number;
    date: string;
    notes: string;
  }) => void;
  onClose: () => void;
}

export const SettleUpModal: React.FC<SettleUpModalProps> = ({
  isOpen,
  group,
  defaultPayerId,
  defaultReceiverId,
  defaultAmount,
  onSettle,
  onClose,
}) => {
  const [payerId, setPayerId] = useState<string>('');
  const [receiverId, setReceiverId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('UPI / Cash settlement');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const initialPayer = defaultPayerId || group.members[0]?.id || '';
    const initialReceiver =
      defaultReceiverId || group.members.find((m) => m.id !== initialPayer)?.id || '';

    setPayerId(initialPayer);
    setReceiverId(initialReceiver);
    setAmount(defaultAmount ? defaultAmount.toString() : '');
    setDate(new Date().toISOString().slice(0, 10));
    setNotes('Settled via UPI');
    setError(null);
  }, [isOpen, defaultPayerId, defaultReceiverId, defaultAmount, group]);

  if (!isOpen) return null;

  const payer = group.members.find((m) => m.id === payerId);
  const receiver = group.members.find((m) => m.id === receiverId);
  const numAmount = parseFloat(amount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!payerId || !receiverId) {
      setError('Please select both payer and receiver.');
      return;
    }

    if (payerId === receiverId) {
      setError('Payer and receiver cannot be the same person.');
      return;
    }

    if (numAmount <= 0) {
      setError('Please enter a valid amount greater than ₹0.');
      return;
    }

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#4f46e5', '#10b981', '#f59e0b', '#06b6d4'],
      });
    } catch {
      // ignore in environments without canvas
    }

    onSettle({
      payerId,
      receiverId,
      amount: numAmount,
      date,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Record Settlement
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mark a debt as paid between two members
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/40 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Visual flow: Payer -> Receiver */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
            {/* Payer */}
            <div className="flex-1 text-center">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Who Paid
              </span>
              <div className="flex flex-col items-center gap-1.5">
                <Avatar name={payer?.name || 'Payer'} color={payer?.color} size="lg" />
                <select
                  value={payerId}
                  onChange={(e) => {
                    setPayerId(e.target.value);
                    setError(null);
                  }}
                  className="mt-1 w-full text-center text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1 px-1 text-slate-800 dark:text-slate-200"
                >
                  {group.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Transfer arrow */}
            <div className="flex flex-col items-center justify-center shrink-0 px-2 text-indigo-500">
              <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <ArrowRight size={16} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                pays
              </span>
            </div>

            {/* Receiver */}
            <div className="flex-1 text-center">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Who Received
              </span>
              <div className="flex flex-col items-center gap-1.5">
                <Avatar name={receiver?.name || 'Receiver'} color={receiver?.color} size="lg" />
                <select
                  value={receiverId}
                  onChange={(e) => {
                    setReceiverId(e.target.value);
                    setError(null);
                  }}
                  className="mt-1 w-full text-center text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1 px-1 text-slate-800 dark:text-slate-200"
                >
                  {group.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Settlement Amount (₹)
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
                  setError(null);
                }}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 text-base focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                autoFocus
              />
            </div>
            {numAmount > 0 && (
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {payer?.name} transferred {formatINR(numAmount)} to {receiver?.name}
              </p>
            )}
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Payment Mode / Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Google Pay, PhonePe, Cash"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={numAmount <= 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} />
              <span>Confirm Settlement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
