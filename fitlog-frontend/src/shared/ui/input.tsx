import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, invalid, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-sm bg-surface-2 border border-line px-3 text-fg placeholder:text-fg-subtle',
        'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30',
        invalid && 'border-failure focus:border-failure focus:ring-failure/30',
        className,
      )}
      {...rest}
    />
  );
});
