import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';

type Props = {
  open: boolean;
  exerciseName: string;
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
};

// Nota do exercício num modal — no card fica só o ícone, pra não ocupar
// espaço com um campo quase sempre vazio.
export function ExerciseNoteDialog({
  open,
  exerciseName,
  value,
  onSave,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Rascunho local: Cancelar descarta, Salvar aplica no formulário.
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setDraft(value);
      dialog.showModal();
      textareaRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, value]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="m-auto mt-[12vh] w-[min(94vw,28rem)] rounded-2xl border border-line bg-surface p-0 text-fg backdrop:bg-black/70"
    >
      <div className="flex flex-col gap-3 p-5">
        <div>
          <h2 className="text-lg font-semibold">{t('workouts.exerciseNoteTitle')}</h2>
          {exerciseName.trim() && (
            <p className="mt-0.5 truncate text-sm text-fg-muted">{exerciseName}</p>
          )}
        </div>
        <Textarea
          ref={textareaRef}
          rows={4}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('workouts.exerciseNotePlaceholder')}
          className="rounded-lg text-[15px]"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={() => onSave(draft)}>
            {t('common.save')}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
