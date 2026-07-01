import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type Props = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
};

export const Card = forwardRef<HTMLDivElement, Props>(function Card(
  { className, interactive, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg bg-surface border border-line/60 p-4 shadow-md shadow-black/20',
        interactive &&
          'transition-all hover:bg-surface-2 hover:border-line cursor-pointer hover:-translate-y-px',
        className,
      )}
      {...rest}
    />
  );
});
