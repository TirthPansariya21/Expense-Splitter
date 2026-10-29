import React from 'react';

interface AvatarProps {
  name: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  color = '#3b82f6',
  size = 'md',
  className = '',
  showTooltip = false,
}) => {
  const getInitials = (n: string) => {
    if (!n) return '?';
    const parts = n.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-7 h-7 text-xs font-semibold',
    md: 'w-9 h-9 text-xs font-bold',
    lg: 'w-12 h-12 text-sm font-bold',
  }[size];

  return (
    <div
      title={showTooltip ? name : undefined}
      className={`relative inline-flex items-center justify-center rounded-full text-white font-medium shadow-xs shrink-0 select-none ${sizeClasses} ${className}`}
      style={{ backgroundColor: color }}
    >
      <span>{getInitials(name)}</span>
    </div>
  );
};
