import React, { useState } from 'react';
import {
  Plus,
  Users,
  TrendingUp,
  ArrowRight,
  MoreVertical,
  Edit2,
  Trash2,
  Sparkles,
  Wallet,
  CheckCircle,
} from 'lucide-react';
import { Expense, Group, Member } from '../types';
import { formatINR } from '../utils/formatCurrency';
import { calculateMemberBalances } from '../utils/settleUp';
import { Avatar } from './Avatar';
import { GroupModal } from './GroupModal';
import { ConfirmModal } from './ConfirmModal';

interface HomeGroupListProps {
  groups: Group[];
  expenses: Expense[];
  currentMemberId: string | null;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (group: Group) => void;
  onUpdateGroup: (group: Group) => void;
  onDeleteGroup: (groupId: string) => void;
}

export const HomeGroupList: React.FC<HomeGroupListProps> = ({
  groups,
  expenses,
  currentMemberId,
  onSelectGroup,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<Group | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Overall stats
  const totalSpendAcrossGroups = expenses
    .filter((e) => !e.isSettlement)
    .reduce((sum, e) => sum + e.amount, 0);

  // Overall net balance for current active member
  let overallNetBalance = 0;
  if (currentMemberId) {
    for (const exp of expenses) {
      if (exp.paidById === currentMemberId) {
        overallNetBalance += exp.amount;
      }
      const userSplit = exp.splits.find((s) => s.memberId === currentMemberId);
      if (userSplit) {
        overallNetBalance -= userSplit.amount;
      }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Welcome & Stats Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-sky-600 text-white shadow-xl relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-sky-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles size={13} />
              <span>Hostel & Trip Expense Splitter</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Split expenses with friends without awkward math.
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 mt-2 leading-relaxed">
              Track road trips, flat groceries, and outings. Settle up debts with minimal transactions using smart greedy reduction.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 font-extrabold text-sm shadow-lg shadow-black/10 transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Plus size={18} />
              <span>Create New Group</span>
            </button>
          </div>
        </div>

        {/* Global Stats Counter */}
        <div className="relative z-10 mt-6 pt-6 border-t border-white/20 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
              Active Groups
            </span>
            <div className="text-xl sm:text-2xl font-black mt-0.5">
              {groups.length}
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
              Total Expenses Tracked
            </span>
            <div className="text-xl sm:text-2xl font-black mt-0.5">
              {formatINR(totalSpendAcrossGroups)}
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
              {currentMemberId ? 'Your Net Balance' : 'Ledger Status'}
            </span>
            <div className="text-xl sm:text-2xl font-black mt-0.5">
              {currentMemberId ? (
                overallNetBalance > 0 ? (
                  <span className="text-emerald-300">+{formatINR(overallNetBalance)}</span>
                ) : overallNetBalance < 0 ? (
                  <span className="text-rose-300">-{formatINR(Math.abs(overallNetBalance))}</span>
                ) : (
                  <span className="text-indigo-200">Settled up</span>
                )
              ) : (
                <span className="text-indigo-100 text-base font-bold">
                  {expenses.length} transactions
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Group Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Your Groups</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
              {groups.length}
            </span>
          </h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} />
            <span>New Group</span>
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
              <Users size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No groups yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              Create a group for your trip, hostel room, or dinner party to start splitting bills.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/20"
            >
              Create Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group) => {
              const groupExpenses = expenses.filter((e) => e.groupId === group.id);
              const groupTotal = groupExpenses
                .filter((e) => !e.isSettlement)
                .reduce((sum, e) => sum + e.amount, 0);

              // Calculate user's net balance in this group
              let userNetInGroup = 0;
              let isUserInGroup = false;

              if (currentMemberId) {
                isUserInGroup = group.members.some((m) => m.id === currentMemberId);
                if (isUserInGroup) {
                  const balances = calculateMemberBalances(group.members, groupExpenses);
                  const userBal = balances.find((b) => b.memberId === currentMemberId);
                  userNetInGroup = userBal ? userBal.netBalance : 0;
                }
              }

              return (
                <div
                  key={group.id}
                  onClick={() => onSelectGroup(group.id)}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all shadow-xs hover:shadow-lg cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    {/* Top row: Emoji & Title & Action Menu */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 group-hover:scale-110 transition-transform">
                          {group.emoji}
                        </span>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {group.name}
                          </h3>
                          {group.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {group.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Dropdown Menu */}
                      <div
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId(openMenuId === group.id ? null : group.id)
                          }
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {openMenuId === group.id && (
                          <div
                            className="absolute right-0 mt-1 w-36 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl p-1.5 z-20 animate-in fade-in slide-in-from-top-1"
                            onMouseLeave={() => setOpenMenuId(null)}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                setGroupToEdit(group);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              <Edit2 size={13} />
                              <span>Edit Group</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                setGroupToDelete(group);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Member Avatars */}
                    <div className="flex items-center gap-2 mt-4">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {group.members.map((m) => (
                          <Avatar key={m.id} name={m.name} color={m.color} size="xs" showTooltip />
                        ))}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {group.members.length} members
                      </span>
                    </div>
                  </div>

                  {/* Bottom Stats Footer */}
                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Total Spent
                      </span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        {formatINR(groupTotal)}
                      </span>
                    </div>

                    <div className="text-right">
                      {currentMemberId && isUserInGroup ? (
                        userNetInGroup > 0 ? (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            Gets back {formatINR(userNetInGroup)}
                          </span>
                        ) : userNetInGroup < 0 ? (
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                            Owes {formatINR(Math.abs(userNetInGroup))}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">
                            Settled up
                          </span>
                        )
                      ) : (
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          <span>View group</span>
                          <ArrowRight size={13} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <GroupModal
        isOpen={isCreateModalOpen}
        onSave={(data) => {
          const newGroup: Group = {
            id: `grp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: data.name,
            emoji: data.emoji,
            description: data.description,
            members: data.members,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          onCreateGroup(newGroup);
          setIsCreateModalOpen(false);
          // Auto navigate to the newly created group
          onSelectGroup(newGroup.id);
        }}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Group Modal */}
      <GroupModal
        isOpen={groupToEdit !== null}
        groupToEdit={groupToEdit}
        existingExpenses={expenses}
        onSave={(data) => {
          if (groupToEdit) {
            onUpdateGroup({
              ...groupToEdit,
              name: data.name,
              emoji: data.emoji,
              description: data.description,
              members: data.members,
              updatedAt: new Date().toISOString(),
            });
            setGroupToEdit(null);
          }
        }}
        onClose={() => setGroupToEdit(null)}
      />

      {/* Delete Group Confirmation Modal */}
      <ConfirmModal
        isOpen={groupToDelete !== null}
        title="Delete Group?"
        message={`Are you sure you want to delete "${groupToDelete?.name}"? All expenses in this group will be permanently deleted.`}
        confirmText="Delete Group"
        confirmVariant="danger"
        onConfirm={() => {
          if (groupToDelete) {
            onDeleteGroup(groupToDelete.id);
            setGroupToDelete(null);
          }
        }}
        onCancel={() => setGroupToDelete(null)}
      />
    </div>
  );
};
