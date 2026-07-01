import { cn } from '@/shared/lib/cn';

type Props = {
  size?: 'sm' | 'md';
  showWordmark?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: 'h-7 w-7 text-sm',
  md: 'h-9 w-9 text-base',
};

export function Logo({ size = 'md', showWordmark = false, className }: Props) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-md bg-accent font-bold text-on-accent shadow-sm shadow-accent/40',
          sizeClasses[size],
        )}
        aria-hidden="true"
      >
        F
      </span>
      {showWordmark ? (
        <span className="text-sm font-bold tracking-wide text-fg">FITLOG</span>
      ) : null}
    </div>
  );
}
