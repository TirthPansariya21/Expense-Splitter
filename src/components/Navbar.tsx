import React, { useState } from 'react';
import {
  Moon,
  Sun,
  RotateCcw,
  Sparkles,
  Users,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { Member } from '../types';
import { Avatar } from './Avatar';
import { ConfirmModal } from './ConfirmModal';

interface NavbarProps {
  currentGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  groupName?: string;
  groupEmoji?: string;
  members?: Member[];
  currentMemberId: string | null;
  onSelectCurrentMember: (memberId: string | null) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onResetDemoData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentGroupId,
  onSelectGroup,
  groupName,
  groupEmoji,
  members = [],
  currentMemberId,
  onSelectCurrentMember,
  isDarkMode,
  onToggleDarkMode,
  onResetDemoData,
}) => {
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const activeMember = members.find((m) => m.id === currentMemberId);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand & Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => onSelectGroup(null)}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Sparkles size={20} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 dark:from-white dark:via-indigo-200 dark:to-sky-300 bg-clip-text text-transparent">
                  SplitEasy
                </span>
                <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 -mt-1">
                  Fair splits. Zero friction.
                </span>
              </div>
            </button>

            {currentGroupId && groupName && (
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
                <button
                  onClick={() => onSelectGroup(currentGroupId)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate transition-colors cursor-pointer"
                >
                  <span>{groupEmoji || '👥'}</span>
                  <span className="truncate max-w-[120px] sm:max-w-[200px]">{groupName}</span>
                </button>
              </div>
            )}
          </div>

          {/* Right actions: Member Perspective, Dark Mode, Reset */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Perspective Selector (Who are you?) */}
            {members.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Switch whose balance you are viewing"
                >
                  {activeMember ? (
                    <>
                      <Avatar name={activeMember.name} color={activeMember.color} size="xs" />
                      <span className="hidden md:inline text-slate-500 dark:text-slate-400">Viewing as:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 max-w-[90px] truncate">
                        {activeMember.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <Users size={14} className="text-indigo-600 dark:text-indigo-400" />
                      <span className="font-semibold text-slate-900 dark:text-slate-100">All View</span>
                    </>
                  )}
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {showMemberDropdown && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setShowMemberDropdown(false)}
                  >
                    <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Select your profile
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCurrentMember(null);
                        setShowMemberDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        currentMemberId === null
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Layers size={15} />
                      <span>Group Overview (No filter)</span>
                    </button>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                    {members.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          onSelectCurrentMember(m.id);
                          setShowMemberDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          currentMemberId === m.id
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Avatar name={m.name} color={m.color} size="xs" />
                        <span className="truncate">{m.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
            </button>

            {/* Reset Demo Data Button */}
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
              title="Reset Demo Data"
              aria-label="Reset Demo Data"
            >
              <RotateCcw size={17} />
            </button>
          </div>
        </div>
      </header>

      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Reset to Demo Data?"
        message="This will overwrite current groups and expenses with the default 'Manali Trip' and 'Room 214' demo dataset. All custom changes will be replaced."
        confirmText="Reset Everything"
        confirmVariant="danger"
        onConfirm={() => {
          setIsResetConfirmOpen(false);
          onResetDemoData();
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </>
  );
};
