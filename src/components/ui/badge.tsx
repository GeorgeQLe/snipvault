import type { HTMLAttributes } from 'react';

type BadgeColor = 'blue' | 'green' | 'purple' | 'gray' | 'red' | 'yellow' | 'orange' | 'pink';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  children: React.ReactNode;
}

const colorStyles: Record<BadgeColor, string> = {
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  green: 'bg-green-500/15 text-green-400 border-green-500/25',
  purple: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  gray: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
  red: 'bg-red-500/15 text-red-400 border-red-500/25',
  yellow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  orange: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  pink: 'bg-pink-500/15 text-pink-400 border-pink-500/25',
};

export function Badge({ color = 'gray', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border ${colorStyles[color]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
