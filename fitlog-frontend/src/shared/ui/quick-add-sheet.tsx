import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Plus, Ruler } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function QuickAddSheet({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  const items = [
    {
      Icon: Dumbbell,
      label: t('quickAdd.startWorkout'),
      hint: t('quickAdd.startWorkoutHint'),
      onClick: () => go('/treino'),
    },
    {
      Icon: Ruler,
      label: t('quickAdd.newMeasurement'),
      hint: t('quickAdd.newMeasurementHint'),
      onClick: () => go('/medidas/nova'),
    },
    {
      Icon: Plus,
      label: t('quickAdd.newRoutine'),
      hint: t('quickAdd.newRoutineHint'),
      onClick: () => go('/treino/novo'),
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('quickAdd.title')}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:hidden"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-line/60 bg-surface px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        <h2 className="mb-4 text-base font-semibold text-fg">
          {t('quickAdd.title')}
        </h2>
        <ul className="flex flex-col gap-2">
          {items.map(({ Icon, label, hint, onClick }) => (
            <li key={label}>
              <button
                type="button"
                onClick={onClick}
                className="flex w-full items-center gap-3 rounded-xl border border-line/60 bg-surface-2/60 px-4 py-3 text-left transition-colors hover:bg-surface-2"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-fg">
                    {label}
                  </span>
                  <span className="block text-xs text-fg-muted">{hint}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
