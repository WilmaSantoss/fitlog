import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { formatKg } from '@/shared/lib/format';
import type { SessionRecord } from '../services/session.service';

type Props = {
  open: boolean;
  records: readonly SessionRecord[];
  onClose: () => void;
};

// Mantém a ordem dos exercícios no treino.
function groupByExercise(
  records: readonly SessionRecord[],
): [string, SessionRecord[]][] {
  const groups = new Map<string, SessionRecord[]>();
  for (const r of records) {
    const list = groups.get(r.exerciseName) ?? [];
    list.push(r);
    groups.set(r.exerciseName, list);
  }
  return [...groups.entries()];
}

function pickRandom(list: readonly string[]): string {
  return list[Math.floor(Math.random() * list.length)] ?? '';
}

// Modal ao concluir o treino: frase sorteada (lista de recorde ou de
// "cobrança", conforme bateu recorde ou não) + recordes do dia.
export function FinishSummaryDialog({ open, records, onClose }: Props) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const hasRecords = records.length > 0;
  const [phrase, setPhrase] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      // Sorteia ao abrir — uma frase por conclusão, não a cada render.
      const phrases = t(
        hasRecords ? 'workouts.finishRecordPhrases' : 'workouts.finishNoRecordPhrases',
        { returnObjects: true },
      ) as readonly string[];
      setPhrase(pickRandom(phrases));
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, hasRecords, t]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(92vw,26rem)] rounded-2xl border border-line bg-surface p-0 text-fg backdrop:bg-black/70"
    >
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <span
          className={
            hasRecords
              ? 'animate-celebration-emoji text-5xl'
              : 'text-5xl'
          }
          aria-hidden
        >
          {hasRecords ? '🏆' : '🐔'}
        </span>
        <p className="text-xl font-bold leading-snug">{phrase}</p>

        {hasRecords ? (
          <div className="w-full">
            <p className="mb-2 flex items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-wider text-fg-subtle">
              <Trophy className="h-3.5 w-3.5" />
              {t('workouts.finishRecordsTitle', { count: records.length })}
            </p>
            <ul className="flex flex-col gap-1.5 text-left">
              {groupByExercise(records).map(([exerciseName, items]) => (
                <li
                  key={exerciseName}
                  className="rounded-xl border border-done/30 bg-done/10 px-3 py-2"
                >
                  <p className="text-sm font-semibold text-fg">{exerciseName}</p>
                  {items.map((r) => (
                    <p
                      key={`${r.kind}-${r.weightKg}`}
                      className="mt-0.5 text-xs text-fg-muted"
                    >
                      {r.kind === 'weight'
                        ? t('workouts.finishRecordWeight')
                        : t('workouts.finishRecordReps', { kg: formatKg(r.weightKg) })}
                      :{' '}
                      {/* Recorde de reps: o peso já está no rótulo, mostra só reps. */}
                      <span className="font-semibold text-done">
                        {r.kind === 'weight'
                          ? `${formatKg(r.weightKg)} × ${r.reps}`
                          : t('workouts.finishRepsValue', { count: r.reps })}
                      </span>{' '}
                      ·{' '}
                      {t('workouts.finishRecordBefore', {
                        value:
                          r.kind === 'weight'
                            ? `${formatKg(r.previous.weightKg)} × ${r.previous.reps}`
                            : r.previous.reps,
                      })}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-fg-muted">{t('workouts.finishNoRecords')}</p>
        )}

        <Button fullWidth onClick={onClose}>
          {t('workouts.finishClose')}
        </Button>
      </div>
    </dialog>
  );
}
