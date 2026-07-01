import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  routineService,
  type RoutineInput,
} from '../services/routine.service';

const KEYS = {
  all: ['routines'] as const,
  detail: (id: string | undefined) => ['routines', 'detail', id ?? null] as const,
};

export function useRoutinesQuery() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: () => routineService.list(),
  });
}

export function useRoutineQuery(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      if (!id) return undefined;
      return routineService.get(id);
    },
    enabled: !!id,
  });
}

export function useCreateRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RoutineInput) => routineService.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useUpdateRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RoutineInput }) =>
      routineService.update(id, input),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: KEYS.all });
      void qc.invalidateQueries({ queryKey: KEYS.detail(vars.id) });
    },
  });
}

export function useDuplicateRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => routineService.duplicate(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useDeleteRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => routineService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}
