'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
}

const sizeClasses = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ size = 'lg', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('mx-auto px-4 sm:px-6 lg:px-8', sizeClasses[size], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';
