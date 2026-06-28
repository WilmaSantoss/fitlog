import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sessionService } from '../services/session.service';
import type { SessionSet } from '../domain/workout.types';

const KEYS = {
  finished: ['sessions', 'finished'] as const,
  active: ['sessions', 'active'] as const,
  detail: (id: string | undefined) => ['sessions', 'detail', id ?? null] as const,
};

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

export function useUpdateSessionSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: UpdateSetVars) =>
      sessionService.updateSet(
        vars.sessionId,
        vars.exerciseId,
        vars.setId,
        vars.patch,
      ),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: KEYS.detail(vars.sessionId) });
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
