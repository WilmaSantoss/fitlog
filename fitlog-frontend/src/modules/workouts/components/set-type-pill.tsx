import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import type { SetType } from '../domain/workout.types';

type Props = {
  type: SetType;
  className?: string;
};

const styles: Record<SetType, string> = {
  WU: 'text-warmup',
  FS: 'text-feeder',
  WS: 'text-working',
};

export function SetTypePill({ type, className }: Props) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        'inline-flex h-7 min-w-7 items-center justify-center px-1 text-sm font-bold tabular-nums',
        styles[type],
        className,
      )}
      title={t(`workouts.setTypes.${type}`)}
    >
      {type}
    </span>
  );
}
