import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { cn } from '@/shared/lib/cn';
import { useExerciseSearchQuery } from '../hooks/use-exercise-library';
import { MUSCLES, type Muscle } from '../domain/exercise.types';
import { ExerciseAnimation } from './exercise-animation';

const PAGE = 40;

export function ExerciseLibraryList() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<Muscle | null>(null);
  const [limit, setLimit] = useState(PAGE);
  // Busca local é rápida, mas 876 itens re-renderizando a cada tecla trava
  // o teclado no celular. Adia a lista um tique atrás do input.
  const deferredQuery = useDeferredValue(query);

  // limit + 1: sabe se tem mais sem contar a lista inteira.
  const searchQ = useExerciseSearchQuery(deferredQuery, {
    muscle,
    limit: limit + 1,
  });
  const results = searchQ.data ?? [];
  const visible = results.slice(0, limit);
  const hasMore = results.length > limit;

  function changeQuery(next: string) {
    setQuery(next);
    setLimit(PAGE);
  }

  function changeMuscle(next: Muscle | null) {
    setMuscle(next);
    setLimit(PAGE);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
        <Input
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => changeQuery(e.target.value)}
          placeholder={t('exercises.searchPlaceholder')}
          aria-label={t('exercises.searchPlaceholder')}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            type="button"
            onClick={() => changeQuery('')}
            aria-label={t('exercises.clearSearch')}
            className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-fg-subtle hover:bg-surface-2 hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]"
        role="group"
        aria-label={t('exercises.filterByMuscle')}
      >
        <MuscleChip
          active={muscle === null}
          onClick={() => changeMuscle(null)}
          label={t('exercises.allMuscles')}
        />
        {MUSCLES.map((m) => (
          <MuscleChip
            key={m}
            active={muscle === m}
            onClick={() => changeMuscle(muscle === m ? null : m)}
            label={t(`exercises.muscles.${m}`)}
          />
        ))}
      </div>

      {searchQ.isLoading && (
        <p className="py-8 text-center text-sm text-fg-muted">
          {t('common.loading')}
        </p>
      )}

      {!searchQ.isLoading && visible.length === 0 && (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title={t('exercises.empty')}
          description={t('exercises.emptyHint')}
        />
      )}

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {visible.map((exercise) => (
          <li key={exercise.id}>
            <Link
              to={`/exercicios/${encodeURIComponent(exercise.id)}`}
              className="flex items-center gap-3 rounded-2xl border border-line/60 bg-surface p-2 pr-3 transition-colors hover:border-line hover:bg-surface-2"
            >
              <ExerciseAnimation
                exercise={exercise}
                still
                className="w-24 shrink-0 rounded-xl"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium text-fg">
                  {exercise.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-fg-muted">
                  {[
                    ...exercise.primaryMuscles.map((m) =>
                      t(`exercises.muscles.${m}`),
                    ),
                    exercise.equipment
                      ? t(`exercises.equipment.${exercise.equipment}`)
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {hasMore && (
        <Button
          variant="secondary"
          fullWidth
          onClick={() => setLimit((n) => n + PAGE)}
        >
          {t('exercises.showMore')}
        </Button>
      )}

      <p className="pb-2 text-center text-[11px] text-fg-subtle">
        {t('exercises.credits')}
      </p>
    </div>
  );
}

function MuscleChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-accent bg-accent/15 text-fg'
          : 'border-line bg-surface-2 text-fg-muted hover:text-fg',
      )}
    >
      {label}
    </button>
  );
}
