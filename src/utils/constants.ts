import { ExpenseCategory } from '../types';

export interface CategoryMeta {
  id: ExpenseCategory;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  darkBgColor: string;
  textColor: string;
}

export const CATEGORIES: Record<ExpenseCategory, CategoryMeta> = {
  Food: {
    id: 'Food',
    label: 'Food & Dining',
    icon: 'Utensils',
    color: '#f97316',
    bgColor: 'bg-orange-50',
    darkBgColor: 'dark:bg-orange-950/40',
    textColor: 'text-orange-600 dark:text-orange-400',
  },
  Travel: {
    id: 'Travel',
    label: 'Travel & Commute',
    icon: 'Plane',
    color: '#0284c7',
    bgColor: 'bg-sky-50',
    darkBgColor: 'dark:bg-sky-950/40',
    textColor: 'text-sky-600 dark:text-sky-400',
  },
  Stay: {
    id: 'Stay',
    label: 'Stay & Hotel',
    icon: 'Home',
    color: '#8b5cf6',
    bgColor: 'bg-purple-50',
    darkBgColor: 'dark:bg-purple-950/40',
    textColor: 'text-purple-600 dark:text-purple-400',
  },
  Shopping: {
    id: 'Shopping',
    label: 'Shopping',
    icon: 'ShoppingBag',
    color: '#ec4899',
    bgColor: 'bg-pink-50',
    darkBgColor: 'dark:bg-pink-950/40',
    textColor: 'text-pink-600 dark:text-pink-400',
  },
  Bills: {
    id: 'Bills',
    label: 'Bills & Utilities',
    icon: 'Receipt',
    color: '#10b981',
    bgColor: 'bg-emerald-50',
    darkBgColor: 'dark:bg-emerald-950/40',
    textColor: 'text-emerald-600 dark:text-emerald-400',
  },
  Other: {
    id: 'Other',
    label: 'Other',
    icon: 'Tag',
    color: '#64748b',
    bgColor: 'bg-slate-50',
    darkBgColor: 'dark:bg-slate-800/40',
    textColor: 'text-slate-600 dark:text-slate-400',
  },
};

export const MEMBER_COLORS = [
  '#2563eb', // Blue
  '#059669', // Emerald
  '#d97706', // Amber
  '#7c3aed', // Violet
  '#db2777', // Pink
  '#0891b2', // Cyan
  '#ea580c', // Orange
  '#4f46e5', // Indigo
];

export const GROUP_EMOJIS = ['🏔️', '🏠', '✈️', '🍕', '🏕️', '🏖️', '🎮', '🚗', '🍻', '☕', '💼', '🎓', '🎉', '🎸', '🏖️'];
