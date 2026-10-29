import React, { useState } from 'react';
import { Sparkles, X, Loader2, ArrowRight, Lightbulb, AlertCircle } from 'lucide-react';
import { ExpenseCategory, Group, SplitType } from '../types';

interface QuickAddAIModalProps {
  isOpen: boolean;
  group: Group;
  currentMemberId: string | null;
  onParsed: (parsedData: {
    description: string;
    amount: number;
    category: ExpenseCategory;
    paidById: string;
    splitWithIds: string[];
    splitType: SplitType;
    notes?: string;
  }) => void;
  onClose: () => void;
}

export const QuickAddAIModal: React.FC<QuickAddAIModalProps> = ({
  isOpen,
  group,
  currentMemberId,
  onParsed,
  onClose,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const memberNames = group.members.map((m) => m.name);
  const activeMember = group.members.find((m) => m.id === currentMemberId);

  // Dynamic sample prompts based on group member names
  const samplePrompts = [
    `Dinner 1200 paid by ${group.members[0]?.name || 'Rahul'}, split between ${group.members.slice(0, 3).map((m) => m.name).join(', ')}`,
    `Cab 650 paid by ${group.members[1]?.name || group.members[0]?.name || 'Amit'} for everyone`,
    `Hostel WiFi bill 999 paid by ${activeMember ? activeMember.name : group.members[0]?.name} split equally`,
    `Snacks & Maggie 350 paid by ${group.members[group.members.length - 1]?.name || 'Sneha'}`,
  ];

  // Client-side heuristic fallback parser if API is offline or returns error
  const fallbackParse = (text: string) => {
    // Extract amount: numbers like 1200, 1.2k, 450, etc.
    let amount = 0;
    const kMatch = text.match(/(\d+(?:\.\d+)?)\s*k\b/i);
    if (kMatch) {
      amount = parseFloat(kMatch[1]) * 1000;
    } else {
      const numMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d{1,2})?)/i);
      if (numMatch) {
        amount = parseFloat(numMatch[1]);
      }
    }

    // Infer category
    let category: ExpenseCategory = 'Other';
    const lower = text.toLowerCase();
    if (lower.includes('dinner') || lower.includes('lunch') || lower.includes('food') || lower.includes('pizza') || lower.includes('cafe') || lower.includes('maggie') || lower.includes('chai') || lower.includes('breakfast')) {
      category = 'Food';
    } else if (lower.includes('cab') || lower.includes('taxi') || lower.includes('bus') || lower.includes('flight') || lower.includes('train') || lower.includes('travel') || lower.includes('petrol') || lower.includes('fuel')) {
      category = 'Travel';
    } else if (lower.includes('hotel') || lower.includes('room') || lower.includes('stay') || lower.includes('resort') || lower.includes('cottage')) {
      category = 'Stay';
    } else if (lower.includes('bill') || lower.includes('wifi') || lower.includes('electricity') || lower.includes('rent') || lower.includes('recharge')) {
      category = 'Bills';
    } else if (lower.includes('shopping') || lower.includes('shawl') || lower.includes('clothes') || lower.includes('souvenir')) {
      category = 'Shopping';
    }

    // Infer payer
    let payerId = group.members[0]?.id;
    for (const member of group.members) {
      const firstName = member.name.split(' ')[0].toLowerCase();
      if (lower.includes(`paid by ${firstName}`) || lower.includes(`by ${firstName}`) || lower.includes(member.name.toLowerCase())) {
        payerId = member.id;
        break;
      }
    }
    if ((lower.includes('paid by me') || lower.includes('i paid')) && activeMember) {
      payerId = activeMember.id;
    }

    // Infer participants
    let splitWithIds: string[] = [];
    for (const member of group.members) {
      const firstName = member.name.split(' ')[0].toLowerCase();
      if (lower.includes(firstName) || lower.includes(member.name.toLowerCase())) {
        splitWithIds.push(member.id);
      }
    }
    if (splitWithIds.length === 0 || lower.includes('everyone') || lower.includes('split equally') || lower.includes('all')) {
      splitWithIds = group.members.map((m) => m.id);
    }

    // Description
    let desc = text.replace(/(?:paid by\s+\w+|for\s+everyone|split\s+between.*)/gi, '').trim();
    if (!desc) desc = `${category} Expense`;

    return {
      description: desc,
      amount: amount || 500,
      category,
      paidById: payerId,
      splitWithIds,
      splitType: 'EQUAL' as SplitType,
      notes: `Parsed via smart offline parser from: "${text}"`,
    };
  };

  const handleParse = async (inputPrompt: string) => {
    const text = inputPrompt.trim();
    if (!text) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/gemini/parse-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          members: memberNames,
          categories: ['Food', 'Travel', 'Stay', 'Shopping', 'Bills', 'Other'],
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Server error while parsing.');
      }

      const parsed = json.data;

      // Map parsed paidByName to member ID
      let payerId = group.members[0]?.id;
      if (parsed.paidByName) {
        const query = parsed.paidByName.toLowerCase();
        if ((query === 'me' || query === 'i' || query === 'myself') && activeMember) {
          payerId = activeMember.id;
        } else {
          const match = group.members.find((m) =>
            m.name.toLowerCase().includes(query) || query.includes(m.name.toLowerCase())
          );
          if (match) payerId = match.id;
        }
      }

      // Map splitWithNames
      let splitWithIds: string[] = [];
      if (Array.isArray(parsed.splitWithNames) && parsed.splitWithNames.length > 0) {
        for (const name of parsed.splitWithNames) {
          const query = name.toLowerCase();
          const match = group.members.find((m) =>
            m.name.toLowerCase().includes(query) || query.includes(m.name.toLowerCase())
          );
          if (match && !splitWithIds.includes(match.id)) {
            splitWithIds.push(match.id);
          }
        }
      }

      if (splitWithIds.length === 0) {
        splitWithIds = group.members.map((m) => m.id);
      }

      onParsed({
        description: parsed.description || 'Expense',
        amount: Math.abs(Number(parsed.amount)) || 0,
        category: (parsed.category as ExpenseCategory) || 'Other',
        paidById: payerId,
        splitWithIds,
        splitType: 'EQUAL',
        notes: parsed.notes || `Parsed with AI: "${text}"`,
      });
    } catch (err: any) {
      console.warn('Gemini API call failed, using graceful offline fallback parser:', err);
      // Fallback gracefully so user is NEVER blocked
      const fallback = fallbackParse(text);
      onParsed(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 text-white shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>Quick Add with AI</span>
                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                  Gemini
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Type in natural speech; AI extracts the amount, payer, and splits
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
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-400">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Natural Language Expense
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Dinner 1200 paid by Rahul, split between Amit, Rahul and Sneha"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none"
              autoFocus
            />
          </div>

          {/* Sample Pills */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <Lightbulb size={13} className="text-amber-500" />
              <span>Click to try a sample:</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {samplePrompts.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(sample);
                    handleParse(sample);
                  }}
                  className="text-left px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isLoading || !prompt.trim()}
              onClick={() => handleParse(prompt)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Parsing with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Parse & Prefill</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
