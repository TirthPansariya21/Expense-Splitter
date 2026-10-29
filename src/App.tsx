/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Expense, Group } from './types';
import { getInitialDemoData } from './utils/demoData';
import { Navbar } from './components/Navbar';
import { HomeGroupList } from './components/HomeGroupList';
import { GroupDetail } from './components/GroupDetail';

export default function App() {
  const initialData = getInitialDemoData();

  const [groups, setGroups] = useLocalStorage<Group[]>('spliteasy_groups', initialData.groups);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('spliteasy_expenses', initialData.expenses);
  const [currentGroupId, setCurrentGroupId] = useLocalStorage<string | null>(
    'spliteasy_current_group_id',
    'grp-manali-trip'
  );
  const [currentMemberId, setCurrentMemberId] = useLocalStorage<string | null>(
    'spliteasy_current_member_id',
    'm-rahul'
  );
  const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>('spliteasy_dark_mode', false);

  // Sync dark class to HTML root element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Current active group object
  const currentGroup = groups.find((g) => g.id === currentGroupId) || null;

  // Handlers for Group operations
  const handleCreateGroup = (newGroup: Group) => {
    setGroups((prev) => [newGroup, ...prev]);
  };

  const handleUpdateGroup = (updatedGroup: Group) => {
    setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setExpenses((prev) => prev.filter((e) => e.groupId !== groupId));
    if (currentGroupId === groupId) {
      setCurrentGroupId(null);
    }
  };

  // Handlers for Expense operations
  const handleAddExpense = (newExpense: Expense) => {
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const handleUpdateExpense = (updatedExpense: Expense) => {
    setExpenses((prev) => prev.map((e) => (e.id === updatedExpense.id ? updatedExpense : e)));
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
  };

  // Reset to initial demo data
  const handleResetDemoData = () => {
    const fresh = getInitialDemoData();
    setGroups(fresh.groups);
    setExpenses(fresh.expenses);
    setCurrentGroupId('grp-manali-trip');
    setCurrentMemberId('m-rahul');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        currentGroupId={currentGroupId}
        onSelectGroup={(id) => setCurrentGroupId(id)}
        groupName={currentGroup?.name}
        groupEmoji={currentGroup?.emoji}
        members={currentGroup?.members || (groups.length > 0 ? groups[0].members : [])}
        currentMemberId={currentMemberId}
        onSelectCurrentMember={(memberId) => setCurrentMemberId(memberId)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onResetDemoData={handleResetDemoData}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentGroup ? (
          <GroupDetail
            group={currentGroup}
            expenses={expenses}
            currentMemberId={currentMemberId}
            isDarkMode={isDarkMode}
            onBack={() => setCurrentGroupId(null)}
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        ) : (
          <HomeGroupList
            groups={groups}
            expenses={expenses}
            currentMemberId={currentMemberId}
            onSelectGroup={(id) => setCurrentGroupId(id)}
            onCreateGroup={handleCreateGroup}
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>
          SplitEasy • Expense tracker & Greedy debt simplification for friends & trips • Built with React, TypeScript & Tailwind CSS
        </p>
      </footer>
    </div>
  );
}
