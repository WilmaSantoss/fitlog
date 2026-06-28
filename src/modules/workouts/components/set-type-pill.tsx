import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import type { SetType } from '../domain/workout.types';

type Props = {
  type: SetType;
  workingNumber?: number;
  className?: string;
};

const colors: Record<SetType, string> = {
  warmup: 'text-warmup',
  normal: 'text-fg',
  failure: 'text-failure',
  dropset: 'text-dropset',
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
        colors[type],
        className,
      )}
      title={t(`workouts.setTypes.${type}`)}
    >
      {label}
    </span>
  );
}
