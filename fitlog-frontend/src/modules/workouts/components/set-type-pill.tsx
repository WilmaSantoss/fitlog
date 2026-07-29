import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import type { SetType } from '../domain/workout.types';

type Props = {
  type: SetType;
  workingNumber?: number;
  className?: string;
};

const styles: Record<SetType, string> = {
  WU: 'text-warmup',
  FS: 'text-feeder',
  WS: 'text-working',
};

export function SetTypePill({ type, workingNumber, className }: Props) {
  const { t } = useTranslation();
  // WS mostra o número da série de trabalho (1, 2, 3…); WU/FS mostram a sigla.
  const label =
    type === 'WS' ? String(workingNumber ?? 'WS') : type;
  return (
    <span
      className={cn(
        'inline-flex h-7 min-w-7 items-center justify-center px-1 text-sm font-bold tabular-nums',
        styles[type],
        className,
      )}
      title={t(`workouts.setTypes.${type}`)}
    >
      {label}
    </span>
  );
}
