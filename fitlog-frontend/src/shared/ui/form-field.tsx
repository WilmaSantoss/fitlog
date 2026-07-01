import type { ReactNode } from 'react';
import { Label } from './label';
import { cn } from '@/shared/lib/cn';

type Props = {
  label: ReactNode;
  htmlFor?: string;
  optional?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({
  label,
  htmlFor,
  optional,
  error,
  hint,
  children,
  className,
}: Props) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor} optional={optional}>
        {label}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-fg-subtle">{hint}</p>}
      {error && <p className="text-xs text-failure">{error}</p>}
    </div>
  );
}
