import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { measurementService } from '../services/measurement.service';
import type {
  MeasurementInput,
  MeasurementMetric,
} from '../domain/measurement.types';

const KEYS = {
  all: ['measurements'] as const,
  detail: (id: string | undefined) => ['measurements', 'detail', id ?? null] as const,
  evolution: (metric: MeasurementMetric) =>
    ['measurements', 'evolution', metric] as const,
};

export function useMeasurementsQuery() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: () => measurementService.list(),
  });
}

export function useMeasurementQuery(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      if (!id) return undefined;
      return measurementService.get(id);
    },
    enabled: !!id,
  });
}

export function useEvolutionQuery(metric: MeasurementMetric) {
  return useQuery({
    queryKey: KEYS.evolution(metric),
    queryFn: () => measurementService.evolution(metric),
  });
}

export function useCreateMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MeasurementInput) => measurementService.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.all });
      void qc.invalidateQueries({ queryKey: ['measurements', 'evolution'] });
    },
  });
}

export function useUpdateMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MeasurementInput }) =>
      measurementService.update(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.all });
      void qc.invalidateQueries({ queryKey: ['measurements', 'evolution'] });
    },
  });
}

export function useDeleteMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => measurementService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.all });
      void qc.invalidateQueries({ queryKey: ['measurements', 'evolution'] });
    },
  });
}
