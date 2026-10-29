import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Expense, Group } from '../types';
import { CATEGORIES } from '../utils/constants';
import { formatINR } from '../utils/formatCurrency';
import { calculateMemberBalances } from '../utils/settleUp';
import { TrendingUp, PieChart as PieIcon, BarChart3, Award, CreditCard } from 'lucide-react';

interface GroupInsightsProps {
  group: Group;
  expenses: Expense[];
  isDarkMode: boolean;
}

export const GroupInsights: React.FC<GroupInsightsProps> = ({
  group,
  expenses,
  isDarkMode,
}) => {
  // Exclude settlement entries from analytics spend to reflect pure consumption
  const nonSettlementExpenses = expenses.filter((e) => !e.isSettlement);

  const totalSpend = nonSettlementExpenses.reduce((sum, e) => sum + e.amount, 0);
  const avgSpendPerMember = group.members.length > 0 ? totalSpend / group.members.length : 0;

  // Category breakdown
  const categorySpendMap: Record<string, number> = {};
  nonSettlementExpenses.forEach((exp) => {
    categorySpendMap[exp.category] = (categorySpendMap[exp.category] || 0) + exp.amount;
  });

  const categoryData = Object.entries(categorySpendMap)
    .map(([cat, amount]) => ({
      name: cat,
      amount: Math.round(amount),
      color: CATEGORIES[cat as keyof typeof CATEGORIES]?.color || '#64748b',
    }))
    .sort((a, b) => b.amount - a.amount);

  // Member spend vs share breakdown
  const balances = calculateMemberBalances(group.members, nonSettlementExpenses);
  const memberComparisonData = balances.map((bal) => ({
    name: bal.name.split(' ')[0], // first name for clean axis labels
    fullName: bal.name,
    Paid: Math.round(bal.totalPaid),
    Share: Math.round(bal.totalOwed),
  }));

  // Top spender
  const topSpender = [...balances].sort((a, b) => b.totalPaid - a.totalPaid)[0];
  const topCategory = categoryData[0];

  if (nonSettlementExpenses.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
          <PieIcon size={28} />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          No insights available yet
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
          Add a few expenses to view charts, category breakdowns, and spending comparisons.
        </p>
      </div>
    );
  }

  const tooltipBg = isDarkMode ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDarkMode ? '#1e293b' : '#e2e8f0';
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Spend */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Spent</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
            {formatINR(totalSpend)}
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 block">
            across {nonSettlementExpenses.length} expenses
          </span>
        </div>

        {/* Avg Per Person */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg / Person</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
            {formatINR(avgSpendPerMember)}
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 block">
            {group.members.length} members in group
          </span>
        </div>

        {/* Top Spender */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Top Spender</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Award size={16} />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 truncate">
            {topSpender?.name || 'N/A'}
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 block">
            Paid {formatINR(topSpender?.totalPaid || 0)}
          </span>
        </div>

        {/* Top Category */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Top Category</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <PieIcon size={16} />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 truncate">
            {topCategory?.name || 'N/A'}
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 block">
            {topCategory ? `${formatINR(topCategory.amount)} (${Math.round((topCategory.amount / totalSpend) * 100)}%)` : ''}
          </span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Donut Chart */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <PieIcon size={18} className="text-indigo-600 dark:text-indigo-400" />
                <span>Category Breakdown</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Spending distribution by category
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="amount"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const pct = ((data.amount / totalSpend) * 100).toFixed(1);
                      return (
                        <div
                          style={{
                            backgroundColor: tooltipBg,
                            borderColor: tooltipBorder,
                            color: textColor,
                          }}
                          className="p-2.5 rounded-xl border shadow-lg text-xs"
                        >
                          <p className="font-bold">{data.name}</p>
                          <p className="font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                            {formatINR(data.amount)} ({pct}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Legend list */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-slate-600 dark:text-slate-400 truncate">{cat.name}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 ml-auto text-[11px]">
                  {formatINR(cat.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Member Spending Comparison Bar Chart */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 size={18} className="text-indigo-600 dark:text-indigo-400" />
                <span>Paid vs Share per Member</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Who spent upfront vs who consumed
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={memberComparisonData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDarkMode ? '#1e293b' : '#f1f5f9'}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke={isDarkMode ? '#64748b' : '#94a3b8'}
                  tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                />
                <YAxis
                  stroke={isDarkMode ? '#64748b' : '#94a3b8'}
                  tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div
                          style={{
                            backgroundColor: tooltipBg,
                            borderColor: tooltipBorder,
                            color: textColor,
                          }}
                          className="p-3 rounded-xl border shadow-lg text-xs space-y-1"
                        >
                          <p className="font-bold text-sm">{data.fullName}</p>
                          <p className="text-indigo-600 dark:text-indigo-400 font-semibold">
                            Paid Upfront: {formatINR(data.Paid)}
                          </p>
                          <p className="text-amber-600 dark:text-amber-400 font-semibold">
                            Actual Share: {formatINR(data.Share)}
                          </p>
                          <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                            Net:{' '}
                            <span
                              className={
                                data.Paid >= data.Share ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'
                              }
                            >
                              {data.Paid >= data.Share ? '+' : ''}
                              {formatINR(data.Paid - data.Share)}
                            </span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                  formatter={(val) => (
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {val === 'Paid' ? 'Paid Upfront' : 'Actual Share'}
                    </span>
                  )}
                />
                <Bar dataKey="Paid" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Share" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
