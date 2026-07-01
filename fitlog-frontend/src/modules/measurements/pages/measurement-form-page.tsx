import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { PageHeader } from '@/shared/ui/page-header';
import { IconButton } from '@/shared/ui/icon-button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { MeasurementForm } from '../components/measurement-form';
import {
  useCreateMeasurement,
  useDeleteMeasurement,
  useMeasurementQuery,
  useUpdateMeasurement,
} from '../hooks/use-measurements';
import type { MeasurementInput } from '../domain/measurement.types';

export function MeasurementFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ measurementId?: string }>();
  const id = params.measurementId;
  const isEdit = !!id;

  const detail = useMeasurementQuery(id);
  const createMutation = useCreateMeasurement();
  const updateMutation = useUpdateMeasurement();
  const deleteMutation = useDeleteMeasurement();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(input: MeasurementInput) {
    setErrorMsg(null);
    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, input });
      } else {
        await createMutation.mutateAsync(input);
      }
      navigate('/medidas');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.';
      setErrorMsg(message);
    }
  }

  async function handleDelete() {
    if (!id) return;
    await deleteMutation.mutateAsync(id);
    setConfirmDeleteOpen(false);
    navigate('/medidas');
  }

  if (isEdit && detail.isLoading) {
    return (
      <>
        <PageHeader title={t('measurements.edit')} back />
        <p className="py-8 text-center text-sm text-fg-muted">
          {t('common.loading')}
        </p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={isEdit ? t('measurements.edit') : t('measurements.new')}
        back
        actions={
          isEdit && (
            <IconButton
              label={t('common.delete')}
              tone="danger"
              onClick={() => setConfirmDeleteOpen(true)}
            >
              <Trash2 className="h-5 w-5" />
            </IconButton>
          )
        }
      />
      {errorMsg && (
        <p className="mb-3 rounded-xl bg-failure/10 px-3 py-2 text-sm text-failure">
          {errorMsg}
        </p>
      )}
      <MeasurementForm
        initial={detail.data ?? undefined}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
      />
      <ConfirmDialog
        open={confirmDeleteOpen}
        title={t('common.delete')}
        description={t('measurements.deleteConfirm')}
        destructive
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </>
  );
}
