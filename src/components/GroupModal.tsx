import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Users, AlertCircle } from 'lucide-react';
import { Group, Member, Expense } from '../types';
import { GROUP_EMOJIS, MEMBER_COLORS } from '../utils/constants';

interface GroupModalProps {
  isOpen: boolean;
  groupToEdit?: Group | null;
  existingExpenses?: Expense[];
  onSave: (groupData: { name: string; emoji: string; description: string; members: Member[] }) => void;
  onClose: () => void;
}

export const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  groupToEdit,
  existingExpenses = [],
  onSave,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏔️');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (groupToEdit) {
      setName(groupToEdit.name);
      setEmoji(groupToEdit.emoji || '👥');
      setDescription(groupToEdit.description || '');
      setMembers([...groupToEdit.members]);
    } else {
      setName('');
      setEmoji(GROUP_EMOJIS[Math.floor(Math.random() * GROUP_EMOJIS.length)]);
      setDescription('');
      setMembers([
        { id: `m-${Date.now()}-1`, name: 'You', color: MEMBER_COLORS[0] },
        { id: `m-${Date.now()}-2`, name: '', color: MEMBER_COLORS[1] },
      ]);
    }
    setNewMemberName('');
    setError(null);
  }, [groupToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddMember = () => {
    const trimmed = newMemberName.trim();
    if (!trimmed) return;

    if (members.some((m) => m.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      setError(`A member named "${trimmed}" already exists.`);
      return;
    }

    const nextColor = MEMBER_COLORS[members.length % MEMBER_COLORS.length];
    setMembers([
      ...members,
      {
        id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: trimmed,
        color: nextColor,
      },
    ]);
    setNewMemberName('');
    setError(null);
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    // Check if this member is part of any existing expenses
    if (groupToEdit) {
      const hasExpenses = existingExpenses.some(
        (exp) =>
          exp.groupId === groupToEdit.id &&
          (exp.paidById === memberId || exp.splits.some((s) => s.memberId === memberId))
      );

      if (hasExpenses) {
        setError(
          `Cannot remove "${memberName}" because they have existing expenses or owe money in this group. Settle or delete their expenses first.`
        );
        return;
      }
    }

    if (members.length <= 1) {
      setError('A group must have at least one member.');
      return;
    }

    setMembers(members.filter((m) => m.id !== memberId));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a group name.');
      return;
    }

    const validMembers = members
      .map((m) => ({ ...m, name: m.name.trim() }))
      .filter((m) => m.name.length > 0);

    if (validMembers.length === 0) {
      setError('Please add at least one member.');
      return;
    }

    // Check for duplicates
    const names = validMembers.map((m) => m.name.toLowerCase());
    const hasDups = new Set(names).size !== names.length;
    if (hasDups) {
      setError('Member names must be unique.');
      return;
    }

    onSave({
      name: name.trim(),
      emoji,
      description: description.trim(),
      members: validMembers,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{emoji}</span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {groupToEdit ? 'Edit Group' : 'Create New Group'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hostel flat, road trip, weekend outing, or flatmates
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/40 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Emoji Picker & Group Name */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Icon & Group Name
            </label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={emoji}
                  maxLength={4}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-14 h-12 text-center text-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Manali Trip, Room 214, Goa Party"
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                autoFocus
              />
            </div>
            {/* Quick Emoji selection */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-1">
              <span className="text-[11px] font-medium text-slate-400 shrink-0">Quick picks:</span>
              {GROUP_EMOJIS.slice(0, 8).map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-7 h-7 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer ${
                    emoji === e ? 'bg-indigo-100 dark:bg-indigo-950/60 ring-1 ring-indigo-500' : ''
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. October long weekend mountain getaway"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Members List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <Users size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>Group Members ({members.filter((m) => m.name.trim().length > 0).length})</span>
              </label>
              <span className="text-[11px] text-slate-400">At least 1 member</span>
            </div>

            {/* Existing Members */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {members.map((member, index) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2.5 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80"
                >
                  <div
                    className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0"
                    style={{ backgroundColor: member.color || MEMBER_COLORS[index % MEMBER_COLORS.length] }}
                  >
                    {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => {
                      const updated = [...members];
                      updated[index].name = e.target.value;
                      setMembers(updated);
                    }}
                    placeholder={`Member ${index + 1} name`}
                    className="flex-1 bg-transparent border-0 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-hidden placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.id, member.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Remove member"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Member Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMember();
                  }
                }}
                placeholder="Add another person by name..."
                className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddMember}
                className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-semibold rounded-xl text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus size={16} />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {groupToEdit ? 'Save Changes' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
