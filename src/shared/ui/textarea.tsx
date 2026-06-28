import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { className, invalid, rows = 3, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'w-full rounded-sm bg-surface-2 border border-line px-3 py-2 text-fg placeholder:text-fg-subtle resize-y',
        'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30',
        invalid && 'border-failure focus:border-failure focus:ring-failure/30',
        className,
      )}
      {...rest}
    />
  );
});
