import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './button';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(92vw,28rem)] rounded-lg border border-line bg-surface p-0 text-fg backdrop:bg-black/60"
    >
      <div className="flex flex-col gap-3 p-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-fg-muted">{description}</p>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            onClick={onConfirm}
          >
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
