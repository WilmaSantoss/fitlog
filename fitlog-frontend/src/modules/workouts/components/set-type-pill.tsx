import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import type { SetType } from '../domain/workout.types';

type Props = {
  type: SetType;
  workingNumber?: number;
  className?: string;
};

const styles: Record<SetType, string> = {
  warmup: 'text-warmup',
  normal: 'text-fg',
  failure: 'text-failure',
  dropset: 'text-dropset',
  cluster:
    'text-cluster ring-1 ring-cluster/60 bg-cluster/10 rounded-md',
  restPause:
    'text-restpause ring-1 ring-restpause/60 bg-restpause/10 rounded-md',
};

export function SetTypePill({ type, workingNumber, className }: Props) {
  const { t } = useTranslation();
  const label =
    type === 'normal'
      ? String(workingNumber ?? '·')
      : t(`workouts.setTypeShort.${type}`);
  return (
    <span
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center text-sm font-bold',
        styles[type],
        className,
      )}
      title={t(`workouts.setTypes.${type}`)}
    >
      {label}
    </span>
  );
}
