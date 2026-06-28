import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export type BadgeTone = 'default' | 'accent' | 'warmup' | 'failure' | 'dropset' | 'success';

type Props = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
};

const toneClasses: Record<BadgeTone, string> = {
  default: 'bg-surface-2 text-fg-muted',
  accent: 'bg-accent/15 text-accent',
  warmup: 'text-warmup',
  failure: 'text-failure',
  dropset: 'text-dropset',
  success: 'bg-success/15 text-success',
};

export function Badge({ children, tone = 'default', className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
