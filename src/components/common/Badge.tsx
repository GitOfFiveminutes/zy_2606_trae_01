import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type Variant = 'default' | 'brand' | 'warning' | 'danger' | 'info' | 'gray';

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-700',
  brand: 'bg-brand-50 text-brand-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
  info: 'bg-info-50 text-info-700',
  gray: 'bg-gray-50 text-gray-600',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={cn('badge', variantClasses[variant], className)}>
      {children}
    </span>
  );
}
