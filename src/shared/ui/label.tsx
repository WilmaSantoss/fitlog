import type { LabelHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type Props = LabelHTMLAttributes<HTMLLabelElement> & {
  children: ReactNode;
  optional?: boolean;
};

export function Label({ children, optional, className, ...rest }: Props) {
  return (
    <label
      className={cn(
        'flex min-h-10 items-end gap-1 text-sm font-medium leading-tight text-fg-muted',
        className,
      )}
      {...rest}
    >
      <span>{children}</span>
      {optional && (
        <span className="text-xs font-normal text-fg-subtle">(opc.)</span>
      )}
    </label>
  );
}
