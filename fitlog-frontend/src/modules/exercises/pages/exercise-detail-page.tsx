import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/shared/ui/page-header';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { useLibraryExerciseQuery } from '../hooks/use-exercise-library';
import { ExerciseAnimation } from '../components/exercise-animation';

const BACK = '/treino?tab=exercises';

export function ExerciseDetailPage() {
  const { t } = useTranslation();
  const params = useParams<{ exerciseId: string }>();
  const id = params.exerciseId ? decodeURIComponent(params.exerciseId) : null;
  const detail = useLibraryExerciseQuery(id);
  const exercise = detail.data;

  if (detail.isLoading) {
    return (
      <>
        <PageHeader title="…" back={BACK} />
        <p className="py-8 text-center text-sm text-fg-muted">
          {t('common.loading')}
        </p>
      </>
    );
  }

  if (!exercise) {
    return (
      <>
        <PageHeader title={t('exercises.title')} back={BACK} />
        <p className="py-8 text-center text-sm text-fg-muted">
          {t('exercises.notFound')}
        </p>
      </>
    );
  }

  return (
    <>
      <PageHeader title={exercise.name} subtitle={exercise.nameEn} back={BACK} />

      <Card className="overflow-hidden p-0">
        <ExerciseAnimation exercise={exercise} />
      </Card>

      <Card className="mt-3 flex flex-col gap-4">
        <InfoRow label={t('exercises.primaryMuscles')}>
          {exercise.primaryMuscles.map((m) => (
            <Badge key={m} tone="accent">
              {t(`exercises.muscles.${m}`)}
            </Badge>
          ))}
        </InfoRow>
        {exercise.secondaryMuscles.length > 0 && (
          <InfoRow label={t('exercises.secondaryMuscles')}>
            {exercise.secondaryMuscles.map((m) => (
              <Badge key={m}>{t(`exercises.muscles.${m}`)}</Badge>
            ))}
          </InfoRow>
        )}
        <InfoRow label={t('exercises.equipmentLabel')}>
          <Badge>
            {exercise.equipment
              ? t(`exercises.equipment.${exercise.equipment}`)
              : t('exercises.noEquipment')}
          </Badge>
        </InfoRow>
        <InfoRow label={t('exercises.categoryLabel')}>
          <Badge>{t(`exercises.categories.${exercise.category}`)}</Badge>
        </InfoRow>
      </Card>
    </>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
