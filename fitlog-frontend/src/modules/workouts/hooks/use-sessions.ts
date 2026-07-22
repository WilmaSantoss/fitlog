import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sessionService } from '../services/session.service';
import type { SessionSet } from '../domain/workout.types';

const KEYS = {
  finished: ['sessions', 'finished'] as const,
  active: ['sessions', 'active'] as const,
  detail: (id: string | undefined) => ['sessions', 'detail', id ?? null] as const,
  previous: (sessionId: string | undefined) =>
    ['sessions', 'previous', sessionId ?? null] as const,
  exerciseSummaries: ['sessions', 'exerciseSummaries'] as const,
  exerciseEvolution: (name: string) =>
    ['sessions', 'exerciseEvolution', name.trim().toLowerCase()] as const,
};

export function usePreviousByExerciseQuery(sessionId: string | undefined) {
  return useQuery({
    queryKey: KEYS.previous(sessionId),
    queryFn: () =>
      sessionId ? sessionService.previousByExercise(sessionId) : new Map(),
    enabled: !!sessionId,
  });
}

export function useExerciseSummariesQuery() {
  return useQuery({
    queryKey: KEYS.exerciseSummaries,
    queryFn: () => sessionService.exerciseSummaries(),
  });
}

export function useExerciseEvolutionQuery(name: string | null) {
  return useQuery({
    queryKey: KEYS.exerciseEvolution(name ?? ''),
    queryFn: () => (name ? sessionService.exerciseEvolution(name) : []),
    enabled: !!name,
  });
}

export function useRoutineExerciseAveragesQuery(
  routineId: string | null,
  excludeSessionId?: string,
) {
  return useQuery({
    queryKey: [
      'sessions',
      'routineExerciseAverages',
      routineId,
      excludeSessionId ?? null,
    ] as const,
    queryFn: () =>
      sessionService.routineExerciseAverages(routineId, excludeSessionId),
    enabled: !!routineId,
  });
}

export function useFinishedSessionsQuery() {
  return useQuery({
    queryKey: KEYS.finished,
    queryFn: () => sessionService.listFinished(),
  });
}

export function useActiveSessionsQuery() {
  return useQuery({
    queryKey: KEYS.active,
    queryFn: () => sessionService.listActive(),
  });
}

export function useSessionQuery(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      if (!id) return undefined;
      return sessionService.get(id);
    },
    enabled: !!id,
  });
}

export function useStartSessionFromRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routineId: string) =>
      sessionService.startFromRoutine(routineId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.active });
    },
  });
}

type UpdateSetVars = {
  readonly sessionId: string;
  readonly exerciseId: string;
  readonly setId: string;
  readonly patch: Partial<
    Pick<SessionSet, 'actualReps' | 'actualWeightKg' | 'completed'>
  >;
};

// updateSet faz read-modify-write no Supabase. Se duas mutations concorrentes
// leem o mesmo estado antigo, a última write sobrescreve a anterior — kg/reps
// somem silenciosamente. Serializamos por sessionId pra evitar o race.
const sessionMutationChains = new Map<string, Promise<unknown>>();

function serializePerSession<T>(
  sessionId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const prev = sessionMutationChains.get(sessionId) ?? Promise.resolve();
  const next = prev.catch(() => undefined).then(fn);
  sessionMutationChains.set(
    sessionId,
    next.catch(() => undefined),
  );
  return next;
}

const UPDATE_SET_MUTATION_KEY = ['updateSessionSet'] as const;

export function useUpdateSessionSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: UPDATE_SET_MUTATION_KEY,
    mutationFn: (vars: UpdateSetVars) =>
      serializePerSession(vars.sessionId, () =>
        sessionService.updateSet(
          vars.sessionId,
          vars.exerciseId,
          vars.setId,
          vars.patch,
        ),
      ),
    onMutate: async (vars) => {
      const key = KEYS.detail(vars.sessionId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData(key);
      qc.setQueryData(key, (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        const session = old as {
          exercises: ReadonlyArray<{
            id: string;
            sets: ReadonlyArray<SessionSet>;
            completedAt: string | null;
          }>;
        };
        return {
          ...session,
          exercises: session.exercises.map((ex) => {
            if (ex.id !== vars.exerciseId) return ex;
            const sets = ex.sets.map((s) =>
              s.id === vars.setId ? { ...s, ...vars.patch } : s,
            );
            const allCompleted =
              sets.length > 0 && sets.every((s) => s.completed);
            return {
              ...ex,
              sets,
              completedAt: allCompleted
                ? (ex.completedAt ?? new Date().toISOString())
                : null,
            };
          }),
        };
      });
      return { previous };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEYS.detail(vars.sessionId), ctx.previous);
    },
    onSettled: (_d, _err, vars) => {
      // Só invalida quando esta é a última mutation da fila. Se ainda há outras
      // pendentes, o refetch traria estado servidor antes das próximas serem
      // aplicadas — sobrescreveria os optimistic updates e faria os checks
      // marcados piscarem.
      const pending = qc.isMutating({ mutationKey: UPDATE_SET_MUTATION_KEY });
      if (pending <= 1) {
        void qc.invalidateQueries({ queryKey: KEYS.detail(vars.sessionId) });
      }
    },
  });
}

export function useUpdateSessionNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      notes,
    }: {
      readonly sessionId: string;
      readonly notes: string | null;
    }) => sessionService.updateNotes(sessionId, notes),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: KEYS.detail(vars.sessionId) });
    },
  });
}

export function useFinishSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => sessionService.finish(sessionId),
    onSuccess: (_d, sessionId) => {
      void qc.invalidateQueries({ queryKey: KEYS.detail(sessionId) });
      void qc.invalidateQueries({ queryKey: KEYS.finished });
      void qc.invalidateQueries({ queryKey: KEYS.active });
      void qc.invalidateQueries({ queryKey: KEYS.exerciseSummaries });
      void qc.invalidateQueries({ queryKey: ['sessions', 'exerciseEvolution'] });
      void qc.invalidateQueries({ queryKey: ['sessions', 'previous'] });
      void qc.invalidateQueries({
        queryKey: ['sessions', 'routineExerciseAverages'],
      });
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.finished });
      void qc.invalidateQueries({ queryKey: KEYS.active });
    },
  });
}
