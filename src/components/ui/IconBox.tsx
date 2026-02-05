'use client';

import { cn } from '@/lib/cn';

export interface IconBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-600',
  primary: 'bg-primary-100 text-primary-600',
  secondary: 'bg-secondary-100 text-secondary-600',
  success: 'bg-emerald-100 text-emerald-600',
  warning: 'bg-amber-100 text-amber-600',
  error: 'bg-red-100 text-red-600',
};

const sizeClasses = {
  sm: 'w-8 h-8 text-lg',
  md: 'w-10 h-10 text-xl',
  lg: 'w-12 h-12 text-2xl',
};

export function IconBox({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}: IconBoxProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-xl',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
