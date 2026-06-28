import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/shared/ui/page-header';
import { RoutineForm } from '../components/routine-form';
import {
  useCreateRoutine,
  useRoutineQuery,
  useUpdateRoutine,
} from '../hooks/use-routines';
import type { RoutineInput } from '../services/routine.service';

export function RoutineFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ routineId?: string }>();
  const id = params.routineId;
  const isEdit = !!id;

  const detail = useRoutineQuery(id);
  const createMutation = useCreateRoutine();
  const updateMutation = useUpdateRoutine();

  async function handleSubmit(input: RoutineInput) {
    if (isEdit && id) {
      await updateMutation.mutateAsync({ id, input });
      navigate(`/treino/${id}`);
    } else {
      const created = await createMutation.mutateAsync(input);
      navigate(`/treino/${created.id}`);
    }
  }

  if (isEdit && detail.isLoading) {
    return (
      <>
        <PageHeader title={t('workouts.editRoutine')} back />
        <p className="py-8 text-center text-sm text-fg-muted">
          {t('common.loading')}
        </p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={isEdit ? t('workouts.editRoutine') : t('workouts.newRoutine')}
        back
      />
      <RoutineForm
        initial={detail.data ?? undefined}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
}
