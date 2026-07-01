import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { className, invalid, children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        'h-11 w-full rounded-sm bg-surface-2 border border-line px-3 text-fg appearance-none',
        'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30',
        invalid && 'border-failure focus:border-failure focus:ring-failure/30',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
});
