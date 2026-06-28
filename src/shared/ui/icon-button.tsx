import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  tone?: 'default' | 'danger' | 'accent';
};

const toneClasses: Record<NonNullable<Props['tone']>, string> = {
  default: 'text-fg-muted hover:bg-surface-2 hover:text-fg',
  danger: 'text-failure hover:bg-failure/10',
  accent: 'text-accent hover:bg-accent/10',
};

export const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { label, children, tone = 'default', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
        toneClasses[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
