import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line py-12 px-6 text-center',
        className,
      )}
    >
      {icon && <div className="text-fg-subtle">{icon}</div>}
      <h2 className="text-base font-medium text-fg">{title}</h2>
      {description && (
        <p className="text-sm text-fg-muted max-w-xs">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
