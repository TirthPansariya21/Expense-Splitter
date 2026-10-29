import React from 'react';
import { Utensils, Plane, Home, ShoppingBag, Receipt, Tag, ArrowRightLeft } from 'lucide-react';
import { ExpenseCategory } from '../types';
import { CATEGORIES } from '../utils/constants';

interface CategoryIconProps {
  category: ExpenseCategory | 'Settlement';
  size?: number;
  className?: string;
  withBackground?: boolean;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  size = 18,
  className = '',
  withBackground = false,
}) => {
  if (category === 'Settlement') {
    const icon = <ArrowRightLeft size={size} className="text-emerald-600 dark:text-emerald-400" />;
    if (!withBackground) return <span className={className}>{icon}</span>;
    return (
      <div className={`p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center ${className}`}>
        {icon}
      </div>
    );
  }

  const meta = CATEGORIES[category] || CATEGORIES.Other;

  const renderIcon = () => {
    switch (category) {
      case 'Food':
        return <Utensils size={size} />;
      case 'Travel':
        return <Plane size={size} />;
      case 'Stay':
        return <Home size={size} />;
      case 'Shopping':
        return <ShoppingBag size={size} />;
      case 'Bills':
        return <Receipt size={size} />;
      default:
        return <Tag size={size} />;
    }
  };

  if (!withBackground) {
    return <span className={`${meta.textColor} ${className}`}>{renderIcon()}</span>;
  }

  return (
    <div
      className={`p-2.5 rounded-xl ${meta.bgColor} ${meta.darkBgColor} ${meta.textColor} border border-slate-200/50 dark:border-slate-800 flex items-center justify-center shrink-0 ${className}`}
    >
      {renderIcon()}
    </div>
  );
};
