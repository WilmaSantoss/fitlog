import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type Props = {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PageTitle({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: Props) {
  return (
    <header
      className={cn(
        'mb-6 flex flex-wrap items-start justify-between gap-4',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-fg-subtle">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-fg md:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-[13px] text-fg-muted">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
